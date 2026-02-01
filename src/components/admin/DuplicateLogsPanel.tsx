/**
 * Duplicate Detection Logs Component
 * Shows history of detected duplicates with similarity scores
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DuplicateLog {
  id: number;
  detectedAt: string;
  similarityScore: number | null;
  detectionMethod: string;
  generatedQuestionText: string;
  duplicateOf: {
    id: number;
    text: string;
    difficulty: number;
    adminDifficulty: string | null;
    category: string;
    status: string;
  } | null;
}

export function DuplicateLogsPanel() {
  const [logs, setLogs] = useState<DuplicateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/duplicate-logs?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.total || data.count || 0);
      }
    } catch (error) {
      console.error('[DuplicateLogs] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMore = () => {
    setLimit(prev => prev + 10);
  };

  const handleShowAll = () => {
    setLimit(1000);
    setShowAll(true);
  };

  const getSimilarityColor = (score: number | null) => {
    if (!score) return 'text-gray-600';
    if (score >= 0.97) return 'text-red-600 font-bold';
    if (score >= 0.85) return 'text-orange-600 font-semibold';
    if (score >= 0.75) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Historique des Duplicatas Détectés
          <Badge variant="secondary">{logs.length} détections</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun duplicata détecté pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.similarityScore !== null && (
                      <span className={`text-2xl font-bold ${getSimilarityColor(log.similarityScore)}`}>
                        {(log.similarityScore * 100).toFixed(1)}%
                      </span>
                    )}
                    <Badge variant="outline">{log.detectionMethod}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.detectedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Questions Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Generated Question */}
                  <div className="border-l-4 border-red-500 pl-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-red-600">Question Générée (rejetée)</span>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-sm">{log.generatedQuestionText}</p>
                  </div>

                  {/* Duplicate Of Question */}
                  {log.duplicateOf && (
                    <div className="border-l-4 border-green-500 pl-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-green-600">Question Similaire (existante)</span>
                        {getStatusIcon(log.duplicateOf.status)}
                        <Badge variant="outline" className="text-xs">
                          ID: {log.duplicateOf.id}
                        </Badge>
                      </div>
                      <p className="text-sm">{log.duplicateOf.text}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {log.duplicateOf.category}
                        </Badge>
                        {log.duplicateOf.adminDifficulty && (
                          <Badge variant="outline" className="text-xs">
                            {log.duplicateOf.adminDifficulty}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Difficulté générée: {(log.duplicateOf.difficulty * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!showAll && logs.length > 0 && logs.length < totalCount && (
          <div className="mt-4 text-center">
            <button
              onClick={handleShowMore}
              className="text-sm text-primary hover:underline"
            >
              Afficher plus ({totalCount - logs.length} restants)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
