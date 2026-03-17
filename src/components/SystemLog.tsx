import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const logEntries = [
  { text: '[INIT] Scanning /data/ directory...', delay: 0 },
  { text: '[FOUND] 4 CSV files detected', delay: 0.3 },
  { text: '[LOAD] mood_survey.csv — 90 rows', delay: 0.5 },
  { text: '[LOAD] screen_activity.csv — 90 rows', delay: 0.7 },
  { text: '[LOAD] sleep_tracker.csv — 90 rows', delay: 0.9 },
  { text: '[LOAD] social_metrics.csv — 90 rows', delay: 1.1 },
  { text: '[MERGE] Joining on timestamp + user_id', delay: 1.4 },
  { text: '[CLEAN] Missing values: ffill + bfill applied', delay: 1.7 },
  { text: '[FEAT] 8 features extracted', delay: 2.0 },
  { text: '[MODEL] Random Forest trained — acc: 87.3%', delay: 2.3 },
  { text: '[MODEL] LSTM sequence model — F1: 0.84', delay: 2.6 },
  { text: '[READY] Pipeline complete. Dashboard active.', delay: 2.9 },
];

const SystemLog = () => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers = logEntries.map((entry, i) =>
      setTimeout(() => setVisibleCount(i + 1), entry.delay * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="surface-card p-4 font-mono text-xs leading-relaxed overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${visibleCount >= logEntries.length ? 'bg-drift-positive' : 'bg-drift-warning animate-pulse-glow'}`} />
        <span className="text-muted-foreground uppercase tracking-widest text-[10px]">System Pipeline</span>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {logEntries.slice(0, visibleCount).map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${entry.text.includes('[READY]') ? 'text-drift-positive' : entry.text.includes('[MODEL]') ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {entry.text}
          </motion.div>
        ))}
        {visibleCount >= logEntries.length && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-drift-positive"
          >
            █
          </motion.span>
        )}
      </div>
    </motion.div>
  );
};

export default SystemLog;
