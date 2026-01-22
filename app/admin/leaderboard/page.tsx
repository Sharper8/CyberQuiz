"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trash2, Ban, Trash } from "lucide-react";

import { api, Score } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function AdminLeaderboardPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [deleteAction, setDeleteAction] = useState<'delete' | 'ban'>('delete');
  const [clearLoading, setClearLoading] = useState(false);

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

  const handleDeleteClick = (score: Score) => {
    setSelectedScore(score);
    setDeleteAction('delete');
    setDeleteDialogOpen(true);
  };

  const handleBanClick = (score: Score) => {
    setSelectedScore(score);
    setDeleteAction('ban');
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedScore) return;

    try {
      const shouldBan = deleteAction === 'ban';
      await api.deleteScore(selectedScore.id, shouldBan);
      
      toast.success(
        shouldBan 
          ? `Score supprimé et pseudo "${selectedScore.username}" banni` 
          : 'Score supprimé'
      );
      
      // Remove from local state
      setScores(scores.filter(s => s.id !== selectedScore.id));
    } catch (error) {
      console.error('Error deleting score:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedScore(null);
    }
  };

  const confirmClearLeaderboard = async () => {
    setClearLoading(true);
    try {
      await api.clearLeaderboard();
      
      toast.success('Leaderboard supprimé avec succès');
      
      // Clear all scores from local state
      setScores([]);
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
      toast.error('Erreur lors de la suppression du leaderboard');
    } finally {
      setClearLoading(false);
      setClearDialogOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Leaderboard</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Actualiser
          </Button>
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={() => setClearDialogOpen(true)}
            disabled={clearLoading || scores.length === 0}
          >
            <Trash className="h-4 w-4" />
            Vider le leaderboard
          </Button>
        </div>
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
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : scores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(s)}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBanClick(s)}
                        className="gap-1"
                      >
                        <Ban className="h-3 w-3" />
                        Bannir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteAction === 'ban' ? 'Bannir et supprimer' : 'Supprimer le score'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction === 'ban' ? (
                <>
                  Êtes-vous sûr de vouloir supprimer ce score et ajouter le pseudo{' '}
                  <strong>"{selectedScore?.username}"</strong> à la liste des mots interdits ?
                  <br /><br />
                  Cette action empêchera ce pseudo d'être utilisé à l'avenir.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer le score de{' '}
                  <strong>{selectedScore?.username}</strong> ?
                  <br /><br />
                  Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={deleteAction === 'ban' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {deleteAction === 'ban' ? 'Bannir et supprimer' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider le leaderboard</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>tous les scores</strong> du leaderboard ?
              <br /><br />
              Cette action est <strong>irréversible</strong> et supprimera définitivement tous les {scores.length} scores enregistrés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearLeaderboard}
              disabled={clearLoading}
              className='bg-destructive hover:bg-destructive/90'
            >
              {clearLoading ? 'Suppression...' : 'Vider le leaderboard'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
