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
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(5); // Timer for answer reveal
  const [stoppingQuiz, setStoppingQuiz] = useState(false);

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

      // Fetch accepted questions from database
      try {
        const response = await api.getQuestions();
        const acceptedQuestions = response.filter(q => q.status === 'accepted');

        if (acceptedQuestions.length === 0) {
          toast.error("Aucune question n'est disponible pour le moment. Réessayez plus tard.");
          setIsLoading(false);
          router.push("/");
          return;
        }

        const convertedQuestions = acceptedQuestions.map(apiQuestion => {
          // Parse correctAnswer to boolean
          // Accepts: "Vrai", "OUI", "true", "1", "yes" → true
          // Accepts: "Faux", "NON", "false", "0", "no" → false
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
          };
        });

        setQuestions(convertedQuestions);
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

  useEffect(() => {
    if (isLoading || questions.length === 0) return;
    if (mode !== "chrono") return;
    if (answered || timeLeft <= 0) return;

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, answered, mode, isLoading, questions.length]);

  // Auto-advance to next question after 5 seconds of answer reveal
  useEffect(() => {
    if (!answered || answerTimeLeft === null) return;

    if (answerTimeLeft === 0) {
      handleNextQuestion();
      return;
    }

    const timer = setTimeout(() => setAnswerTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [answered, answerTimeLeft]);

  const handleStopQuiz = async () => {
    if (!confirm("Êtes-vous sûr de vouloir arrêter le quiz ?")) return;
    
    setStoppingQuiz(true);
    try {
      await saveScore(score, questionsAnswered);
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      router.push("/");
    }
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

  const handleAnswer = (answer: boolean | null) => {
    setAnswered(true);
    setSelectedAnswer(answer);
    setAnswerTimeLeft(5); // Start 5-second countdown to next question
    if (!currentQuestion) return;

    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    const isCorrect = answer === currentQuestion.answer;
    if (isCorrect) {
      setScore(score + 1);
    }

    // Classic mode: wrong answer after 5 questions = game over
    if (mode === "classic" && newQuestionsAnswered >= 5 && !isCorrect) {
      setTimeout(async () => {
        await saveScore(score, newQuestionsAnswered);
        toast.error("Mauvaise réponse ! Le quiz est terminé.");
        router.push("/?ended=true");
      }, 1500);
      return;
    }

    // Will auto-advance via useEffect after 5 seconds
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setAnswerTimeLeft(5);
      setTimeLeft(30);
    } else {
      const finalScore = score + (selectedAnswer === currentQuestion.answer ? 1 : 0);
      await saveScore(finalScore, questions.length);
      router.push(`/score?score=${finalScore}&total=${questions.length}&mode=${mode}&pseudo=${pseudo}`);
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
          
          <div className="flex items-center gap-2">
            {mode === "chrono" && (
              <div className="flex items-center gap-2 text-primary bg-card border border-border rounded-lg px-4 py-2">
                <Clock className="h-5 w-5" />
                <span className="text-xl font-bold tabular-nums">{timeLeft}s</span>
              </div>
            )}
            <CyberButton
              variant="outline"
              size="sm"
              onClick={handleStopQuiz}
              disabled={stoppingQuiz}
              className="gap-2 text-destructive border-destructive/50"
              title="Arrêter et retourner à l'accueil"
            >
              <Square className="h-4 w-4" />
              {stoppingQuiz ? "Arrêt..." : "Arrêter"}
            </CyberButton>
          </div>
        </div>

        {/* Progress - no question count shown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="text-secondary font-medium">{currentQuestion.category}</span>
          </div>
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
                    OUI
                  </CyberButton>
                  <CyberButton
                    size="xl"
                    variant="primary"
                    onClick={() => handleAnswer(false)}
                    className="h-24 text-2xl font-bold"
                  >
                    NON
                  </CyberButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`text-center p-6 rounded-lg ${
                  selectedAnswer === currentQuestion.answer 
                    ? "bg-secondary/10 border-2 border-secondary" 
                    : "bg-destructive/10 border-2 border-destructive"
                }`}>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {selectedAnswer === currentQuestion.answer ? (
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
                      {currentQuestion.answer ? "OUI" : "NON"}
                    </span>
                  </p>
                  
                  {/* Auto-advance countdown */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Prochaine question dans: <span className="font-bold text-lg text-primary">{answerTimeLeft}s</span>
                    </p>
                    <Progress value={(answerTimeLeft / 5) * 100} className="h-1 mt-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timer progress for chrono mode */}
        {mode === "chrono" && !answered && (
          <Progress 
            value={(timeLeft / 30) * 100} 
            className="h-1"
          />
        )}
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
