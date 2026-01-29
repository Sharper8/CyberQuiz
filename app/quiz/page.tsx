"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Trophy, Square } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import CyberBackground from "@/components/CyberBackground";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

// Comprehensive banned words list (matches backend validation)
const BANNED_WORDS = [
  // English profanity
  'ass', 'asshole', 'bitch', 'bitches', 'crap', 'damn', 'dammit', 'damnit',
  'dick', 'dickhead', 'dildo', 'fuck', 'fucked', 'fucker', 'fucking', 'fuckup',
  'fuckwit', 'hell', 'hellish', 'horny', 'jackass', 'jerk', 'jerkoff', 'nigger',
  'nigga', 'piss', 'pissed', 'pussy', 'shit', 'shitty', 'slut', 'whore',
  'wtf', 'wth', 'arsehole', 'arse', 'bollocks', 'bugger', 'cock', 'cockhead',
  'cunt', 'twat', 'bastard', 'bellend', 'blighter', 'bloody', 'damnable',
  'freaking', 'frickin', 'goddamn', 'goddam', 'goddamned', "hell's",
  'hells', 'motherfucker', 'motherfucking', 'prick', 'screw', 'screwed',
  'shag', 'sodding', 'sod', 'tosser', 'wanker', 'wank', 'douchebag',
  // French profanity
  'connard', 'connasse', 'salaud', 'salopard', 'saloperie', 'salope',
  'con', 'cons', 'conne', 'connes', 'enculé', 'enculée', 'enculés', 'enculées',
  'fils de pute', 'filsdepute', 'filsdeputa', 'foutre', 'foutaise', 'foutu',
  'nique', 'niquer', 'putain', 'putasserie', 'pute', 'putefrancaise', 'putan',
  'débile', 'débiles', 'débilité', 'débilités',
  'imbécile', 'imbéciles', 'imbécillité',
  'merde', 'merder', 'merdeur', 'merdeuse', 'merdreux',
  'sacrebleu', 'sacredieu', 'sacredie', 'sacredios', 'sacredis',
  'zut', 'zutement', 'zuterie',
  'couilles', 'couillon', 'couillons', 'couillonnade',
  'cul', 'culasse', 'culs', 'culerie',
  'fesse', 'fesses', 'fessefleur',
  'queue', 'queues',
  'trou du cul', 'trouducul', 'trous',
  'bite', 'bites', 'biter', 'bitée',
  'bidet', 'bidets',
  'boche', 'boches',
  'bordel', 'bordels', 'bordelaise', 'bordelaises',
  'bougre', 'bougres', 'bougrement',
  'branleur', 'branleuse', 'branleurs', 'branleuses',
  'chiasse', 'chiasserie', 'chiasseries',
  'chieur', 'chieuse', 'chieurs', 'chieuses',
  'couenne', 'couennes',
  'crasseux', 'crasseuse', 'crasserie', 'crasseries',
  'crotte', 'crottes', 'crottard', 'crottards',
  'dégobille', 'dégobilles', 'dégobiller',
  'dégueulis', 'dégueule', 'dégueulasses',
  'donzelle', 'donzelles',
  'dragée', 'dragées',
  'fange', 'fanges',
  'faquir', 'faquirs',
  'fêlé', 'fêlée', 'fêlés', 'fêlées',
];

const BANNED_WORDS_SET = new Set(BANNED_WORDS.map(word => word.toLowerCase()));

type QuizQuestion = {
  id: number;
  question: string;
  answer: boolean;
  category: string;
  explanation?: string;
};

