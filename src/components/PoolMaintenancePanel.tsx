'use client';

import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import CyberButton from './CyberButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GenerationStatus {
  poolSize: number;
  targetPoolSize: number;
  autoGenerateEnabled: boolean;
  generationTopic: string;
  generationDifficulty: string;
  maxConcurrentGeneration: number;
  isGenerating: boolean;
  isPaused: boolean;
  currentGeneration: {
    batchSize: number;
    progress: number;
    status: string;
  } | null;
}

interface Settings {
  targetPoolSize: number;
  autoGenerateEnabled: boolean;
  generationTopic: string;
  generationDifficulty: string;
  maxConcurrentGeneration: number;
}

export function PoolMaintenancePanel({ onGenerationComplete }: { onGenerationComplete?: () => void }) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to Server-Sent Events stream for real-time updates
  useEffect(() => {
    fetchStatus();
    
    // Connect to SSE stream
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      eventSourceRef.current = new EventSource('/api/admin/generation/stream');

      eventSourceRef.current.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setStatus(data.payload);
          } else if (data.type === 'progress') {
            // Update generation progress
            console.log('[GenerationPanel] Progress:', data.payload);
          } else if (data.type === 'question-added') {
            // Refresh pool size on new question
            fetchStatus();
            toast.success('New question added to pool');
          }
        } catch (error) {
          console.error('[GenerationPanel] SSE parse error:', error);
        }
      });

      eventSourceRef.current.onerror = () => {
        console.warn('[GenerationPanel] SSE connection lost, retrying...');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Fallback polling every 30 seconds in case SSE fails
    const pollInterval = setInterval(fetchStatus, 30000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearInterval(pollInterval);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/generation/status', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('[GenerationPanel] Failed to fetch status:', error);
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/generation-settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          targetPoolSize: data.targetPoolSize,
          autoGenerateEnabled: data.autoGenerateEnabled,
          generationTopic: data.generationTopic,
          generationDifficulty: data.generationDifficulty,
          maxConcurrentGeneration: data.maxConcurrentGeneration,
        });
      }
    } catch (error) {
      console.error('[GenerationPanel] Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      const response = await fetch('/api/admin/generation-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        setSettingsOpen(false);
        fetchStatus();
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    }
  };

  const toggleGeneration = async (action: 'pause' | 'resume') => {
    try {
      const response = await fetch(`/api/admin/generation/${action}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Update status with returned data
        setStatus((prev) =>
          prev ? {
            ...prev,
            isPaused: data.status.isPaused,
            isGenerating: data.status.isGenerating,
            currentGeneration: data.status.currentGeneration,
          } : null
        );
      } else {
        toast.error('Failed to update generation state');
      }
    } catch (error) {
      toast.error(`Error ${action}ing generation`);
    }
  };

  if (loading || !status) {
    return <div className="text-gray-400">Loading generation status...</div>;
  }

  const poolPercentage = (status.poolSize / status.targetPoolSize) * 100;
  const progressPercent = status.currentGeneration?.progress || 0;

  return (
    <div className="space-y-6">
      {/* Pool Status Display */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-lg p-6">
        <div className="space-y-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-cyan-400">Question Pool</h3>
            <span className={`text-sm font-mono px-3 py-1 rounded ${
              status.isGenerating ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
            }`}>
              {status.isGenerating ? '🔄 Generating' : '✓ Ready'}
            </span>
          </div>

          {/* Pool Count with Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-cyan-300 font-mono">
                {status.poolSize}
              </span>
              <span className="text-sm text-gray-400">
                Target: {status.targetPoolSize}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(poolPercentage, 100)}%` }}
              />
            </div>
            
            <div className="text-xs text-gray-400 text-right">
              {poolPercentage.toFixed(0)}% full
            </div>
          </div>

          {/* Current Generation Progress */}
          {status.isGenerating && status.currentGeneration && (
            <div className="bg-slate-700/50 rounded p-4 space-y-2">
              <div className="text-sm text-gray-300">
                Generating batch: {status.currentGeneration.batchSize} questions
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-yellow-300">
                Progress: {Math.round(progressPercent)}%
              </div>
            </div>
          )}

          {/* Settings Info */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div>
              <span className="text-gray-500">Topic:</span> {status.generationTopic}
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span> {status.generationDifficulty}
            </div>
            <div>
              <span className="text-gray-500">Auto-generate:</span>{' '}
              {status.autoGenerateEnabled ? '✓ On' : '○ Off'}
            </div>
            <div>
              <span className="text-gray-500">Max batch:</span> {status.maxConcurrentGeneration}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        {status.isGenerating && !status.isPaused ? (
          <CyberButton
            onClick={() => toggleGeneration('pause')}
            variant="primary"
            className="flex-1"
          >
            ⏸ Pause Generation
          </CyberButton>
        ) : (
          <CyberButton
            onClick={() => toggleGeneration('resume')}
            variant="primary"
            className="flex-1"
          >
            ▶ Resume Generation
          </CyberButton>
        )}

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <CyberButton
              onClick={fetchSettings}
              variant="secondary"
              className="flex-1"
            >
              ⚙ Settings
            </CyberButton>
          </DialogTrigger>

          <DialogContent className="bg-slate-900 border border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Generation Settings</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure automatic question generation
              </DialogDescription>
            </DialogHeader>

            {settings && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="poolSize" className="text-gray-300">
                    Target Pool Size
                  </Label>
                  <Input
                    id="poolSize"
                    type="number"
                    min={1}
                    max={500}
                    value={settings.targetPoolSize}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        targetPoolSize: parseInt(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-600 text-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    The system will maintain this many questions in the review pool
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-gray-300">
                    Generation Topic
                  </Label>
                  <Input
                    id="topic"
                    value={settings.generationTopic}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        generationTopic: e.target.value,
                      })
                    }
                    className="bg-slate-800 border-slate-600 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-gray-300">
                    Difficulty Level
                  </Label>
                  <select
                    id="difficulty"
                    value={settings.generationDifficulty}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        generationDifficulty: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-600 rounded text-gray-100 px-3 py-2"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoGenerate"
                    checked={settings.autoGenerateEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoGenerateEnabled: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="autoGenerate" className="text-gray-300">
                    Auto-generate when pool is below target
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <CyberButton
                    onClick={saveSettings}
                    variant="primary"
                    className="flex-1"
                  >
                    Save Settings
                  </CyberButton>
                  <CyberButton
                    onClick={() => setSettingsOpen(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </CyberButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
