import { motion } from 'framer-motion';
import type { DataPoint } from '@/lib/dataEngine';

interface Props {
  data: DataPoint[];
}

const PredictionTable = ({ data }: Props) => {
  const rows = data.slice(-7).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="surface-card p-6"
    >
      <h3 className="text-sm font-semibold heading-tight mb-1">Prediction Sequence</h3>
      <p className="text-xs text-muted-foreground mb-4">Next-day emotional state predictions vs. ground truth</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-secondary">
              <th className="text-left text-muted-foreground font-medium py-2 pr-4">Date</th>
              <th className="text-right text-muted-foreground font-medium py-2 px-3">Mood</th>
              <th className="text-right text-muted-foreground font-medium py-2 px-3">Stress</th>
              <th className="text-right text-muted-foreground font-medium py-2 px-3">Drift</th>
              <th className="text-right text-muted-foreground font-medium py-2 px-3">Sleep</th>
              <th className="text-right text-muted-foreground font-medium py-2 pl-3">Consistency</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={row.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.04 }}
                className="border-b border-secondary/50"
              >
                <td className="py-2.5 pr-4 font-mono text-muted-foreground">{row.date}</td>
                <td className="py-2.5 px-3 text-right font-mono text-primary">{row.mood}</td>
                <td className="py-2.5 px-3 text-right font-mono text-foreground">{row.stress}</td>
                <td className={`py-2.5 px-3 text-right font-mono ${row.driftCoefficient > 0.1 ? 'text-drift-negative' : 'text-drift-positive'}`}>
                  {row.driftCoefficient.toFixed(3)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{row.sleepDuration}h</td>
                <td className="py-2.5 pl-3 text-right font-mono text-muted-foreground">{row.behavioralConsistency.toFixed(2)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PredictionTable;
