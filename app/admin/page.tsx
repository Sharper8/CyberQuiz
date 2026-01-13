"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Sparkles, Plus, Trash2, LogOut } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import { api, Question } from "@/lib/api-client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminPage() {
  const { loading: authLoading, logout } = useAdmin();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'accepted' | 'to_review' | 'rejected'>('all');
<<<<<<< HEAD
=======
  const [similarityModalOpen, setSimilarityModalOpen] = useState(false);
  const [similarityData, setSimilarityData] = useState<{
    question: Question;
    similarQuestions: Array<Question & {similarity: number}>;
  } | null>(null);
  const [similarityLoading, setSimilarityLoading] = useState(false);
>>>>>>> zip-work
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answer: true,
    category: "Sécurité",
  });
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    step: string;
    message: string;
    current?: number;
    total?: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchQuestions();
    }
  }, [authLoading]);

  const fetchQuestions = async () => {
    try {
<<<<<<< HEAD
      const data = await api.getQuestions();
      setQuestions(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des questions");
=======
      setLoading(true);
      
      const response = await fetch('/api/admin/questions/review', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = '/admin-login';
          return;
        }
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      toast.error(`Erreur: ${error.message || "Impossible de charger les questions"}`);
      setQuestions([]);
>>>>>>> zip-work
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
<<<<<<< HEAD
      // Always soft delete by marking as rejected
      await api.updateQuestion(id.toString(), { status: 'rejected' });
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, status: 'rejected' as const, isRejected: true } : q
      ));
=======
      const response = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          questionId: id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject question');
      }
      
      setQuestions(questions.filter(q => q.id !== id));
>>>>>>> zip-work
      toast.success("Question rejetée");
    } catch (error: any) {
      toast.error("Erreur lors du rejet");
    }
  };

<<<<<<< HEAD
  const handleAccept = async (id: number) => {
    try {
      await api.updateQuestion(id.toString(), { status: 'accepted' });
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, status: 'accepted' as const, isRejected: false } : q
      ));
      toast.success("Question acceptée et ajoutée au pool");
