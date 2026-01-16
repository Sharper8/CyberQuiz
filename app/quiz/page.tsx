"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Trophy } from "lucide-react";
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

    setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswered(false);
        setSelectedAnswer(null);
        setTimeLeft(30);
      } else {
        const finalScore = score + (isCorrect ? 1 : 0);
        await saveScore(finalScore, questions.length);
        router.push(`/score?score=${finalScore}&total=${questions.length}&mode=${mode}&pseudo=${pseudo}`);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <CyberBackground />
      <div className="w-full max-w-3xl space-y-6 animate-slide-up relative z-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-secondary">
            <Trophy className="h-6 w-6" />
            <span className="text-2xl font-bold">{score}</span>
          </div>
          
          {mode === "chrono" && (
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-6 w-6" />
              <span className="text-2xl font-bold">{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="text-secondary font-medium">{currentQuestion.category}</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary/20" />
        </div>

        {/* Question Card */}
        <div className="bg-card border-2 border-border rounded-lg p-8 shadow-2xl">
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
              </div>
            </div>
          )}
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
