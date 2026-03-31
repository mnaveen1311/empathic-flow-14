import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { DataPoint } from '@/lib/dataEngine';

interface DriftChartProps {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card-lg p-3 text-xs">
      <p className="text-muted-foreground mb-2 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono tabular-nums" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const DriftChart = ({ data }: DriftChartProps) => {
  const chartData = data.map(d => ({
    date: d.date.slice(5),
    Mood: d.mood,
    Stress: d.stress,
    Activity: d.activityLevel,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="surface-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold heading-tight">Temporal Drift: Behavior vs. Emotion</h3>
          <p className="text-xs text-muted-foreground mt-1">Ground truth mood against passive behavioral signals</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Mood</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-drift-positive" /> Activity</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-drift-warning" /> Stress</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} interval={13} />
          <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Mood" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#moodGrad)" dot={false} />
          <Line type="monotone" dataKey="Stress" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} opacity={0.7} />
          <Line type="monotone" dataKey="Activity" stroke="hsl(160, 84%, 39%)" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default DriftChart;
