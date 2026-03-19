import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MoodEntry {
  id: string;
  content: string;
  detected_mood: string | null;
  mood_score: number | null;
  created_at: string;
  role: string;
}

const MOOD_COLOR_MAP: Record<string, string> = {
  happy: 'hsl(160, 84%, 39%)',
  excited: 'hsl(45, 93%, 47%)',
  hopeful: 'hsl(160, 84%, 39%)',
  calm: 'hsl(217, 91%, 60%)',
  neutral: 'hsl(215, 20%, 65%)',
  sad: 'hsl(0, 84%, 60%)',
  stressed: 'hsl(45, 93%, 47%)',
  anxious: 'hsl(45, 93%, 47%)',
  frustrated: 'hsl(0, 84%, 60%)',
  angry: 'hsl(0, 84%, 60%)',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="surface-card-lg p-3 text-xs space-y-1">
      <p className="text-muted-foreground font-mono">{d.time}</p>
      <p className="font-semibold capitalize">{d.mood || 'unknown'}</p>
      <p className="tabular-nums">Score: {d.score?.toFixed(2)}</p>
      <p className="text-muted-foreground truncate max-w-[200px]">{d.snippet}</p>
    </div>
  );
};

const MoodHistory = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMoods = async () => {
    const { data } = await supabase
      .from('mood_messages')
      .select('*')
      .eq('role', 'assistant')
      .not('detected_mood', 'is', null)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMoods();
    const channel = supabase
      .channel('mood-history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_messages' }, () => {
        fetchMoods();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const chartData = entries.map(e => ({
    time: new Date(e.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: e.mood_score ?? 0,
    mood: e.detected_mood ?? 'neutral',
    snippet: e.content.slice(0, 80),
    color: MOOD_COLOR_MAP[e.detected_mood ?? 'neutral'] || 'hsl(215, 20%, 65%)',
  }));

  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    const m = e.detected_mood ?? 'neutral';
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });
  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const avgScore = entries.length
    ? entries.reduce((s, e) => s + (e.mood_score ?? 0), 0) / entries.length
    : 0;

  const recentAvg = entries.length > 3
    ? entries.slice(-3).reduce((s, e) => s + (e.mood_score ?? 0), 0) / 3
    : avgScore;

  const trend = recentAvg > avgScore + 0.1 ? 'up' : recentAvg < avgScore - 0.1 ? 'down' : 'stable';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="surface-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold heading-tight">Mood History Timeline</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Detected moods from chat analysis • {entries.length} readings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {trend === 'up' && <span className="flex items-center gap-1 text-xs text-drift-positive"><TrendingUp className="w-3.5 h-3.5" /> Improving</span>}
          {trend === 'down' && <span className="flex items-center gap-1 text-xs text-drift-negative"><TrendingDown className="w-3.5 h-3.5" /> Declining</span>}
          {trend === 'stable' && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Minus className="w-3.5 h-3.5" /> Stable</span>}
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            avg: {avgScore.toFixed(2)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Loading mood data…</div>
      ) : chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
          No mood data yet. Start chatting to build your mood history.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#moodHistGrad)" dot={{ r: 3, fill: 'hsl(217, 91%, 60%)' }} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Mood distribution */}
          <div className="mt-4 flex flex-wrap gap-2">
            {topMoods.map(([mood, count]) => (
              <span
                key={mood}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize"
                style={{
                  backgroundColor: `${MOOD_COLOR_MAP[mood] || 'hsl(215, 20%, 65%)'}20`,
                  color: MOOD_COLOR_MAP[mood] || 'hsl(215, 20%, 65%)',
                }}
              >
                {mood} × {count}
              </span>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default MoodHistory;
