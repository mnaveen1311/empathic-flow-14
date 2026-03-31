import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, Brain, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { DataPoint } from '@/lib/dataEngine';
import { trainModel, type TrainingResult, type TrainingConfig } from '@/lib/mlEngine';

interface Props {
  data: DataPoint[];
  onTrainingComplete?: (result: TrainingResult) => void;
}

const DEFAULT_CONFIG: TrainingConfig = {
  testSplit: 0.2,
  maxDepth: 6,
  minSamples: 3,
  epochs: 50,
  learningRate: 0.01,
};

const MLTraining = ({ data, onTrainingComplete }: Props) => {
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [config] = useState<TrainingConfig>(DEFAULT_CONFIG);

  const handleTrain = useCallback(() => {
    if (data.length < 10) return;
    setIsTraining(true);
    setTimeout(() => {
      const res = trainModel(data, config);
      setResult(res);
      onTrainingComplete?.(res);
      setIsTraining(false);
    }, 100);
  }, [data, config, onTrainingComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="surface-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold heading-tight flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            ML Model Training Pipeline
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Random Forest classifier • {data.length} samples • {Math.round(data.length * (1 - config.testSplit))} train / {Math.round(data.length * config.testSplit)} test
          </p>
        </div>
        <button
          onClick={handleTrain}
          disabled={isTraining || data.length < 10}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
        >
          {isTraining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {isTraining ? 'Training...' : 'Train Model'}
        </button>
      </div>

      {/* Config Summary */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[
          { label: 'Trees', value: '15' },
          { label: 'Max Depth', value: String(config.maxDepth) },
          { label: 'Min Samples', value: String(config.minSamples) },
          { label: 'Test Split', value: `${config.testSplit * 100}%` },
          { label: 'Classes', value: '3' },
        ].map(m => (
          <div key={m.label} className="bg-secondary/30 rounded-lg p-2 text-center">
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
            <div className="text-xs font-mono font-semibold text-foreground">{m.value}</div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Results Metrics */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: 'Accuracy', value: `${result.accuracy}%`, color: result.accuracy > 70 ? 'text-drift-positive' : 'text-drift-negative' },
                { label: 'F1 Score', value: String(result.f1Score), color: 'text-primary' },
                { label: 'MAE', value: String(result.mae), color: 'text-drift-warning' },
                { label: 'MSE', value: String(result.mse), color: 'text-muted-foreground' },
                { label: 'R² Score', value: String(result.r2Score), color: 'text-primary' },
                { label: 'Time', value: `${result.trainingTimeMs}ms`, color: 'text-muted-foreground' },
              ].map(m => (
                <div key={m.label} className="bg-secondary/30 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  <div className={`text-xs font-mono font-semibold ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Training Loss Curve */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" /> TRAINING / VALIDATION LOSS
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={result.epochLogs} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="epoch" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} interval={9} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="valLoss" name="Val Loss" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Feature Importances from actual training */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono">LEARNED FEATURE IMPORTANCES</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={result.featureImportances} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="feature" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} width={75} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="importance" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Confusion Matrix */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono">CONFUSION MATRIX (TRAINED)</p>
              <div className="flex items-center justify-center">
                <div>
                  <div className="flex gap-1 mb-1 ml-10">
                    {['Low', 'Mid', 'High'].map(l => (
                      <div key={l} className="w-12 text-center text-[10px] text-muted-foreground">{l}</div>
                    ))}
                  </div>
                  {result.confusionMatrix.map((row, i) => {
                    const maxVal = Math.max(...result.confusionMatrix.flat());
                    return (
                      <div key={i} className="flex items-center gap-1 mb-1">
                        <span className="w-8 text-right text-[10px] text-muted-foreground mr-1">{['Low', 'Mid', 'High'][i]}</span>
                        {row.map((val, j) => {
                          const intensity = val / (maxVal || 1);
                          const isDiag = i === j;
                          return (
                            <div
                              key={j}
                              className="w-12 h-10 rounded-md flex items-center justify-center font-mono text-xs"
                              style={{
                                backgroundColor: isDiag
                                  ? `hsl(217 91% 60% / ${0.15 + intensity * 0.6})`
                                  : `hsl(0 84% 60% / ${intensity * 0.3})`,
                              }}
                            >
                              <span className={isDiag ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                                {val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !isTraining && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Click "Train Model" to run the Random Forest pipeline on {data.length} data points
        </div>
      )}
    </motion.div>
  );
};

export default MLTraining;
