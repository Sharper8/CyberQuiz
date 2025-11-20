import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Sparkles, Plus, Trash2, LogOut } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
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

interface Question {
  id: string;
  question: string;
  answer: boolean;
  category: string;
  ai_generated: boolean;
  validated: boolean;
}

export default function Admin() {
  const { loading: authLoading, logout } = useAdmin();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answer: true,
    category: "Sécurité",
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchQuestions();
    }
  }, [authLoading]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des questions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setQuestions(questions.filter(q => q.id !== id));
      toast.success("Question supprimée");
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleAddQuestion = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("questions")
        .insert({
          ...newQuestion,
          ai_generated: false,
          validated: true,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

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
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { count: 5 },
      });

      if (error) throw error;

      toast.success(`${data.count} questions générées`);
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleValidation = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("questions")
        .update({ validated: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setQuestions(questions.map(q => 
        q.id === id ? { ...q, validated: !currentStatus } : q
      ));
      toast.success(currentStatus ? "Question invalidée" : "Question validée");
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
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

  const stats = {
    total: questions.length,
    validated: questions.filter(q => q.validated).length,
    pending: questions.filter(q => !q.validated).length,
    aiGenerated: questions.filter(q => q.ai_generated).length,
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
            <p className="text-muted-foreground text-sm mb-1">Validées</p>
            <p className="text-3xl font-bold text-secondary">{stats.validated}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">En attente</p>
            <p className="text-3xl font-bold text-cyber-red">{stats.pending}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">IA</p>
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
            <Sparkles className="h-5 w-5 mr-2" />
            {generating ? "Génération..." : "Générer avec IA"}
          </CyberButton>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Banque de questions ({questions.length})</h2>
          
          {questions.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-xl text-muted-foreground">
                Aucune question pour le moment
              </p>
            </div>
          ) : (
            questions.map((question) => (
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
                      {question.ai_generated && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          IA
                        </Badge>
                      )}
                      {question.validated ? (
                        <Badge className="bg-secondary text-secondary-foreground gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Validée
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          En attente
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-medium mb-2">{question.question}</p>
                    <p className="text-sm text-muted-foreground">
                      Réponse correcte : <span className="font-semibold text-foreground">
                        {question.answer ? "OUI" : "NON"}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <CyberButton
                      variant={question.validated ? "outline" : "correct"}
                      onClick={() => handleToggleValidation(question.id, question.validated)}
                      size="default"
                    >
                      {question.validated ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Invalider
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Valider
                        </>
                      )}
                    </CyberButton>
                    <CyberButton
                      variant="incorrect"
                      onClick={() => handleDelete(question.id)}
                      size="default"
                    >
                      <Trash2 className="h-4 w-4" />
                    </CyberButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