=======
  const handleViewSimilar = async (id: number) => {
    try {
      setSimilarityLoading(true);
      const data = await api.getSimilarQuestions(id);
      setSimilarityData(data);
      setSimilarityModalOpen(true);
    } catch (error: any) {
      toast.error("Erreur lors de la récupération des questions similaires");
    } finally {
      setSimilarityLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const response = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'accept',
          questionId: id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept question');
      }
      
      setQuestions(questions.filter(q => q.id !== id));
      toast.success("Question acceptée et ajoutée au pool");
      await fetchQuestions();
>>>>>>> zip-work
    } catch (error: any) {
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.deleteQuestion(id.toString());
      setQuestions(questions.filter(q => q.id !== id));
      toast.success("Question rejetée");
    } catch (error: any) {
      toast.error("Erreur lors du rejet");
    }
  };

  const handleAddQuestion = async () => {
    try {
      const data = await api.createQuestion({
        ...newQuestion,
      });

      setQuestions([data, ...questions]);
      setAddDialogOpen(false);
      setNewQuestion({ question: "", answer: true, category: "Sécurité" });
      toast.success("Question ajoutée");
    } catch (error: any) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setGenerationProgress({ step: 'init', message: 'Démarrage...' });
    
    try {
      // Use streaming endpoint for real-time progress
      const response = await fetch('/api/questions/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: 'Cybersécurité',
          difficulty: 'medium',
          count: 5
        }),
      });

      if (!response.ok) {
<<<<<<< HEAD
        throw new Error('Failed to start generation');
=======
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Generation failed: ${response.status}`);
>>>>>>> zip-work
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
<<<<<<< HEAD
=======
      let generationCompleted = false;
      
>>>>>>> zip-work
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventMatch = line.match(/event: (\w+)\ndata: (.+)/s);
            if (eventMatch) {
              const [, event, dataStr] = eventMatch;
<<<<<<< HEAD
              const data = JSON.parse(dataStr);

              if (event === 'progress') {
                setGenerationProgress(data);
                toast.info(data.message, { duration: 2000 });
              } else if (event === 'complete') {
                toast.success('Questions générées avec succès!');
                await fetchQuestions();
              } else if (event === 'error') {
                toast.error(data.message);
=======
              try {
                const data = JSON.parse(dataStr);

                if (event === 'progress') {
                  setGenerationProgress(data);
                  toast.info(data.message, { duration: 2000 });
                } else if (event === 'complete') {
                  toast.success('Questions générées avec succès!');
                  generationCompleted = true;
                } else if (event === 'error') {
                  toast.error(data.message || 'Error during generation');
                }
              } catch (parseError) {
                console.error('Failed to parse event data:', parseError);
>>>>>>> zip-work
              }
            }
          }
        }
      }
<<<<<<< HEAD
    } catch (error: any) {
=======

      // Only fetch questions if generation was successful
      if (generationCompleted) {
        await fetchQuestions();
      }
    } catch (error: any) {
      console.error('Generation error:', error);
>>>>>>> zip-work
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
      setGenerationProgress(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Filter questions based on selected filter
  const filteredQuestions = filter === 'all' 
    ? questions 
    : questions.filter(q => q.status === filter);

  const stats = {
    total: questions.length,
    accepted: questions.filter(q => q.status === 'accepted').length,
    pending: questions.filter(q => q.status === 'to_review').length,
    rejected: questions.filter(q => q.status === 'rejected' || q.isRejected).length,
    aiGenerated: questions.filter(q => q.aiProvider !== 'manual' && q.aiProvider !== 'seed').length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Interface Admin</h1>
            <p className="text-muted-foreground">Gestion de la banque de questions</p>
          </div>
          <div className="flex gap-3">
            <CyberButton variant="secondary" size="lg" onClick={logout}>
              <LogOut className="h-5 w-5 mr-2" />
              Déconnexion
            </CyberButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">Total</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">Acceptées</p>
            <p className="text-3xl font-bold text-secondary">{stats.accepted}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">En attente</p>
            <p className="text-3xl font-bold text-cyber-red">{stats.pending}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">Générées IA</p>
            <p className="text-3xl font-bold text-cyber-blue">{stats.aiGenerated}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <CyberButton variant="primary" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une question
              </CyberButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle question</DialogTitle>
                <DialogDescription>
                  Ajoutez manuellement une question au quiz
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    placeholder="Ex: Le HTTPS garantit la confidentialité des données"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    placeholder="Ex: Sécurité, Phishing, Mots de passe..."
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Réponse correcte</Label>
                  <Select
                    value={newQuestion.answer.toString()}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, answer: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">OUI (Vrai)</SelectItem>
                      <SelectItem value="false">NON (Faux)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CyberButton
                  variant="primary"
                  onClick={handleAddQuestion}
                  className="w-full"
                >
                  Ajouter
                </CyberButton>
              </div>
            </DialogContent>
          </Dialog>

          <CyberButton
            variant="secondary"
            size="lg"
            onClick={handleGenerateQuestions}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="animate-spin h-5 w-5 mr-2 border-2 border-current border-t-transparent rounded-full" />
                {generationProgress?.message || "Génération..."}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Générer avec IA
              </>
            )}
          </CyberButton>
        </div>

        {/* Generation Progress Display */}
        {generating && generationProgress && (
          <div className="bg-card border border-primary rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                  Génération en cours...
                </h3>
                {generationProgress.current !== undefined && generationProgress.total && (
                  <span className="text-sm text-muted-foreground">
                    {generationProgress.current}/{generationProgress.total}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {generationProgress.message}
                </p>
                
                {generationProgress.total && (
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300 ease-out"
                      style={{ 
                        width: `${((generationProgress.current || 0) / generationProgress.total) * 100}%` 
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-pulse">●</div>
                <span>
                  Étape: <span className="font-mono text-primary">{generationProgress.step}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Banque de questions ({filteredQuestions.length})</h2>
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <CyberButton
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('all')}
              >
                Toutes ({questions.length})
              </CyberButton>
              <CyberButton
                variant={filter === 'to_review' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('to_review')}
              >
                En attente ({stats.pending})
              </CyberButton>
              <CyberButton
                variant={filter === 'accepted' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('accepted')}
              >
                Pool actif ({stats.accepted})
              </CyberButton>
              <CyberButton
                variant={filter === 'rejected' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('rejected')}
              >
                Rejetées ({stats.rejected})
              </CyberButton>
            </div>
          </div>
          
          {filteredQuestions.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-xl text-muted-foreground">
                Aucune question {filter !== 'all' ? `dans la catégorie "${filter}"` : ''}
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => {
              // Parse JSON fields if they're strings
              const questionText = question.questionText || question.question || '';
              const correctAnswer = question.correctAnswer || (question.answer ? 'True' : 'False');
              const isAiGenerated = question.aiProvider !== 'manual' && question.aiProvider !== 'seed';
              
              return (
                <div
                  key={question.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-primary border-primary">
                          {question.category}
                        </Badge>
                        {isAiGenerated && (
                          <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            IA ({question.aiProvider})
                          </Badge>
                        )}
<<<<<<< HEAD
=======
                        {question.potentialDuplicates && question.potentialDuplicates.length > 0 && (
                          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 cursor-pointer hover:bg-yellow-50" onClick={() => handleViewSimilar(question.id)}>
                            ⚠️ {question.potentialDuplicates.length} similaire(s)
                          </Badge>
                        )}
>>>>>>> zip-work
                        {question.status === 'accepted' ? (
                          <Badge className="bg-secondary text-secondary-foreground gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Dans le pool
                          </Badge>
                        ) : question.status === 'rejected' ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Rejetée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-cyber-red text-cyber-red">
                            <XCircle className="h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-medium mb-2">{questionText}</p>
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-semibold">Explication:</span> {question.explanation}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Réponse correcte : <span className="font-semibold text-foreground">
                          {correctAnswer === 'True' ? "OUI (Vrai)" : "NON (Faux)"}
                        </span>
                        {question.difficulty && (
                          <span className="ml-4">
                            Difficulté: {(Number(question.difficulty) * 100).toFixed(0)}%
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {question.status === 'to_review' && (
                        <>
                          <CyberButton
                            variant="correct"
                            onClick={() => handleAccept(question.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accepter
                          </CyberButton>
                          <CyberButton
                            variant="incorrect"
                            onClick={() => handleReject(question.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </CyberButton>
                        </>
                      )}
                      {question.status !== 'rejected' && (
                        <CyberButton
                          variant="outline"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </CyberButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
<<<<<<< HEAD
=======

        {/* Similarity Comparison Modal */}
        <Dialog open={similarityModalOpen} onOpenChange={setSimilarityModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comparaison de questions similaires</DialogTitle>
              <DialogDescription>
                Vérifiez si ces questions sont effectivement similaires
              </DialogDescription>
            </DialogHeader>

            {similarityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : similarityData ? (
              <div className="space-y-6">
                {/* Generated Question */}
                <div className="bg-primary/10 border border-primary rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-primary">Question générée (nouvelle)</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{similarityData.question.questionText}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Réponse correcte:</span> {similarityData.question.correctAnswer === 'True' ? "OUI (Vrai)" : "NON (Faux)"}
                    </p>
                    {similarityData.question.explanation && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Explication:</span> {similarityData.question.explanation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Similar Questions */}
                {similarityData.similarQuestions.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Questions similaires dans la base ({similarityData.similarQuestions.length})</h3>
                    {similarityData.similarQuestions.map((similar) => (
                      <div key={similar.id} className="bg-card border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium flex-1">{similar.questionText}</h4>
                          <Badge className="bg-yellow-500/20 text-yellow-700 ml-2">
                            Similarité: {(similar.similarity * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Réponse correcte:</span> {similar.correctAnswer === 'True' ? "OUI (Vrai)" : "NON (Faux)"}
                        </p>
                        {similar.explanation && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Explication:</span> {similar.explanation}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Statut: {similar.status} | Créée le: {new Date(similar.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune question similaire trouvée</p>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
>>>>>>> zip-work
      </div>
    </div>
  );
}
