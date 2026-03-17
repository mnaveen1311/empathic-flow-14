import { motion } from 'framer-motion';

interface Props {
  matrix: number[][];
}

const labels = ['Low', 'Mid', 'High'];

const ConfusionMatrix = ({ matrix }: Props) => {
  const maxVal = Math.max(...matrix.flat());

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="surface-card p-6"
    >
      <h3 className="text-sm font-semibold heading-tight mb-1">Confusion Matrix</h3>
      <p className="text-xs text-muted-foreground mb-4">Mood classification — 3 bins</p>
      <div className="flex items-center justify-center">
        <div>
          <div className="flex gap-1 mb-1 ml-10">
            {labels.map(l => (
              <div key={l} className="w-14 text-center text-xs text-muted-foreground">{l}</div>
            ))}
          </div>
          {matrix.map((row, i) => (
            <div key={i} className="flex items-center gap-1 mb-1">
              <span className="w-9 text-right text-xs text-muted-foreground mr-1">{labels[i]}</span>
              {row.map((val, j) => {
                const intensity = val / maxVal;
                const isDiag = i === j;
                return (
                  <motion.div
                    key={j}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 + (i * 3 + j) * 0.04 }}
                    className="w-14 h-12 rounded-md flex items-center justify-center font-mono text-sm"
                    style={{
                      backgroundColor: isDiag
                        ? `hsl(217 91% 60% / ${0.15 + intensity * 0.6})`
                        : `hsl(0 84% 60% / ${intensity * 0.3})`,
                    }}
                  >
                    <span className={isDiag ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                      {val}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ConfusionMatrix;
