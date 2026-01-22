"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CyberButton from "@/components/CyberButton";
import { GenerationSettingsPanel } from "@/components/GenerationSettingsPanel";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BufferStatus {
  buffer: {
    currentSize: number;
    targetSize: number;
    isGenerating: boolean;
    autoRefillEnabled: boolean;
    queuedJobs: number;
    missing: number;
    lastGeneration: {
      lastStartedAt?: string;
      lastFinishedAt?: string;
      lastError?: string;
      inFlight: boolean;
    };
  };
  structuredSpace: any;
}

interface HealthStatus {
  aiAvailable: boolean;
  aiMessage: string;
}

interface PendingQuestion {
  id: number;
  questionText: string;
  category?: string;
}

export default function GenerationPage() {
  const [bufferStatus, setBufferStatus] = useState<BufferStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ aiAvailable: true, aiMessage: "" });
  const [pendingPreview, setPendingPreview] = useState<PendingQuestion[]>([]);

  useEffect(() => {
    refreshAll();
    // Poll for status updates every 2 seconds
    const interval = setInterval(refreshAll, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-trigger generation when missing questions and auto-refill is enabled
  useEffect(() => {
    if (bufferStatus?.buffer && !bufferStatus.buffer.isGenerating && bufferStatus.buffer.autoRefillEnabled && bufferStatus.buffer.missing > 0) {
      handleStartGeneration();
    }
  }, [bufferStatus?.buffer.missing, bufferStatus?.buffer.autoRefillEnabled, bufferStatus?.buffer.isGenerating]);

  const refreshAll = async () => {
    await Promise.all([fetchBufferStatus(), fetchHealth(), fetchPendingPreview()]);
  };

  const fetchBufferStatus = async () => {
    try {
      const response = await fetch('/api/admin/buffer/status');
      if (!response.ok) throw new Error('Failed to fetch buffer status');
      const data = await response.json();
      setBufferStatus(data);
    } catch (error) {
      console.error('Error fetching buffer status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Failed to fetch health');
      const data = await res.json();
      const aiAvailable = data?.services?.aiProviders?.status === 'ok' && data?.services?.aiProviders?.ollama === 'available';
      setHealthStatus({
        aiAvailable,
        aiMessage: aiAvailable ? 'Fournisseur en ligne' : 'Fournisseur hors ligne',
      });
    } catch (error) {
      setHealthStatus({ aiAvailable: false, aiMessage: "Statut IA inconnu" });
    }
  };

  const fetchPendingPreview = async () => {
    try {
      const res = await fetch('/api/questions?status=to_review');
      if (!res.ok) throw new Error('Failed to fetch pending questions');
      const data = await res.json();
      setPendingPreview((data || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching pending preview:', error);
    }
  };

  const handleStartGeneration = async () => {
    try {
      const res = await fetch('/api/admin/generation/generate', { method: 'POST' });
      if (!res.ok) throw new Error('Impossible de démarrer la génération');
      toast.success('Génération démarrée');
      await fetchBufferStatus();
    } catch (error: any) {
      console.error('Generation start error:', error);
    }
  };

  const handleToggleAutoRefill = async () => {
    if (!bufferStatus) return;
    const next = !bufferStatus.buffer.autoRefillEnabled;
    try {
      const res = await fetch('/api/admin/buffer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRefillEnabled: next }),
      });
      if (!res.ok) throw new Error('Impossible de mettre à jour le remplissage auto');
      toast.success(next ? 'Remplissage auto activé' : 'Remplissage auto désactivé');
      await fetchBufferStatus();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de statut');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Génération de Questions</h1>
        <p className="text-muted-foreground">Configurez et gérez la génération automatique de questions</p>
      </div>

      {/* Buffer Status */}
      {bufferStatus && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">État du buffer</h2>
            {bufferStatus.buffer.isGenerating && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                </span>
                <span className="text-sm font-medium text-primary animate-pulse">Génération en cours</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-sm mb-1">Questions en attente</p>
              <p className="text-3xl font-bold text-primary">{bufferStatus.buffer.currentSize}</p>
              <p className="text-xs text-muted-foreground mt-2">Objectif: {bufferStatus.buffer.targetSize}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-sm mb-1">Génération</p>
              <p className={`text-lg font-bold ${bufferStatus.buffer.isGenerating ? 'text-cyber-orange' : 'text-secondary'}`}>
                {bufferStatus.buffer.isGenerating ? '🔄 En cours' : 'Prête'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                File: {bufferStatus.buffer.queuedJobs} · Manquantes: {bufferStatus.buffer.missing}
              </p>
              {bufferStatus.buffer.lastGeneration.lastStartedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernier démarrage: {new Date(bufferStatus.buffer.lastGeneration.lastStartedAt).toLocaleTimeString()}
                </p>
              )}
              {bufferStatus.buffer.lastGeneration.lastFinishedAt && (
                <p className="text-xs text-muted-foreground">Dernière fin: {new Date(bufferStatus.buffer.lastGeneration.lastFinishedAt).toLocaleTimeString()}</p>
              )}
              {bufferStatus.buffer.lastGeneration.lastError && (
                <p className="text-xs text-cyber-orange mt-1">Erreur: {bufferStatus.buffer.lastGeneration.lastError}</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-sm mb-1">Remplissage auto</p>
              <p className={`text-lg font-bold ${bufferStatus.buffer.autoRefillEnabled ? 'text-secondary' : 'text-muted-foreground'}`}>
                {bufferStatus.buffer.autoRefillEnabled ? '✓ Activé' : '✕ Désactivé'}
              </p>
              <CyberButton
                variant={bufferStatus.buffer.autoRefillEnabled ? 'outline' : 'primary'}
                size="sm"
                className="mt-2 w-full"
                onClick={handleToggleAutoRefill}
              >
                {bufferStatus.buffer.autoRefillEnabled ? 'Désactiver' : 'Activer'}
              </CyberButton>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-sm mb-1">Fournisseur IA</p>
              <p className={`text-lg font-bold ${healthStatus.aiAvailable ? 'text-secondary' : 'text-cyber-red'}`}>
                {healthStatus.aiAvailable ? '✓ En ligne' : '✕ Hors ligne'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{healthStatus.aiMessage}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progression du buffer</span>
              <span>
                {bufferStatus.buffer.currentSize}/{bufferStatus.buffer.targetSize}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
              <div
                className={`h-full bg-primary transition-all ${bufferStatus.buffer.isGenerating ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.min(100, Math.round((bufferStatus.buffer.currentSize / Math.max(1, bufferStatus.buffer.targetSize)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generation Settings */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration</h2>
        <GenerationSettingsPanel />
      </div>

      {/* Pending questions preview */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Questions en attente de revue</h3>
          <Link href="/admin">
            <CyberButton variant="outline" size="sm">Ouvrir la banque</CyberButton>
          </Link>
        </div>

        {pendingPreview.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune question en attente.</p>
        ) : (
          <div className="space-y-3">
            {pendingPreview.map((q) => (
              <div key={q.id} className="bg-muted/50 rounded p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                </div>
                {q.category && (
                  <p className="text-xs text-muted-foreground mt-1">Catégorie: {q.category}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold">ℹ️ À propos de la génération</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Le buffer maintient automatiquement un nombre configuré de questions en attente d'examen</li>
          <li>• La génération commence au démarrage et lorsque des questions sont validées/rejetées</li>
          <li>• Les questions dupliquées sont détectées et filtrées automatiquement</li>
          <li>• Consultez la "Banque de questions" pour examiner et valider les questions générées</li>
        </ul>
      </div>
    </div>
  );
}
