import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import type { DataPoint } from '@/lib/dataEngine';

interface Props {
  data: DataPoint[];
}

const DataExport = ({ data }: Props) => {
  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]) as (keyof DataPoint)[];
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={exportCSV}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </motion.button>
  );
};

export default DataExport;
