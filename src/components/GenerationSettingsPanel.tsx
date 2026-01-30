/**
 * Generation Settings Panel - Industrial Grade
 * 
 * Controls for Structured Generation Space, buffer configuration, and model selection.
 * No chat interface - pure policy controls.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, Trash2, Plus } from 'lucide-react';
import CyberButton from './CyberButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RssFeedsPanel } from './RssFeedsPanel';
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
  'Sécurité Réseau',
  'Sécurité Applicative',
  'Sécurité Cloud',
  'Identité & Accès',
  'Renseignement sur les Menaces',
  'Réponse aux Incidents',
  'Cryptographie',
  'Conformité & Gouvernance',
];

const DEFAULT_SKILL_TYPES = [
  'Détection',
  'Prévention',
  'Analyse',
  'Configuration',
  'Bonnes Pratiques',
];

const DEFAULT_DIFFICULTIES = [
  'Débutant',
  'Intermédiaire',
  'Avancé',
  'Expert',
];

const DEFAULT_GRANULARITIES = [
  'Conceptuel',
  'Procédural',
  'Technique',
  'Stratégique',
];

// Labels removed - using French values directly







export function GenerationSettingsPanel() {
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for managing available dimension values
  const [availableDomains, setAvailableDomains] = useState<string[]>(DEFAULT_DOMAINS);
  const [availableSkillTypes, setAvailableSkillTypes] = useState<string[]>(DEFAULT_SKILL_TYPES);
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>(DEFAULT_DIFFICULTIES);
  const [availableGranularities, setAvailableGranularities] = useState<string[]>(DEFAULT_GRANULARITIES);
  
  // State for new value inputs
  const [newDomain, setNewDomain] = useState('');
  const [newSkillType, setNewSkillType] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('');
  const [newGranularity, setNewGranularity] = useState('');

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

  // Add new dimension values
  const addDomain = () => {
    if (!newDomain.trim() || availableDomains.includes(newDomain.trim())) return;
    setAvailableDomains([...availableDomains, newDomain.trim()]);
    setNewDomain('');
    toast.success(`Domaine "${newDomain.trim()}" ajouté`);
  };

  const addSkillType = () => {
    if (!newSkillType.trim() || availableSkillTypes.includes(newSkillType.trim())) return;
    setAvailableSkillTypes([...availableSkillTypes, newSkillType.trim()]);
    setNewSkillType('');
    toast.success(`Compétence "${newSkillType.trim()}" ajoutée`);
  };

  const addDifficulty = () => {
    if (!newDifficulty.trim() || availableDifficulties.includes(newDifficulty.trim())) return;
    setAvailableDifficulties([...availableDifficulties, newDifficulty.trim()]);
    setNewDifficulty('');
    toast.success(`Difficulté "${newDifficulty.trim()}" ajoutée`);
  };

  const addGranularity = () => {
    if (!newGranularity.trim() || availableGranularities.includes(newGranularity.trim())) return;
    setAvailableGranularities([...availableGranularities, newGranularity.trim()]);
    setNewGranularity('');
    toast.success(`Granularité "${newGranularity.trim()}" ajoutée`);
  };

  // Delete dimension values
  const deleteDomain = (domain: string) => {
    if (!settings) return;
    setAvailableDomains(availableDomains.filter(d => d !== domain));
    // Also remove from enabled if present
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledDomains: settings.structuredSpace.enabledDomains.filter(d => d !== domain),
      },
    });
    toast.success(`Domaine "${domain}" supprimé`);
  };

  const deleteSkillType = (skillType: string) => {
    if (!settings) return;
    setAvailableSkillTypes(availableSkillTypes.filter(s => s !== skillType));
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledSkillTypes: settings.structuredSpace.enabledSkillTypes.filter(s => s !== skillType),
      },
    });
    toast.success(`Compétence "${skillType}" supprimée`);
  };

  const deleteDifficulty = (difficulty: string) => {
    if (!settings) return;
    setAvailableDifficulties(availableDifficulties.filter(d => d !== difficulty));
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledDifficulties: settings.structuredSpace.enabledDifficulties.filter(d => d !== difficulty),
      },
    });
    toast.success(`Difficulté "${difficulty}" supprimée`);
  };

  const deleteGranularity = (granularity: string) => {
    if (!settings) return;
    setAvailableGranularities(availableGranularities.filter(g => g !== granularity));
    setSettings({
      ...settings,
      structuredSpace: {
        ...settings.structuredSpace,
        enabledGranularities: settings.structuredSpace.enabledGranularities.filter(g => g !== granularity),
      },
    });
    toast.success(`Granularité "${granularity}" supprimée`);
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
          Paramètres de Génération
        </CyberButton>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paramètres de Génération</DialogTitle>
          <DialogDescription>
            Configurer la taille du buffer, l'espace de génération structuré, la sélection de modèle et les flux RSS
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="space">Espace Structuré</TabsTrigger>
            <TabsTrigger value="rss">Flux RSS</TabsTrigger>
          </TabsList>

          {/* TAB: General Settings */}
          <TabsContent value="general" className="space-y-6">
            {/* Buffer Configuration */}
            <Card>
            <CardHeader>
              <CardTitle>Configuration du Buffer</CardTitle>
              <CardDescription>Contrôler la génération automatique et la taille du buffer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Remplissage Automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Générer automatiquement des questions quand le buffer diminue
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
                <Label>Taille du Buffer (questions prêtes pour révision)</Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  step="1"
                  value={settings.bufferSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string (user is deleting) or valid numbers
                    if (value === '') {
                      setSettings({ ...settings, bufferSize: '' as any });
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue >= 1) {
                        setSettings({ ...settings, bufferSize: numValue });
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // On blur, ensure we have a valid value (fallback to 1 if invalid)
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value)) || parseInt(value) < 1) {
                      setSettings({ ...settings, bufferSize: 1 });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Min: 1 | Recommandé: 10-50 | Max: 999
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structured Generation Space */}
        <TabsContent value="space" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Espace de Génération Structuré</CardTitle>
              <CardDescription>
                Activer la génération contrôlée par entropie avec dimensions configurables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer l'Espace Structuré</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.structuredSpace.enabled 
                      ? 'Questions générées avec contrôle de diversité par slot'
                      : 'Utilisation du mode de génération classique'}
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
                  <div className="space-y-3">
                    <Label>Domaines Activés ({settings.structuredSpace.enabledDomains.length}/{availableDomains.length})</Label>
                    
                    {/* Add new domain */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau domaine..."
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                      />
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={addDomain}
                        disabled={!newDomain.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </CyberButton>
                    </div>
                    
                    {/* Domain checkboxes with delete */}
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {availableDomains.map((domain) => (
                        <div key={domain} className="flex items-center justify-between space-x-2 group">
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox
                              id={`domain-${domain}`}
                              checked={settings.structuredSpace.enabledDomains.includes(domain)}
                              onCheckedChange={() => toggleDomain(domain)}
                            />
                            <label htmlFor={`domain-${domain}`} className="text-sm cursor-pointer flex-1">
                              {domain}
                            </label>
                          </div>
                          <button
                            onClick={() => deleteDomain(domain)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skill Types */}
                  <div className="space-y-3">
                    <Label>Types de Compétences Activés ({settings.structuredSpace.enabledSkillTypes.length}/{availableSkillTypes.length})</Label>
                    
                    {/* Add new skill type */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau type de compétence..."
                        value={newSkillType}
                        onChange={(e) => setNewSkillType(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkillType()}
                      />
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={addSkillType}
                        disabled={!newSkillType.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </CyberButton>
                    </div>
                    
                    {/* Skill type checkboxes with delete */}
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {availableSkillTypes.map((skillType) => (
                        <div key={skillType} className="flex items-center justify-between space-x-2 group">
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox
                              id={`skill-${skillType}`}
                              checked={settings.structuredSpace.enabledSkillTypes.includes(skillType)}
                              onCheckedChange={() => toggleSkillType(skillType)}
                            />
                            <label htmlFor={`skill-${skillType}`} className="text-sm cursor-pointer flex-1">
                              {skillType}
                            </label>
                          </div>
                          <button
                            onClick={() => deleteSkillType(skillType)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulties */}
                  <div className="space-y-3">
                    <Label>Niveaux de Difficulté Activés ({settings.structuredSpace.enabledDifficulties.length}/{availableDifficulties.length})</Label>
                    
                    {/* Add new difficulty */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau niveau..."
                        value={newDifficulty}
                        onChange={(e) => setNewDifficulty(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addDifficulty()}
                      />
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={addDifficulty}
                        disabled={!newDifficulty.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </CyberButton>
                    </div>
                    
                    {/* Difficulty checkboxes with delete */}
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {availableDifficulties.map((difficulty) => (
                        <div key={difficulty} className="flex items-center justify-between space-x-2 group">
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox
                              id={`diff-${difficulty}`}
                              checked={settings.structuredSpace.enabledDifficulties.includes(difficulty)}
                              onCheckedChange={() => toggleDifficulty(difficulty)}
                            />
                            <label htmlFor={`diff-${difficulty}`} className="text-sm cursor-pointer flex-1">
                              {difficulty}
                            </label>
                          </div>
                          <button
                            onClick={() => deleteDifficulty(difficulty)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Granularities */}
                  <div className="space-y-3">
                    <Label>Granularités Activées ({settings.structuredSpace.enabledGranularities.length}/{availableGranularities.length})</Label>
                    
                    {/* Add new granularity */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouvelle granularité..."
                        value={newGranularity}
                        onChange={(e) => setNewGranularity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addGranularity()}
                      />
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={addGranularity}
                        disabled={!newGranularity.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </CyberButton>
                    </div>
                    
                    {/* Granularity checkboxes with delete */}
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {availableGranularities.map((granularity) => (
                        <div key={granularity} className="flex items-center justify-between space-x-2 group">
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox
                              id={`gran-${granularity}`}
                              checked={settings.structuredSpace.enabledGranularities.includes(granularity)}
                              onCheckedChange={() => toggleGranularity(granularity)}
                            />
                            <label htmlFor={`gran-${granularity}`} className="text-sm cursor-pointer flex-1">
                              {granularity}
                            </label>
                          </div>
                          <button
                            onClick={() => deleteGranularity(granularity)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
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
              <CardTitle>Configuration du Modèle IA</CardTitle>
              <CardDescription>Sélectionner les modèles pour la génération de questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Modèle par Défaut</Label>
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
                <Label>Modèle de Secours</Label>
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
                  Utilisé quand le modèle par défaut échoue ou est indisponible
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* TAB: RSS Feeds */}
          <TabsContent value="rss">
            <RssFeedsPanel />
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <CyberButton variant="outline" onClick={() => setDialogOpen(false)}>
            Annuler
          </CyberButton>
          <CyberButton variant="primary" onClick={saveSettings} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </CyberButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
