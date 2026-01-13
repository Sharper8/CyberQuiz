"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { Shield, Target, Clock, FolderTree, User, UserCog } from "lucide-react";
=======
import { Shield, Target, Clock, FolderTree, User, UserCog, AlertCircle } from "lucide-react";
>>>>>>> zip-work
import CyberButton from "@/components/CyberButton";
import ModeCard from "@/components/ModeCard";
import Leaderboard from "@/components/Leaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
=======
import { validateUsername } from "@/lib/validators/client-username";
import { toast } from "sonner";
>>>>>>> zip-work

export default function Home() {
  const [pseudo, setPseudo] = useState("");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
<<<<<<< HEAD
=======
  const [validationError, setValidationError] = useState<string | null>(null);
>>>>>>> zip-work
  const router = useRouter();

  const modes = [
    {
      id: "classic",
      title: "Mode Classique",
      description: "Questions aléatoires jusqu'à épuisement du pool",
      icon: Target,
    },
    {
      id: "thematic",
      title: "Mode Thématique",
      description: "Questions par catégorie (Phishing, Mots de passe, RGPD...)",
      icon: FolderTree,
    },
    {
      id: "chrono",
      title: "Mode Chrono",
      description: "Répondre le plus vite possible avant la fin du timer",
      icon: Clock,
    },
  ];

<<<<<<< HEAD
  const handleStart = () => {
    if (pseudo.trim()) {
      const mode = selectedMode || "classic";
      router.push(`/quiz?mode=${mode}&pseudo=${encodeURIComponent(pseudo)}`);
    }
  };

=======
  const handlePseudoChange = (value: string) => {
    setPseudo(value);
    // Clear validation error as user is typing
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleStart = () => {
    const validation = validateUsername(pseudo);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Pseudo invalide');
      toast.error(validation.error || 'Pseudo invalide');
      return;
    }

    const mode = selectedMode || "classic";
    router.push(`/quiz?mode=${mode}&pseudo=${encodeURIComponent(pseudo)}`);
  };

>>>>>>> zip-work
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
          <div className="flex flex-col items-center text-center space-y-6 animate-slide-up">
            <Shield className="h-20 w-20 text-primary animate-pulse-glow" />
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-gradient">CyberQuiz</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Teste ta vigilance numérique ⚡
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Admin Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin-login")}
              className="gap-2"
            >
              <UserCog className="h-4 w-4" />
              Admin
            </Button>
          </div>
          {/* Pseudo Input */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <label className="text-lg font-semibold">Ton pseudo</label>
            </div>
            <Input
              type="text"
              placeholder="Entrez votre pseudo..."
              value={pseudo}
<<<<<<< HEAD
              onChange={(e) => setPseudo(e.target.value)}
              className="h-14 text-lg bg-muted border-border focus:border-primary transition-colors"
              maxLength={20}
            />
=======
              onChange={(e) => handlePseudoChange(e.target.value)}
              className={`h-14 text-lg bg-muted border-border focus:border-primary transition-colors ${
                validationError ? 'border-red-500 focus:border-red-500' : ''
              }`}
              maxLength={32}
            />
            {validationError && (
              <div className="flex items-center gap-2 mt-3 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}
>>>>>>> zip-work
          </div>

          {/* Mode Selection - Optional, hidden by default */}
          <details className="space-y-4">
            <summary className="text-lg font-bold text-center cursor-pointer hover:text-primary transition-colors">
              Choix du mode de jeu (optionnel)
            </summary>
            <div className="grid gap-4 md:grid-cols-3 pt-4">
              {modes.map((mode) => (
                <ModeCard
                  key={mode.id}
                  {...mode}
                  onClick={() => setSelectedMode(mode.id)}
                  className={selectedMode === mode.id ? "border-secondary shadow-[0_0_30px_hsl(var(--secondary)/0.3)]" : ""}
                />
              ))}
            </div>
          </details>

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <CyberButton
              size="xl"
              onClick={handleStart}
<<<<<<< HEAD
              disabled={!pseudo.trim()}
=======
              disabled={!pseudo.trim() || validationError !== null}
>>>>>>> zip-work
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
              à travers des affirmations Oui/Non. Propulsé par l'IA, le quiz s'enrichit constamment
              de nouvelles questions pour t'aider à développer tes réflexes de sécurité numérique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
