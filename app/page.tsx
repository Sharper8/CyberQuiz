"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, UserCog, AlertCircle } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CyberBackground from "@/components/CyberBackground";
import Leaderboard from "@/components/Leaderboard";

// Skip static generation - this page uses client context and dynamic routing
export const dynamic = 'force-dynamic';

export default function Home() {
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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

  const validateUsername = (username: string): string | null => {
    // Min/max length
    if (username.length < 3) return 'Pseudo au minimum 3 caractères';
    if (username.length > 32) return 'Pseudo au maximum 32 caractères';
    
    // Format: only alphanumeric, underscores, hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Pseudo: uniquement lettres, chiffres, tirets et underscores';
    }
    
    // Profanity check
    const lowerUsername = username.toLowerCase();
    for (const bannedWord of BANNED_WORDS_SET) {
      if (lowerUsername.includes(bannedWord)) {
        return 'Pseudo contient du langage inapproprié';
      }
    }
    
    return null;
  };



  const handleStart = async () => {
    const trimmed = pseudo.trim();
    const validationError = validateUsername(trimmed);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(""); // Clear error on successful validation
    const mode = "classic"; // Only classic mode
    
    try {
      // Create a quiz session first to get sessionId
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        setError(error.error || 'Failed to start quiz session');
        return;
      }
      
      const data = await response.json();
      const { sessionId } = data;
      
      // Now redirect to quiz with sessionId
      router.push(`/quiz?mode=${mode}&pseudo=${encodeURIComponent(trimmed)}&sessionId=${sessionId}`);
    } catch (err) {
      setError('Failed to start quiz session');
      console.error('Error starting quiz:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CyberBackground />

      {/* Admin Button - Fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin-login")}
          className="gap-2 bg-gray-900/80 backdrop-blur-sm border-cyan-500/50 hover:bg-gray-900 hover:border-cyan-400 text-white"
        >
          <UserCog className="h-4 w-4" />
          Admin
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden z-10">
        <div className="relative z-10 container mx-auto px-4 pt-12 pb-16">
          <div className="flex flex-col items-center text-center space-y-4 animate-slide-up">
            <Shield className="h-16 w-16 text-cyan-400 animate-pulse-glow" style={{filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))'}} />
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">CyberQuiz</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              ⚡ Teste tes connaissances en cybersécurité !
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Pseudo Input */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 shadow-2xl" style={{boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)'}}>
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-cyan-400" />
              <label className="text-lg font-semibold text-white">Ton pseudo</label>
            </div>
            <Input
              type="text"
              placeholder="Entrez votre pseudo..."
              value={pseudo}
              onChange={(e) => {
                setPseudo(e.target.value);
                setError(""); // Clear error when user starts typing
              }}
              className="h-14 text-lg bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400 transition-colors"
              maxLength={32}
            />
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <CyberButton
              size="xl"
              onClick={handleStart}
              disabled={!pseudo.trim() || !!error}
              className="min-w-[300px]"
            >
              Commencer le quiz
            </CyberButton>
          </div>

          {/* Leaderboard */}
          <Leaderboard />

          {/* About Section */}
          <div className="bg-card/50 border border-border rounded-lg p-6 mt-12">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              À propos de CyberQuiz
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              CyberQuiz est une plateforme interactive qui teste tes connaissances en cybersécurité
              à travers des affirmations Vrai/Faux. Propulsé par l'IA, le quiz s'enrichit constamment
              de nouvelles questions pour t'aider à développer tes réflexes de sécurité numérique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
