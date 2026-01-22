import React, { useState, useEffect } from 'react';
import { Settings, PlayCircle, PauseCircle, RefreshCw } from 'lucide-react';
import CyberButton from '@/components/CyberButton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface GenerationSettings {
  targetPoolSize: number;
  autoGenerateEnabled: boolean;
  generationTopic: string;
  generationDifficulty: string;
  maxConcurrentGeneration: number;
}

interface PoolMaintenancePanelProps {
  onGenerationComplete?: () => void;
}

export function PoolMaintenancePanel({ onGenerationComplete }: PoolMaintenancePanelProps) {
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [poolSize, setPoolSize] = useState<number>(0);

  useEffect(() => {
    fetchSettings();
    fetchPoolSize();
    
    // Poll pool size every 10 seconds
    const interval = setInterval(fetchPoolSize, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPoolSize = async () => {
    try {
      const response = await fetch('/api/admin/questions', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const toReviewCount = data.filter((q: any) => q.status === 'to_review').length;
        setPoolSize(toReviewCount);
      }
    } catch (error) {
      console.error('Failed to fetch pool size:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/generation-settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/generation-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved');
        setDialogOpen(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const triggerMaintenance = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/admin/maintain-pool', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        await fetchPoolSize();
        onGenerationComplete?.();
      } else {
        throw new Error(data.error || 'Failed to trigger');
      }
    } catch (error) {
      toast.error('Failed to trigger pool maintenance');
    } finally {
      setTriggering(false);
    }
  };

  if (loading || !settings) {
    return null;
  }

  return (
    <div className="flex gap-3 items-center">
      {/* Status Indicator */}
      <div className="text-sm text-muted-foreground">
        Pool: <span className="font-mono font-bold text-primary">{poolSize}</span>
        {' / '}
        <span className="font-mono font-bold">{settings?.targetPoolSize || 0}</span>
        {settings?.autoGenerateEnabled ? (
          <span className="ml-2 text-green-500">● Auto</span>
        ) : (
          <span className="ml-2 text-gray-500">○ Manual</span>
        )}
      </div>

      {/* Trigger Manual Generation */}
      <CyberButton
        size="default"
        variant="outline"
        onClick={triggerMaintenance}
        disabled={triggering}
        className="gap-2"
      >
        <RefreshCw className={triggering ? 'animate-spin' : ''} size={16} />
        {triggering ? 'Generating...' : 'Generate Now'}
      </CyberButton>

      {/* Settings Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <CyberButton size="default" variant="outline" className="gap-2">
            <Settings size={16} />
            Pool Settings
          </CyberButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question Pool Maintenance</DialogTitle>
            <DialogDescription>
              Configure automatic question generation to maintain a steady pool for admin review
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-generate">Auto-Generate</Label>
              <Switch
                id="auto-generate"
                checked={settings.autoGenerateEnabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, autoGenerateEnabled: checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="target-pool-size">Target Pool Size</Label>
              <Input
                id="target-pool-size"
                type="number"
                min="5"
                max="500"
                value={settings.targetPoolSize}
                onChange={(e) => 
                  setSettings({ ...settings, targetPoolSize: parseInt(e.target.value) || 50 })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of questions to keep in "to_review" status
              </p>
            </div>

            <div>
              <Label htmlFor="max-concurrent">Max Concurrent Generation</Label>
              <Input
                id="max-concurrent"
                type="number"
                min="1"
                max="20"
                value={settings.maxConcurrentGeneration}
                onChange={(e) => 
                  setSettings({ ...settings, maxConcurrentGeneration: parseInt(e.target.value) || 5 })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max questions to generate in one batch
              </p>
            </div>

            <CyberButton 
              onClick={saveSettings} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </CyberButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
