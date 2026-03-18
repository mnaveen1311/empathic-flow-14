import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FolderOpen, FileText, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  name: string;
  category: string;
  size: number;
  rowCount: number;
  data: Record<string, string>[];
  saved?: boolean;
}

interface Props {
  onDataLoaded: (files: UploadedFile[]) => void;
}

const CATEGORIES = [
  { id: 'sensing', label: 'Sensing', desc: 'Activity, audio, conversation data' },
  { id: 'survey', label: 'Survey', desc: 'Stress, mood, sleep quality' },
  { id: 'app_usage', label: 'App Usage', desc: 'Screen time & app logs' },
  { id: 'education', label: 'Education', desc: 'Grades & deadlines' },
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
  return { headers, rows };
}

const DataUploader = ({ onDataLoaded }: Props) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeCategory, setActiveCategory] = useState('sensing');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      const text = await file.text();
      const { rows } = parseCSV(text);
      newFiles.push({
        name: file.name,
        category: activeCategory,
        size: file.size,
        rowCount: rows.length,
        data: rows,
      });
    }
    const updated = [...files, ...newFiles];
    setFiles(updated);
    onDataLoaded(updated);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onDataLoaded(updated);
  };

  const saveToBackend = async () => {
    setSaving(true);
    try {
      const unsaved = files.filter(f => !f.saved);
      for (const file of unsaved) {
        const { headers } = parseCSV(''); // headers from data keys
        const fileHeaders = file.data.length > 0 ? Object.keys(file.data[0]) : [];

        // Insert file metadata
        const { data: fileRecord, error: fileErr } = await supabase
          .from('uploaded_files')
          .insert({
            file_name: file.name,
            category: file.category,
            row_count: file.rowCount,
            file_size: file.size,
            headers: fileHeaders,
          })
          .select('id')
          .single();

        if (fileErr) throw fileErr;

        // Insert data in batches of 500
        const batchSize = 500;
        for (let i = 0; i < file.data.length; i += batchSize) {
          const batch = file.data.slice(i, i + batchSize).map(row => ({
            file_id: fileRecord.id,
            row_data: row,
          }));
          const { error: dataErr } = await supabase.from('uploaded_data').insert(batch);
          if (dataErr) throw dataErr;
        }

        file.saved = true;
      }
      setFiles([...files]);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload Data
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="surface-card-lg w-full max-w-2xl mx-4 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold heading-tight">Upload Student Life Dataset</h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      activeCategory === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FolderOpen className="w-3 h-3 inline mr-1.5" />
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {CATEGORIES.find(c => c.id === activeCategory)?.desc} — Select multiple CSV files
              </p>

              {/* Upload zone */}
              <label className="flex flex-col items-center gap-2 p-8 border border-dashed border-muted rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Drop CSVs here or click to browse</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground">{f.name}</span>
                        <span className="text-muted-foreground font-mono">
                          [{f.category}] {f.rowCount.toLocaleString()} rows
                        </span>
                        {f.saved && <span className="text-drift-positive text-[10px] font-mono">SAVED</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-drift-positive" />
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {files.length} file{files.length !== 1 ? 's' : ''} • {files.reduce((s, f) => s + f.rowCount, 0).toLocaleString()} total rows
                </span>
                <div className="flex gap-2">
                  {files.some(f => !f.saved) && (
                    <button
                      onClick={saveToBackend}
                      disabled={saving}
                      className="px-4 py-1.5 text-xs font-medium rounded-lg bg-drift-positive text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                      {saving ? 'Saving...' : 'Save to Cloud'}
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DataUploader;
