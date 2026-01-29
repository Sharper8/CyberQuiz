"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api, Score } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CyberButton from "@/components/CyberButton";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllScores();
  }, []);

  const fetchAllScores = async () => {
    try {
      // Fetch all scores (no limit)
      const data = await api.getScores(1000);
      setScores(data);
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-muted-foreground font-bold w-6 text-center">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/">
              <CyberButton variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </CyberButton>
            </Link>
          </div>
          
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-primary" />
                Classement Général
              </CardTitle>
              <CardDescription>Tous les meilleurs scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">Chargement...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <CyberButton variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </CyberButton>
          </Link>
        </div>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              Classement Général
            </CardTitle>
            <CardDescription>
              {scores.length} {scores.length === 1 ? 'score enregistré' : 'scores enregistrés'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scores.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucun score enregistré pour le moment
              </div>
            ) : (
              <div className="space-y-2">
                {scores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      index < 3 
                        ? "bg-primary/10 border border-primary/20" 
                        : index % 2 === 0 
                        ? "bg-muted/50" 
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getMedalIcon(index)}
                      <div>
                        <div className="font-semibold text-lg">{score.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(score.completedAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary text-xl">
                        {score.score} <span className="text-sm text-muted-foreground font-normal">{score.score === 1 ? 'pt' : 'pts'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
