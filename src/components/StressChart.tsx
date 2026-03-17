import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '@/lib/dataEngine';

interface Props {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card-lg p-3 text-xs">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono tabular-nums" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const StressChart = ({ data }: Props) => {
  const chartData = data.map(d => ({
    date: d.date.slice(5),
    Stress: d.stress,
    Sleep: d.sleepDuration,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="surface-card p-6"
    >
      <h3 className="text-sm font-semibold heading-tight mb-1">Stress vs. Sleep Pattern</h3>
      <p className="text-xs text-muted-foreground mb-4">Inverse correlation tracking</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} interval={13} />
          <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Stress" stroke="hsl(0, 84%, 60%)" strokeWidth={1.5} fill="url(#stressGrad)" dot={false} />
          <Area type="monotone" dataKey="Sleep" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} fill="transparent" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default StressChart;
