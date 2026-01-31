"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Target, Zap } from "lucide-react";

interface AnalyticsData {
  generationEfficiency: {
    totalGenerated: number;
    totalDuplicatesDetected: number;
    currentEfficiencyRate: number;
    recentQuestionsAnalyzed: number;
    recentDuplicates: number;
    duplicatesByMethod: Array<{ method: string; count: number }>;
    efficiencyOverTime: Array<{
      batch: number;
      duplicateCount: number;
      totalGenerated: number;
      efficiencyRate: number;
    }>;
  };
  questionDifficulty: {
    hardest: Array<{
      id: number;
      questionText: string;
      totalAttempts: number;
      incorrectAttempts: number;
      difficultyRate: number;
      category: string;
      generationDifficulty: string | null;
    }>;
    easiest: Array<{
      id: number;
      questionText: string;
      totalAttempts: number;
      incorrectAttempts: number;
      difficultyRate: number;
      category: string;
      generationDifficulty: string | null;
    }>;
  };
  overview: {
    totalQuestions: number;
    accepted: number;
    rejected: number;
    toReview: number;
    totalResponses: number;
    totalSessions: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  const getEfficiencyColor = (rate: number) => {
    if (rate >= 80) return "text-green-500";
    if (rate >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getEfficiencyBadge = (rate: number) => {
    if (rate >= 80) return <Badge className="bg-green-500/20 text-green-500">Excellent</Badge>;
    if (rate >= 60) return <Badge className="bg-yellow-500/20 text-yellow-500">Modéré</Badge>;
    return <Badge className="bg-red-500/20 text-red-500">Faible</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Analytics & Statistiques</h1>
          <p className="text-muted-foreground">
            Analyse de l'efficacité de génération et des performances des questions
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions Générées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalQuestions}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-500">✓ {data.overview.accepted} acceptées</span>
              <span className="text-yellow-500">⏳ {data.overview.toReview} à revoir</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Efficacité Génération</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getEfficiencyColor(data.generationEfficiency.currentEfficiencyRate)}`}>
              {data.generationEfficiency.currentEfficiencyRate.toFixed(1)}%
            </div>
            <div className="mt-2">
              {getEfficiencyBadge(data.generationEfficiency.currentEfficiencyRate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duplicatas Détectés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{data.generationEfficiency.totalDuplicatesDetected}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.generationEfficiency.recentDuplicates} sur les {data.generationEfficiency.recentQuestionsAnalyzed} dernières
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.overview.totalResponses} réponses enregistrées
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="efficiency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="efficiency">
            <Zap className="h-4 w-4 mr-2" />
            Efficacité Génération
          </TabsTrigger>
          <TabsTrigger value="difficulty">
            <Target className="h-4 w-4 mr-2" />
            Difficultés Questions
          </TabsTrigger>
        </TabsList>

        {/* Generation Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Efficacité par Lot de Questions
              </CardTitle>
              <CardDescription>
                Taux d'efficacité (questions uniques / total généré) par lots de 10 questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.generationEfficiency.efficiencyOverTime.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Pas encore assez de données de génération
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.generationEfficiency.efficiencyOverTime.map((batch) => (
                      <div key={batch.batch} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">
                          Lot #{batch.batch}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  batch.efficiencyRate >= 80
                                    ? 'bg-green-500'
                                    : batch.efficiencyRate >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${batch.efficiencyRate}%` }}
                              />
                            </div>
                            <div className="w-20 text-right font-bold">
                              {batch.efficiencyRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {batch.duplicateCount} duplicatas sur {batch.totalGenerated}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detection Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Méthodes de Détection</CardTitle>
              <CardDescription>Répartition des duplicatas par méthode de détection</CardDescription>
            </CardHeader>
            <CardContent>
              {data.generationEfficiency.duplicatesByMethod.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun duplicata détecté</p>
              ) : (
                <div className="space-y-3">
                  {data.generationEfficiency.duplicatesByMethod.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{method.method}</Badge>
                      </div>
                      <div className="text-lg font-semibold">{method.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.generationEfficiency.currentEfficiencyRate < 60 && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">⚠️</span>
                  <p>
                    <strong>Efficacité faible détectée.</strong> Activez les options RSS et/ou Structured Space 
                    pour diversifier la génération et réduire les duplicatas.
                  </p>
                </div>
              )}
              {data.generationEfficiency.currentEfficiencyRate >= 60 && data.generationEfficiency.currentEfficiencyRate < 80 && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">💡</span>
                  <p>
                    <strong>Efficacité modérée.</strong> Envisagez d'activer plus de domaines dans Structured Space 
                    ou d'ajouter des sources RSS pour améliorer la diversité.
                  </p>
                </div>
              )}
              {data.generationEfficiency.currentEfficiencyRate >= 80 && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✅</span>
                  <p>
                    <strong>Excellent taux d'efficacité!</strong> La génération produit principalement des questions uniques.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Question Difficulty Tab */}
        <TabsContent value="difficulty" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hardest Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  Questions les Plus Difficiles
                </CardTitle>
                <CardDescription>
                  Basé sur le taux d'échec des utilisateurs (minimum 5 tentatives)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {data.questionDifficulty.hardest.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Pas encore assez de données
                    </p>
                  ) : (
                    data.questionDifficulty.hardest.slice(0, 20).map((q, index) => (
                      <div key={q.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <Badge variant="destructive" className="mt-1">
                              #{index + 1}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{q.category}</Badge>
                                {q.generationDifficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {q.generationDifficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-red-500">
                              {q.difficultyRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {q.incorrectAttempts}/{q.totalAttempts}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Easiest Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  Questions les Plus Faciles
                </CardTitle>
                <CardDescription>
                  Basé sur le taux de réussite des utilisateurs (minimum 5 tentatives)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {data.questionDifficulty.easiest.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Pas encore assez de données
                    </p>
                  ) : (
                    data.questionDifficulty.easiest.slice(0, 20).map((q, index) => (
                      <div key={q.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <Badge className="bg-green-500/20 text-green-500 mt-1">
                              #{index + 1}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{q.category}</Badge>
                                {q.generationDifficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {q.generationDifficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-green-500">
                              {q.difficultyRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {q.incorrectAttempts}/{q.totalAttempts}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