function validateUsername(username: string): string | null {
  if (!username) return 'Pseudo requis';
  if (username.length < 3) return 'Pseudo au minimum 3 caractères';
  if (username.length > 32) return 'Pseudo au maximum 32 caractères';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Pseudo: uniquement lettres, chiffres, tirets et underscores';
  }
  const lowerUsername = username.toLowerCase();
  for (const bannedWord of BANNED_WORDS_SET) {
    if (lowerUsername.includes(bannedWord)) {
      return 'Pseudo contient du langage inapproprié';
    }
  }
  return null;
}

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "classic";
  const pseudo = searchParams.get("pseudo");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds per question
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(10); // Timer for answer reveal
  const [stoppingQuiz, setStoppingQuiz] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false); // Track timeout scenarios
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0); // Timer for how long on current question

  // Validate username and fetch questions on mount
  useEffect(() => {
    const validateAndFetch = async () => {
      // Validate username from URL
      if (!pseudo) {
        toast.error("Pseudo requis");
        router.push("/");
        return;
      }

      const validationError = validateUsername(pseudo);
      if (validationError) {
        toast.error(validationError);
        router.push("/");
        return;
      }

      // Fetch accepted questions from database with randomization
      try {
        const response = await api.getQuestions({ 
          status: 'accepted',
          randomize: true // Request random ordering from server
        });
        const acceptedQuestions = response.filter(q => q.status === 'accepted');

        if (acceptedQuestions.length === 0) {
          toast.error("Aucune question n'est disponible pour le moment. Réessayez plus tard.");
          setIsLoading(false);
          router.push("/");
          return;
        }

        const convertedQuestions = acceptedQuestions.map(apiQuestion => {
          // Parse correctAnswer to boolean
          // Accepts: "Vrai", "true", "1", "yes" → true
          // Accepts: "Faux", "false", "0", "no" → false
          const answerLower = String(apiQuestion.correctAnswer).toLowerCase().trim();
          const correctAnswer = 
            answerLower === 'true' ||
            answerLower === '1' ||
            answerLower === 'vrai' ||
            answerLower === 'oui' ||
            answerLower === 'yes';

          return {
            id: apiQuestion.id,
            question: apiQuestion.questionText,
            answer: correctAnswer,
            category: apiQuestion.category || 'Général',
            explanation: apiQuestion.explanation || undefined,
          };
        });

        // Client-side shuffle for extra randomization (Fisher-Yates algorithm)
        const shuffledQuestions = [...convertedQuestions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        setQuestions(shuffledQuestions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error('Impossible de charger les questions.');
        setIsLoading(false);
        router.push('/');
      }
    };

    validateAndFetch();
  }, [pseudo, router]);

  // Countdown timer for the question (60 seconds)
  useEffect(() => {
    if (isLoading || questions.length === 0) return;
    if (answered) return; // Stop when answered
    
    if (timeLeft <= 0) {
      // Time's up! Auto-submit as wrong answer
      if (!answered) {
        handleAnswer(false, true); // Submit wrong answer with time expired flag
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, answered, isLoading, questions.length]);

  // Track elapsed time on current question (for non-chrono modes)
  useEffect(() => {
    if (isLoading || questions.length === 0 || answered) return;
    if (mode === "chrono") return; // Only track elapsed time in non-chrono modes

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - questionStartTime) / 1000));
    }, 100);

    return () => clearInterval(timer);
  }, [questionStartTime, answered, mode, isLoading, questions.length]);

  // Auto-advance to next question after countdown
  useEffect(() => {
    if (!answered || answerTimeLeft === null) return;

    if (answerTimeLeft === 0) {
      // For correct answers, go to next question
      if (selectedAnswer === currentQuestion.answer) {
        handleNextQuestion();
      } else {
        // For wrong answers or timeout, redirect to score page
        const finalScore = score;
        const totalQuestions = questionsAnswered;
        saveScore(finalScore, totalQuestions).then(() => {
          if (isTimeExpired) {
            toast.error("Temps écoulé ! Le quiz est terminé.");
          } else {
            toast.error("Mauvaise réponse ! Le quiz est terminé.");
          }
          router.push(`/score?score=${finalScore}&total=${totalQuestions}&mode=classic&pseudo=${pseudo}`);
        });
      }
      return;
    }

    const timer = setTimeout(() => setAnswerTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [answered, answerTimeLeft]);

  const handleStopQuiz = async () => {
    setStoppingQuiz(true);
    try {
      const finalScore = answered ? score + (selectedAnswer === currentQuestion.answer ? 1 : 0) : score;
      const totalQuestions = questionsAnswered + (answered ? 1 : 0);
      console.log('[handleStopQuiz] Stopping quiz:', {
        finalScore,
        totalQuestions,
        questionsAnswered,
        answered,
      });
      await saveScore(finalScore, totalQuestions);
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      router.push("/");
    }
  };

  const handleGoToResults = async () => {
    const finalScore = score;
    const totalQuestions = questionsAnswered;
    await saveScore(finalScore, totalQuestions);
    router.push(`/score?score=${finalScore}&total=${totalQuestions}&mode=classic&pseudo=${pseudo}`);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CyberBackground />
        <div className="text-center relative z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Chargement des questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CyberBackground />
        <div className="text-center relative z-20 space-y-3">
          <p className="text-lg text-muted-foreground">Aucune question disponible pour l'instant.</p>
          <CyberButton variant="secondary" onClick={() => router.push("/")}>Retour à l'accueil</CyberButton>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const saveScore = async (finalScore: number, totalQuestions: number) => {
    try {
      const sessionId = searchParams.get('sessionId');
      console.log('[saveScore] Saving score:', { finalScore, totalQuestions, sessionId });
      
      if (!sessionId) {
        console.warn('[saveScore] No session ID found, skipping score save');
        return;
      }

      console.log('[saveScore] Calling api.completeQuiz with:', {
        sessionId: parseInt(sessionId),
        score: finalScore,
        totalQuestions,
        topic: searchParams.get('topic'),
      });

      const result = await api.completeQuiz({
        sessionId: parseInt(sessionId),
        score: finalScore,
        totalQuestions,
        topic: searchParams.get('topic') || undefined,
      });
      
      console.log('[saveScore] Success! Result:', result);
      toast.success('Score enregistré!');
    } catch (error) {
      console.error('[saveScore] Failed to save score:', error);
      toast.error('Erreur lors de l\'enregistrement du score');
    }
  };

  const handleAnswer = (answer: boolean | null, timeExpired: boolean = false) => {
    setAnswered(true);
    setSelectedAnswer(answer);
    setIsTimeExpired(timeExpired); // Track if this was a timeout
    if (!currentQuestion) return;

    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    const isCorrect = answer === currentQuestion.answer;
    if (isCorrect) {
      setScore(score + 10);
    }

    // End quiz immediately on first wrong answer or time expired
    if (!isCorrect || timeExpired) {
      setAnswerTimeLeft(10); // Show 10-second countdown for wrong answers
      return;
    }

    // Start 10-second countdown for correct answers
    setAnswerTimeLeft(10);
  };

  const handleNextQuestion = async () => {
    const totalQuestions = questions.length;
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setIsTimeExpired(false); // Reset timeout flag
      setAnswerTimeLeft(10);
      setTimeLeft(10); // Reset to 10 seconds for next question
      setQuestionStartTime(Date.now());
      setElapsedTime(0);
    } else {
      const finalScore = score + (selectedAnswer === currentQuestion.answer ? 1 : 0);
      console.log('[handleNextQuestion] Quiz complete:', {
        finalScore,
        totalQuestions,
        currentScore: score,
        selectedAnswer,
        correctAnswer: currentQuestion.answer,
      });
      await saveScore(finalScore, totalQuestions);
      router.push(`/score?score=${finalScore}&total=${totalQuestions}&mode=${mode}&pseudo=${pseudo}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <CyberBackground />
      <div className="w-full max-w-3xl space-y-6 animate-slide-up relative z-20">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-secondary">
            <Trophy className="h-6 w-6" />
            <span className="text-2xl font-bold">{score}</span>
          </div>
          
          <div className={`flex items-center gap-2 bg-card border rounded-lg px-4 py-2 transition-colors ${
            timeLeft <= 3 ? 'border-red-500 bg-red-500/10 animate-pulse' : 
            timeLeft <= 5 ? 'border-yellow-500 bg-yellow-500/10' : 
            'border-border'
          }`}>
            <Clock className={`h-5 w-5 ${
              timeLeft <= 3 ? 'text-red-500' : 
              timeLeft <= 5 ? 'text-yellow-500' : 
              'text-primary'
            }`} />
            <span className={`text-xl font-bold tabular-nums ${
              timeLeft <= 3 ? 'text-red-500' : 
              timeLeft <= 5 ? 'text-yellow-500' : 
              'text-primary'
            }`}>
              {`${timeLeft}s`}
            </span>
          </div>
          
          <div />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2 bg-secondary/20" />
        </div>

        {/* Question Card with Timer Animation */}
        <div className="relative">
          {/* Animated timer border around card */}
          {mode === "chrono" && !answered && (
            <div 
              className="absolute inset-0 rounded-lg pointer-events-none animate-timer-ring"
              style={{
                background: `linear-gradient(${(timeLeft / 30) * 360}deg, hsl(var(--primary) / 0.6) 0%, transparent 50%)`,
                borderRadius: '0.5rem'
              }}
            />
          )}
          
          <div className={`bg-card border-2 rounded-lg p-8 shadow-2xl relative z-10 ${
            mode === "chrono" && !answered ? 'border-primary/60' : 'border-border'
          } ${mode === "chrono" && !answered ? 'ring-2 ring-primary/40' : ''}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {!answered ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <CyberButton
                    size="xl"
                    variant="secondary"
                    onClick={() => handleAnswer(true)}
                    className="h-24 text-2xl font-bold"
                  >
                    VRAI
                  </CyberButton>
                  <CyberButton
                    size="xl"
                    variant="primary"
                    onClick={() => handleAnswer(false)}
                    className="h-24 text-2xl font-bold"
                  >
                    FAUX
                  </CyberButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`text-center p-6 rounded-lg ${
                  isTimeExpired
                    ? "bg-orange-500/10 border-2 border-orange-500"
                    : selectedAnswer === currentQuestion.answer 
                    ? "bg-secondary/10 border-2 border-secondary" 
                    : "bg-destructive/10 border-2 border-destructive"
                }`}>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {isTimeExpired ? (
                      <>
                        <XCircle className="h-8 w-8 text-orange-500" />
                        <span className="text-2xl font-bold text-orange-500">Temps écoulé ! ⏱️</span>
                      </>
                    ) : selectedAnswer === currentQuestion.answer ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-secondary" />
                        <span className="text-2xl font-bold text-secondary">Bonne réponse !</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-8 w-8 text-destructive" />
                        <span className="text-2xl font-bold text-destructive">Mauvaise réponse 😅</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    La bonne réponse était : <span className="font-bold text-foreground underline underline-offset-4 decoration-2 decoration-secondary">
                      {currentQuestion.answer ? "VRAI" : "FAUX"}
                    </span>
                  </p>
                  
                  {/* Explanation */}
                  {currentQuestion.explanation && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Explication : </span>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                  {!currentQuestion.explanation && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground italic">-</p>
                    </div>
                  )}
                  
                  {/* Auto-advance countdown - for correct answers */}
                  {selectedAnswer === currentQuestion.answer && answerTimeLeft !== null && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Prochaine question dans: <span className="font-bold text-lg text-primary">{answerTimeLeft}s</span>
                        </p>
                        <Progress value={(answerTimeLeft / 10) * 100} className="h-1" />
                      </div>
                      <CyberButton 
                        onClick={() => handleNextQuestion()}
                        variant="secondary"
                        className="w-full"
                      >
                        Question suivante
                      </CyberButton>
                    </div>
                  )}
                  
                  {/* Countdown for wrong answers - show timer and skip button */}
                  {(selectedAnswer !== currentQuestion.answer || isTimeExpired) && answerTimeLeft !== null && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Redirection dans: <span className="font-bold text-lg text-destructive">{answerTimeLeft}s</span>
                        </p>
                        <Progress value={(answerTimeLeft / 10) * 100} className="h-1 bg-destructive/20" />
                      </div>
                      <CyberButton 
                        onClick={handleGoToResults}
                        variant="incorrect"
                        className="w-full"
                      >
                        Voir les résultats maintenant
                      </CyberButton>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No timer progress - using default elapsed time mode */}

        {/* Footer with stop button */}
        <div className="flex justify-center pt-4">
          <CyberButton
            variant="outline"
            onClick={handleStopQuiz}
            disabled={stoppingQuiz}
            className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
            title="Arrêter et retourner à l'accueil"
          >
            <Square className="h-4 w-4" />
            {stoppingQuiz ? "Arrêt en cours..." : "Arrêter le quiz"}
          </CyberButton>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <QuizContent />
    </Suspense>
  );
}
