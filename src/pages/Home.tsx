import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Target, Clock, FolderTree, User, UserCog } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import ModeCard from "@/components/ModeCard";
import Leaderboard from "@/components/Leaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import cyberHero from "@/assets/cyber-hero.jpg";

export default function Home() {
  const [pseudo, setPseudo] = useState("");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleStart = () => {
    if (pseudo.trim()) {
      // Default to classic mode if none selected
      const mode = selectedMode || "classic";
      navigate(`/quiz?mode=${mode}&pseudo=${encodeURIComponent(pseudo)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={cyberHero} 
            alt="Cyber background" 
            className="h-full w-full object-cover opacity-20"
          />
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
              onClick={() => navigate("/admin-login")}
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
              onChange={(e) => setPseudo(e.target.value)}
              className="h-14 text-lg bg-muted border-border focus:border-primary transition-colors"
              maxLength={20}
            />
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
              disabled={!pseudo.trim()}
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
