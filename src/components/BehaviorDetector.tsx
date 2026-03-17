import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BehaviorEvent {
  id: number;
  timestamp: string;
  type: 'keystroke' | 'mouse_move' | 'click' | 'scroll' | 'pause' | 'burst';
  label: string;
  intensity: number;
}

const BehaviorDetector = () => {
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const [stats, setStats] = useState({ keystrokes: 0, clicks: 0, scrolls: 0, avgIntensity: 0 });
  const idRef = useRef(0);
  const lastKeystrokeRef = useRef(0);
  const keystrokeBurstRef = useRef(0);

  const addEvent = useCallback((type: BehaviorEvent['type'], label: string, intensity: number) => {
    if (!isTracking) return;
    const evt: BehaviorEvent = {
      id: ++idRef.current,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      label,
      intensity: Math.min(1, Math.max(0, intensity)),
    };
    setEvents(prev => [evt, ...prev].slice(0, 20));
  }, [isTracking]);

  useEffect(() => {
    if (!isTracking) return;

    const handleKeydown = () => {
      const now = Date.now();
      const gap = now - lastKeystrokeRef.current;
      lastKeystrokeRef.current = now;
      keystrokeBurstRef.current++;

      if (gap < 100) {
        if (keystrokeBurstRef.current > 8) {
          addEvent('burst', 'Rapid typing burst detected', 0.9);
          keystrokeBurstRef.current = 0;
        }
      } else {
        keystrokeBurstRef.current = 1;
        if (gap > 3000) {
          addEvent('pause', `Pause detected (${(gap / 1000).toFixed(1)}s)`, 0.3);
        }
        addEvent('keystroke', 'Keystroke captured', Math.min(1, 200 / Math.max(gap, 50)));
      }

      setStats(s => ({ ...s, keystrokes: s.keystrokes + 1 }));
    };

    const handleClick = () => {
      addEvent('click', 'Click interaction', 0.6);
      setStats(s => ({ ...s, clicks: s.clicks + 1 }));
    };

    const handleScroll = (() => {
      let timeout: ReturnType<typeof setTimeout>;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          addEvent('scroll', 'Scroll activity', 0.4);
          setStats(s => ({ ...s, scrolls: s.scrolls + 1 }));
        }, 200);
      };
    })();

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isTracking, addEvent]);

  // Update avg intensity
  useEffect(() => {
    if (events.length === 0) return;
    const avg = events.reduce((s, e) => s + e.intensity, 0) / events.length;
    setStats(s => ({ ...s, avgIntensity: Math.round(avg * 100) }));
  }, [events]);

  const getTypeColor = (type: BehaviorEvent['type']) => {
    switch (type) {
      case 'keystroke': return 'text-primary';
      case 'click': return 'text-drift-positive';
      case 'scroll': return 'text-drift-warning';
      case 'pause': return 'text-muted-foreground';
      case 'burst': return 'text-drift-negative';
      default: return 'text-foreground';
    }
  };

  const getIntensityBar = (intensity: number) => {
    const w = Math.round(intensity * 100);
    const color = intensity > 0.7 ? 'bg-drift-negative' : intensity > 0.4 ? 'bg-drift-warning' : 'bg-drift-positive';
    return (
      <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${w}%` }} />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="surface-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold heading-tight">Live Behavior Stream</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time passive interaction tracking</p>
        </div>
        <button
          onClick={() => setIsTracking(t => !t)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isTracking
              ? 'bg-drift-positive/10 text-drift-positive'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-drift-positive animate-pulse' : 'bg-muted-foreground'}`} />
          {isTracking ? 'LIVE' : 'PAUSED'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Keystrokes', value: stats.keystrokes },
          { label: 'Clicks', value: stats.clicks },
          { label: 'Scrolls', value: stats.scrolls },
          { label: 'Intensity', value: `${stats.avgIntensity}%` },
        ].map((s) => (
          <div key={s.label} className="bg-secondary/30 rounded-lg p-2 text-center">
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
            <div className="text-sm font-mono font-semibold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Event Stream */}
      <div className="h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8 font-mono">
              {isTracking ? '// Waiting for interactions...' : '// Tracking paused'}
            </div>
          ) : (
            events.map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 text-xs py-1 px-2 rounded hover:bg-secondary/20"
              >
                <span className="font-mono text-muted-foreground text-[10px] w-16 flex-shrink-0">{evt.timestamp}</span>
                <span className={`font-mono text-[10px] w-16 flex-shrink-0 uppercase ${getTypeColor(evt.type)}`}>{evt.type}</span>
                <span className="text-foreground/80 flex-1 truncate">{evt.label}</span>
                {getIntensityBar(evt.intensity)}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BehaviorDetector;
