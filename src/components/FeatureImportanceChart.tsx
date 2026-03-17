import { motion } from 'framer-motion';
import type { FeatureImportance } from '@/lib/dataEngine';

interface Props {
  features: FeatureImportance[];
}

const FeatureImportanceChart = ({ features }: Props) => {
  const maxVal = Math.max(...features.map(f => f.importance));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="surface-card p-6"
    >
      <h3 className="text-sm font-semibold heading-tight mb-1">Feature Importance</h3>
      <p className="text-xs text-muted-foreground mb-5">Random Forest — Gini coefficient</p>
      <div className="space-y-3">
        {features.map((f, i) => (
          <motion.div
            key={f.feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{f.feature}</span>
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(f.importance / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-primary w-10 text-right">{f.importance.toFixed(2)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FeatureImportanceChart;
