import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import CyberButton from '@/components/CyberButton';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExportImportPanelProps {
  onImportSuccess?: () => void;
}

export function ExportImportPanel({ onImportSuccess }: ExportImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [exportStatus, setExportStatus] = useState<'all' | 'accepted' | 'to_review' | 'rejected'>('all');

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        status: exportStatus,
      });

      const response = await fetch(`/api/admin/questions/export?${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        let errorMessage = 'Export failed';
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.message || 'Export failed';
          } catch (e) {
            errorMessage = await response.text();
          }
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      // Get filename from headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ?.split('filename="')[1]
        ?.split('"')[0] || `questions.${exportFormat}`;

      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Questions exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/questions/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Import failed');
      }

      // Count different types of errors
      const duplicateErrors = result.errors?.filter((e: any) => e.error.includes('already exists')) || [];
      const otherErrors = (result.errors || []).filter((e: any) => !e.error.includes('already exists'));

      toast.success(`Imported ${result.imported} questions successfully`);

      if (duplicateErrors.length > 0) {
        toast.warning(`${duplicateErrors.length} questions already existing (not imported)`);
      }

      if (otherErrors.length > 0) {
        toast.warning(`${otherErrors.length} rows had errors`);
        console.warn('Import errors:', otherErrors);
      }

      setImportDialogOpen(false);
      onImportSuccess?.();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Export Button */}
      <Dialog>
        <DialogTrigger asChild>
          <CyberButton
            size="default"
            variant="outline"
            disabled={exporting}
            className="gap-2"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export'}
          </CyberButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Questions</DialogTitle>
            <DialogDescription>
              Choose export format and which questions to export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="export-format">Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'xlsx')}>
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="export-status">Status</Label>
              <Select
                value={exportStatus}
                onValueChange={(v) => setExportStatus(v as any)}
              >
                <SelectTrigger id="export-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="accepted">Accepted Only</SelectItem>
                  <SelectItem value="to_review">To Review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CyberButton
              onClick={handleExport}
              disabled={exporting}
              className="w-full"
            >
              {exporting ? 'Exporting...' : 'Download'}
            </CyberButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Button */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <CyberButton
            size="default"
            variant="outline"
            disabled={importing}
            className="gap-2"
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Import'}
          </CyberButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Questions</DialogTitle>
            <DialogDescription>
              Upload a CSV file with questions. The file must contain columns: Question, Option 1, Option 2, Correct Answer, Explanation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  handleImport(file);
                }
              }}
              disabled={importing}
            />
            <p className="text-sm text-muted-foreground">
              <strong>Required columns:</strong> Question, Option 1, Option 2, Correct Answer, Explanation
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Optional columns:</strong> Category, Difficulty (0-1), Quality Score (0-1), Status (to_review/accepted), MITRE Techniques (semicolon-separated), Tags (semicolon-separated)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
