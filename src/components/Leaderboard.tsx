"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api, Score } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      // Only fetch top 10 for embedded view
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
            Top 10 Classement
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top 10 Classement
          </CardTitle>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="gap-2">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
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
                      {new Date(score.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {score.score} <span className="text-xs text-muted-foreground font-normal">{score.score === 1 ? 'pt' : 'pts'}</span>
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
