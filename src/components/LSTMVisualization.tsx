import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const LSTMVisualization = () => {
  // Simulated training loss curve
  const trainingData = useMemo(() => {
    const data = [];
    let trainLoss = 1.2;
    let valLoss = 1.35;
    for (let epoch = 1; epoch <= 50; epoch++) {
      trainLoss *= 0.94 + Math.random() * 0.02;
      valLoss *= 0.945 + Math.random() * 0.025;
      if (epoch > 35) valLoss += Math.random() * 0.01; // slight overfit
      data.push({
        epoch,
        'Train Loss': Math.round(trainLoss * 1000) / 1000,
        'Val Loss': Math.round(valLoss * 1000) / 1000,
      });
    }
    return data;
  }, []);

  const layers = [
    { name: 'Input', neurons: 8, desc: 'Behavioral features' },
    { name: 'LSTM₁', neurons: 64, desc: '7-day window' },
    { name: 'LSTM₂', neurons: 32, desc: 'Temporal encoding' },
    { name: 'Dense', neurons: 16, desc: 'ReLU activation' },
    { name: 'Output', neurons: 1, desc: 'Mood prediction' },
  ];

  const metrics = [
    { label: 'Parameters', value: '18,241' },
    { label: 'Window', value: '7 days' },
    { label: 'Best Epoch', value: '38' },
    { label: 'Train Loss', value: '0.142' },
    { label: 'Val Loss', value: '0.186' },
    { label: 'Dropout', value: '0.2' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="surface-card p-6"
    >
      <h3 className="text-sm font-semibold heading-tight mb-1">LSTM Architecture & Training</h3>
      <p className="text-xs text-muted-foreground mb-5">Sequence-to-value emotion drift predictor</p>

      {/* Architecture Diagram */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
        {layers.map((layer, i) => (
          <div key={layer.name} className="flex items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex flex-col items-center"
            >
              <div className={`
                w-14 h-14 rounded-lg flex items-center justify-center text-xs font-mono font-semibold border
                ${i === 0 ? 'border-muted-foreground/30 text-muted-foreground bg-secondary/30' : ''}
                ${i >= 1 && i <= 2 ? 'border-primary/40 text-primary bg-primary/10' : ''}
                ${i === 3 ? 'border-drift-warning/40 text-drift-warning bg-drift-warning/5' : ''}
                ${i === 4 ? 'border-drift-positive/40 text-drift-positive bg-drift-positive/5' : ''}
              `}>
                {layer.neurons}
              </div>
              <span className="text-[10px] font-mono text-foreground mt-1.5">{layer.name}</span>
              <span className="text-[9px] text-muted-foreground">{layer.desc}</span>
            </motion.div>
            {i < layers.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="w-8 h-px bg-secondary mx-1 flex-shrink-0"
              />
            )}
          </div>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.04 }}
            className="bg-secondary/30 rounded-lg p-2 text-center"
          >
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
            <div className="text-xs font-mono font-semibold text-foreground">{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Loss Curve */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-2 font-mono">TRAINING LOSS CURVE</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trainingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="epoch" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval={9} />
            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(216, 20%, 10%)', border: '1px solid hsl(216, 20%, 18%)', borderRadius: '8px', fontSize: '11px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line type="monotone" dataKey="Train Loss" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Val Loss" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default LSTMVisualization;
