"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Trophy, Award, Target, Home, RotateCcw } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import CyberBackground from "@/components/CyberBackground";
import { api, type Score } from "@/lib/api-client";

// Mock leaderboard as fallback (empty by default, uses real data from API)
const mockLeaderboard: any[] = [];

function ScorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const score = parseInt(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "10");
  const mode = searchParams.get("mode") || "classic";
  const pseudo = searchParams.get("pseudo") || "Joueur";

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const scores = await api.getScores(10);
        // Convert API Score to leaderboard format
        const formattedLeaderboard = scores.map(score => ({
          pseudo: score.username,
          score: score.score,
          mode: score.topic || "classic"
        }));
        setLeaderboard(formattedLeaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Use mock leaderboard as fallback
        setLeaderboard(mockLeaderboard);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Calculate score as number of correct answers × 10
  const finalScore = score * 10;
  const percentage = Math.round((score / total) * 100);

  const getMedal = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { icon: Trophy, color: "text-yellow-400" };
    if (percentage >= 70) return { icon: Award, color: "text-primary" };
    if (percentage >= 50) return { icon: Target, color: "text-secondary" };
    return { icon: Target, color: "text-muted-foreground" };
  };

  const medal = getMedal(score, total);
  const MedalIcon = medal.icon;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <CyberBackground />
      <div className="w-full max-w-5xl space-y-8 animate-slide-up relative z-20">
        {/* Your Score */}
        <div className="bg-card border-2 border-primary rounded-lg p-8 text-center shadow-2xl shadow-primary/20">
          <MedalIcon className={`h-20 w-20 mx-auto mb-4 ${medal.color} animate-pulse-glow`} />
          <h2 className="text-4xl font-bold mb-2">{pseudo}</h2>
          
          <div className="inline-block bg-gradient-to-r from-primary to-secondary p-1 rounded-2xl my-6">
            <div className="bg-card px-8 py-4 rounded-xl">
              <div className="text-6xl font-bold text-gradient">
                {finalScore}
              </div>
              <div className="text-xl text-muted-foreground mt-2">
                points
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <CyberButton
              variant="secondary"
              size="lg"
              onClick={() => router.push("/")}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Rejouer
            </CyberButton>
            <CyberButton
              variant="outline"
              size="lg"
              onClick={() => router.push("/")}
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
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Chargement du classement...</p>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
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
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {entry.score * 10}
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScorePageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ScorePage />
    </Suspense>
  );
}
