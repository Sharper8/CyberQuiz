import { useSearchParams, useNavigate } from "react-router-dom";
import { Trophy, Award, Target, Home, RotateCcw } from "lucide-react";
import CyberButton from "@/components/CyberButton";

// Mock leaderboard data
const mockLeaderboard = [
  { pseudo: "CyberNinja", score: 10, mode: "chrono" },
  { pseudo: "SecureMax", score: 9, mode: "classic" },
  { pseudo: "HackerPro", score: 9, mode: "thematic" },
  { pseudo: "NetGuard", score: 8, mode: "classic" },
  { pseudo: "DataShield", score: 8, mode: "chrono" },
  { pseudo: "FirewallKing", score: 7, mode: "thematic" },
  { pseudo: "PhishFighter", score: 7, mode: "classic" },
  { pseudo: "CodeBreaker", score: 6, mode: "chrono" },
  { pseudo: "SecureGirl", score: 6, mode: "classic" },
  { pseudo: "CyberWatch", score: 5, mode: "thematic" },
];

export default function Score() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const score = parseInt(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "10");
  const mode = searchParams.get("mode") || "classic";
  const pseudo = searchParams.get("pseudo") || "Joueur";

  const percentage = Math.round((score / total) * 100);

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      classic: "Classique",
      thematic: "Thématique",
      chrono: "Chrono"
    };
    return labels[mode] || mode;
  };

  const getMedal = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { icon: Trophy, color: "text-yellow-400", label: "Expert" };
    if (percentage >= 70) return { icon: Award, color: "text-primary", label: "Avancé" };
    if (percentage >= 50) return { icon: Target, color: "text-secondary", label: "Intermédiaire" };
    return { icon: Target, color: "text-muted-foreground", label: "Débutant" };
  };

  const medal = getMedal(score, total);
  const MedalIcon = medal.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-8 animate-slide-up">
        {/* Your Score */}
        <div className="bg-card border-2 border-primary rounded-lg p-8 text-center shadow-2xl shadow-primary/20">
          <MedalIcon className={`h-20 w-20 mx-auto mb-4 ${medal.color} animate-pulse-glow`} />
          <h2 className="text-4xl font-bold mb-2">{pseudo}</h2>
          <p className="text-muted-foreground mb-6">Mode {getModeLabel(mode)}</p>
          
          <div className="inline-block bg-gradient-to-r from-primary to-secondary p-1 rounded-2xl mb-4">
            <div className="bg-card px-8 py-4 rounded-xl">
              <div className="text-6xl font-bold text-gradient">
                {score}/{total}
              </div>
              <div className="text-xl text-muted-foreground mt-2">
                {percentage}% de réussite
              </div>
            </div>
          </div>

          <p className="text-xl font-semibold text-primary mb-6">{medal.label}</p>

          <div className="flex gap-4 justify-center">
            <CyberButton
              variant="secondary"
              size="lg"
              onClick={() => navigate("/")}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Rejouer
            </CyberButton>
            <CyberButton
              variant="outline"
              size="lg"
              onClick={() => navigate("/")}
            >
              <Home className="h-5 w-5 mr-2" />
              Accueil
            </CyberButton>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-primary to-secondary p-4">
            <h3 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6" />
              Top 10 Scores
            </h3>
          </div>

          <div className="divide-y divide-border">
            {mockLeaderboard.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/50 ${
                  entry.pseudo === pseudo && entry.score === score ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    index === 1 ? "bg-gray-400/20 text-gray-300" :
                    index === 2 ? "bg-orange-500/20 text-orange-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.pseudo}</div>
                    <div className="text-sm text-muted-foreground">
                      Mode {getModeLabel(entry.mode)}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {entry.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
