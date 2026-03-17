import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  unit?: string;
  delay?: number;
}

const MetricCard = ({ label, value, delta, deltaType = 'neutral', unit, delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="surface-card p-5"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="metric-value text-primary">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {delta && (
        <p className={`text-xs mt-2 font-mono tabular-nums ${
          deltaType === 'positive' ? 'text-drift-positive' : 
          deltaType === 'negative' ? 'text-drift-negative' : 'text-muted-foreground'
        }`}>
          {delta}
        </p>
      )}
    </motion.div>
  );
};

export default MetricCard;
