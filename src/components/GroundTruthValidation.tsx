import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, Target, FlaskConical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import type { DataPoint } from '@/lib/dataEngine';
import { validateGroundTruth, type ValidationResult, type TrainingConfig } from '@/lib/mlEngine';

interface Props {
  data: DataPoint[];
}

const GroundTruthValidation = ({ data }: Props) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = useCallback(() => {
    if (data.length < 10) return;
    setIsValidating(true);
    setTimeout(() => {
      const config: TrainingConfig = { testSplit: 0.25, maxDepth: 6, minSamples: 3, epochs: 50, learningRate: 0.01 };
      const res = validateGroundTruth(data, config);
      setResult(res);
      setIsValidating(false);
    }, 150);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="surface-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold heading-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-drift-positive" />
            Ground Truth Validation
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prediction vs EMA survey responses • Ablation study
          </p>
        </div>
        <button
          onClick={handleValidate}
          disabled={isValidating || data.length < 10}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-drift-positive/10 text-drift-positive text-xs font-medium hover:bg-drift-positive/20 transition-colors disabled:opacity-40"
        >
          {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
          {isValidating ? 'Validating...' : 'Run Validation'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-5"
          >
            {/* Overall Metrics */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-[10px] text-muted-foreground">Overall Accuracy</div>
                <div className="text-lg font-mono font-bold text-drift-positive">{result.overallAccuracy}%</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-[10px] text-muted-foreground">Mood F1</div>
                <div className="text-lg font-mono font-bold text-primary">{result.moodF1}</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-[10px] text-muted-foreground">Stress F1</div>
                <div className="text-lg font-mono font-bold text-drift-warning">{result.stressF1}</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-[10px] text-muted-foreground">Mood Prec / Rec</div>
                <div className="text-sm font-mono font-semibold text-foreground">{result.moodPrecision} / {result.moodRecall}</div>
              </div>
            </div>

            {/* Residual Distribution */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono">RESIDUAL DISTRIBUTION</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={result.residualDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bin" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Accuracy Timeline */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono">DAILY ERROR TIMELINE (MOOD vs STRESS)</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={result.dailyAccuracy} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={8} tickLine={false} axisLine={false} interval={Math.floor(result.dailyAccuracy.length / 5)} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="moodError" name="Mood Error" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.15} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="stressError" name="Stress Error" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Ablation Study */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3" /> ABLATION STUDY — FEATURE SUBSET COMPARISON
              </p>
              <div className="space-y-1.5">
                {result.ablationResults.map((ab, i) => (
                  <motion.div
                    key={ab.config}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-2.5 rounded-lg ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/20'}`}
                  >
                    <span className="text-xs font-mono text-foreground">{ab.config}</span>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-muted-foreground">Acc: <span className={i === 0 ? 'text-primary font-semibold' : 'text-foreground'}>{ab.accuracy}%</span></span>
                      <span className="text-muted-foreground">F1: <span className="text-foreground">{ab.f1}</span></span>
                      <span className="text-muted-foreground">MAE: <span className="text-foreground">{ab.mae}</span></span>
                      {/* Bar indicator */}
                      <div className="w-20 h-2 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${ab.accuracy}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !isValidating && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Click "Run Validation" to compare model predictions against ground truth EMA data
        </div>
      )}
    </motion.div>
  );
};

export default GroundTruthValidation;
