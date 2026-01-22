/**
 * Generation Settings Panel - Industrial Grade
 * 
 * Controls for Structured Generation Space, buffer configuration, and model selection.
 * No chat interface - pure policy controls.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import CyberButton from './CyberButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GenerationSettings {
  bufferSize: number;
  autoRefillEnabled: boolean;
  defaultModel: string;
  fallbackModel: string;
  structuredSpace: {
    enabled: boolean;
    enabledDomains: string[];
    enabledSkillTypes: string[];
    enabledDifficulties: string[];
    enabledGranularities: string[];
  };
}

const AVAILABLE_MODELS = [
  { value: 'ollama:mistral:7b', label: 'Ollama - Mistral 7B (Default)' },
  { value: 'ollama:llama3.1:8b', label: 'Ollama - Llama 3.1 8B' },
  { value: 'openai:gpt-4', label: 'OpenAI GPT-4 (Requires API key)' },
];

const DEFAULT_DOMAINS = [
  'Network Security',
  'Application Security',
  'Cloud Security',
  'Identity & Access',
  'Threat Intelligence',
  'Incident Response',
  'Cryptography',
  'Compliance & Governance',
];

const DEFAULT_SKILL_TYPES = [
  'Detection',
  'Prevention',
  'Analysis',
  'Configuration',
  'Best Practices',
];

const DEFAULT_DIFFICULTIES = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
];

const DEFAULT_GRANULARITIES = [
  'Conceptual',
  'Procedural',
  'Technical',
  'Strategic',
];

export function GenerationSettingsPanel() {
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/buffer/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('[Settings] Fetch error:', error);
      toast.error('Failed to load settings');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/buffer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Settings saved successfully');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleDomain = (domain: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledDomains: settings.structuredSpace.enabledDomains.includes(domain)
          ? settings.structuredSpace.enabledDomains.filter(d => d !== domain)
          : [...settings.structuredSpace.enabledDomains, domain],
      },
    });
  };

  const toggleSkillType = (skillType: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledSkillTypes: settings.structuredSpace.enabledSkillTypes.includes(skillType)
          ? settings.structuredSpace.enabledSkillTypes.filter(s => s !== skillType)
          : [...settings.structuredSpace.enabledSkillTypes, skillType],
      },
    });
  };

  const toggleDifficulty = (difficulty: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledDifficulties: settings.structuredSpace.enabledDifficulties.includes(difficulty)
          ? settings.structuredSpace.enabledDifficulties.filter(d => d !== difficulty)
          : [...settings.structuredSpace.enabledDifficulties, difficulty],
      },
    });
  };

  const toggleGranularity = (granularity: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledGranularities: settings.structuredSpace.enabledGranularities.includes(granularity)
          ? settings.structuredSpace.enabledGranularities.filter(g => g !== granularity)
          : [...settings.structuredSpace.enabledGranularities, granularity],
      },
    });
  };

  if (!settings) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <CyberButton variant="outline" size="lg">
          <Settings className="h-5 w-5 mr-2" />
          Generation Settings
        </CyberButton>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generation Settings</DialogTitle>
          <DialogDescription>
            Configure buffer size, structured generation space, and model selection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Buffer Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Buffer Configuration</CardTitle>
              <CardDescription>Control automatic question generation and buffer size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-refill Buffer</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate questions when buffer depletes
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefillEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoRefillEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Buffer Size (questions ready for review)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.bufferSize}
                  onChange={(e) =>
                    setSettings({ ...settings, bufferSize: parseInt(e.target.value) || 10 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-20 for continuous operation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Structured Generation Space */}
          <Card>
            <CardHeader>
              <CardTitle>Structured Generation Space</CardTitle>
              <CardDescription>
                Enable entropy-controlled generation with configurable dimensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Structured Space</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.structuredSpace.enabled 
                      ? 'Questions generated with slot-based diversity control'
                      : 'Using legacy generation mode'}
                  </p>
                </div>
                <Switch
                  checked={settings.structuredSpace.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      structuredSpace: { ...settings.structuredSpace, enabled: checked },
                    })
                  }
                />
              </div>

              {settings.structuredSpace.enabled && (
                <>
                  {/* Domains */}
                  <div className="space-y-2">
                    <Label>Enabled Domains ({settings.structuredSpace.enabledDomains.length})</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_DOMAINS.map((domain) => (
                        <div key={domain} className="flex items-center space-x-2">
                          <Checkbox
                            id={`domain-${domain}`}
                            checked={settings.structuredSpace.enabledDomains.includes(domain)}
                            onCheckedChange={() => toggleDomain(domain)}
                          />
                          <label htmlFor={`domain-${domain}`} className="text-sm cursor-pointer">
                            {domain}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skill Types */}
                  <div className="space-y-2">
                    <Label>Enabled Skill Types ({settings.structuredSpace.enabledSkillTypes.length})</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_SKILL_TYPES.map((skillType) => (
                        <div key={skillType} className="flex items-center space-x-2">
                          <Checkbox
                            id={`skill-${skillType}`}
                            checked={settings.structuredSpace.enabledSkillTypes.includes(skillType)}
                            onCheckedChange={() => toggleSkillType(skillType)}
                          />
                          <label htmlFor={`skill-${skillType}`} className="text-sm cursor-pointer">
                            {skillType}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulties */}
                  <div className="space-y-2">
                    <Label>Enabled Difficulties ({settings.structuredSpace.enabledDifficulties.length})</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_DIFFICULTIES.map((difficulty) => (
                        <div key={difficulty} className="flex items-center space-x-2">
                          <Checkbox
                            id={`diff-${difficulty}`}
                            checked={settings.structuredSpace.enabledDifficulties.includes(difficulty)}
                            onCheckedChange={() => toggleDifficulty(difficulty)}
                          />
                          <label htmlFor={`diff-${difficulty}`} className="text-sm cursor-pointer">
                            {difficulty}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Granularities */}
                  <div className="space-y-2">
                    <Label>Enabled Granularities ({settings.structuredSpace.enabledGranularities.length})</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_GRANULARITIES.map((granularity) => (
                        <div key={granularity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`gran-${granularity}`}
                            checked={settings.structuredSpace.enabledGranularities.includes(granularity)}
                            onCheckedChange={() => toggleGranularity(granularity)}
                          />
                          <label htmlFor={`gran-${granularity}`} className="text-sm cursor-pointer">
                            {granularity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Configuration</CardTitle>
              <CardDescription>Select models for question generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select
                  value={settings.defaultModel}
                  onValueChange={(value) => setSettings({ ...settings, defaultModel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fallback Model</Label>
                <Select
                  value={settings.fallbackModel}
                  onValueChange={(value) => setSettings({ ...settings, fallbackModel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used when default model fails or is unavailable
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <CyberButton variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </CyberButton>
          <CyberButton variant="primary" onClick={saveSettings} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </CyberButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
