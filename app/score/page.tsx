"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Trophy, Home, RotateCcw } from "lucide-react";
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
        setLeaderboard(scores);
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

const userRank = leaderboard.findIndex(entry => entry.username === pseudo && entry.score === score) + 1;

const getMedalIcon = (index: number) => {
  if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (index === 1) return <div className="h-5 w-5 text-gray-400 font-bold flex items-center justify-center">2</div>;
  if (index === 2) return <div className="h-5 w-5 text-amber-700 font-bold flex items-center justify-center">3</div>;
  return <span className="text-muted-foreground font-bold w-5 text-center">{index + 1}</span>;
};

return (
  <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
    <CyberBackground />
    <div className="w-full max-w-5xl space-y-8 animate-slide-up relative z-20">
      {/* Your Score */}
      <div className="bg-card border-2 border-primary rounded-lg p-8 text-center shadow-2xl shadow-primary/20">
        <Trophy className="h-20 w-20 mx-auto mb-4 text-primary animate-pulse-glow" />
        <h2 className="text-4xl font-bold mb-2">{pseudo}</h2>
        {userRank > 0 && (
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-2xl ${
              userRank === 1 ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50' :
              userRank === 2 ? 'bg-gray-400/20 text-gray-300 border-2 border-gray-400/50' :
              userRank === 3 ? 'bg-amber-700/20 text-amber-600 border-2 border-amber-700/50' :
              'bg-primary/10 text-primary border-2 border-primary/30'
            }`}>
              {userRank === 1 && <Trophy className="h-6 w-6" />}
              Classement: #{userRank}
              {userRank <= 3 && userRank !== 1 && <span className="text-3xl">🏅</span>}
            </div>
          </div>
        )}
        
        <div className="inline-block bg-gradient-to-r from-primary to-secondary p-1 rounded-2xl mb-4">
          <div className="bg-card px-8 py-4 rounded-xl">
            <div className="text-6xl font-bold text-gradient">
              {score}
            </div>
            <div className="text-xl text-muted-foreground mt-2">
              {score === 10 ? 'point' : 'points'}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-6">
            <CyberButton
              variant="secondary"
              size="lg"
              onClick={() => router.push("/quiz")}
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
              Top 10 Classement
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
                    index < 3 ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  } ${
                    entry.username === pseudo && entry.score === score ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getMedalIcon(index)}
                    <div>
                      <div className="font-bold text-lg">{entry.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {entry.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.score === 1 ? 'point' : 'points'}
                    </div>
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
