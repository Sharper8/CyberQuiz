"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { api, Score } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const data = await api.getScores(10);
      setScores(data);
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-muted-foreground font-bold w-5 text-center">{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Classement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scores.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            Aucun score enregistré pour le moment
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((score, index) => (
              <div
                key={score.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  index < 3 ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getMedalIcon(index)}
                  <div>
                    <div className="font-semibold">{score.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {score.topic ? `Topic: ${score.topic}` : 'General Quiz'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{score.score} pts</div>
                  <div className="text-xs text-muted-foreground">
                    {score.score}/{score.totalQuestions} ({score.accuracyPercentage.toFixed(0)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
