"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { api, Score } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminLeaderboardPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getScores(50);
      setScores(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Leaderboard</h1>
        </div>
        <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualiser
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rang</TableHead>
              <TableHead>Pseudo</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Précision</TableHead>
              <TableHead>Topic</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : scores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Aucun score.
                </TableCell>
              </TableRow>
            ) : (
              scores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold">#{s.rank}</TableCell>
                  <TableCell className="font-medium">{s.username}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {s.score}/{s.totalQuestions}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{Math.round(s.accuracyPercentage)}%</TableCell>
                  <TableCell className="text-muted-foreground">{s.topic ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
