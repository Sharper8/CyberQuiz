/**
 * RSS Feed Sources Panel
 * Manage RSS sources for content-based question generation
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import CyberButton from './CyberButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RssSource {
  id: number;
  url: string;
  title?: string;
  enabled: boolean;
  refreshIntervalMin: number;
  lastFetchedAt?: string;
  lastFetchError?: string;
  _count?: { articles: number };
}

interface RssSettings {
  rssEnabled: boolean;
  useRssAsContext: boolean;
}

export function RssFeedsPanel() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [settings, setSettings] = useState<RssSettings>({ rssEnabled: false, useRssAsContext: true });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [addingFeed, setAddingFeed] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sourcesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/rss/sources'),
        fetch('/api/admin/buffer/settings'),
      ]);

      if (sourcesRes.ok) {
        setSources(await sourcesRes.json());
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings({
          rssEnabled: data.rssEnabled || false,
          useRssAsContext: data.useRssAsContext !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching RSS data:', error);
      toast.error('Failed to load RSS settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleRssEnabled = async () => {
    try {
      const newSettings = { ...settings, rssEnabled: !settings.rssEnabled };
      const res = await fetch('/api/admin/buffer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setSettings(newSettings);
      toast.success('RSS settings updated');
    } catch (error) {
      toast.error('Failed to update RSS settings');
    }
  };

  const toggleUseAsContext = async () => {
    try {
      const newSettings = { ...settings, useRssAsContext: !settings.useRssAsContext };
      const res = await fetch('/api/admin/buffer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setSettings(newSettings);
      toast.success('Context usage updated');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const addFeed = async () => {
    if (!newFeedUrl.trim()) {
      toast.error('Please enter a feed URL');
      return;
    }

    setAddingFeed(true);
    try {
      const res = await fetch('/api/admin/rss/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newFeedUrl.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add feed');
      }

      const newSource = await res.json();
      setSources([...sources, newSource]);
      setNewFeedUrl('');
      setAddDialogOpen(false);
      toast.success('Feed added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add feed');
    } finally {
      setAddingFeed(false);
    }
  };

  const deleteFeed = async (id: number) => {
    if (!confirm('Are you sure you want to delete this RSS feed?')) return;

    try {
      const res = await fetch(`/api/admin/rss/sources/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setSources(sources.filter(s => s.id !== id));
      toast.success('Feed deleted');
    } catch (error) {
      toast.error('Failed to delete feed');
    }
  };

  const toggleFeedEnabled = async (id: number, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/rss/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setSources(sources.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    } catch (error) {
      toast.error('Failed to toggle feed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Loading RSS settings...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RSS Feed Sources</CardTitle>
        <CardDescription>
          Add RSS feeds to generate questions based on current cybersecurity news and articles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div>
            <Label className="text-sm font-medium">Enable RSS-based Generation</Label>
            <p className="text-xs text-muted-foreground mt-1">Use RSS content as context for question generation</p>
          </div>
          <Switch
            checked={settings.rssEnabled}
            onCheckedChange={toggleRssEnabled}
          />
        </div>

        {/* Use as Context Toggle */}
        {settings.rssEnabled && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div>
              <Label className="text-sm font-medium">Use RSS as Generation Context</Label>
              <p className="text-xs text-muted-foreground mt-1">Include recent articles in generation prompts</p>
            </div>
            <Switch
              checked={settings.useRssAsContext}
              onCheckedChange={toggleUseAsContext}
            />
          </div>
        )}

        {/* Add Feed Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <CyberButton variant="outline" size="sm" disabled={!settings.rssEnabled}>
              <Plus className="w-4 h-4 mr-2" />
              Add RSS Feed
            </CyberButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add RSS Feed</DialogTitle>
              <DialogDescription>
                Enter the URL of an RSS or Atom feed. We'll validate and import the feed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feed-url">Feed URL</Label>
                <Input
                  id="feed-url"
                  placeholder="https://example.com/feed.xml"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <CyberButton
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </CyberButton>
                <CyberButton
                  onClick={addFeed}
                  disabled={addingFeed || !newFeedUrl.trim()}
                >
                  {addingFeed ? 'Adding...' : 'Add Feed'}
                </CyberButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Feeds List */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Feeds ({sources.filter(s => s.enabled).length})</Label>
          {sources.length === 0 ? (
            <div className="p-4 border border-dashed rounded-lg text-center">
              <p className="text-sm text-muted-foreground">No RSS feeds added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div key={source.id} className="p-3 border rounded-lg flex items-start justify-between hover:bg-muted/30 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={() => toggleFeedEnabled(source.id, source.enabled)}
                      />
                      <div>
                        <p className="text-sm font-medium">{source.title || new URL(source.url).hostname}</p>
                        <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground flex gap-3">
                      {source._count?.articles && (
                        <span>{source._count.articles} articles</span>
                      )}
                      {source.lastFetchedAt && (
                        <span>Last synced: {new Date(source.lastFetchedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {source.lastFetchError && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{source.lastFetchError}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteFeed(source.id)}
                    className="p-2 hover:bg-destructive/20 rounded transition text-destructive ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        {settings.rssEnabled && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">💡 How it works</p>
            <ul className="space-y-1 text-blue-600 dark:text-blue-300">
              <li>• Recent articles from your RSS feeds will be synced regularly</li>
              <li>• When enabled, article summaries are included in generation prompts</li>
              <li>• This helps generate questions based on current cybersecurity topics</li>
              <li>• Each article is marked after being used to avoid repetition</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
