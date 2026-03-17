import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  presets?: { label: string; days: number }[];
}

const DEFAULT_PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '60D', days: 60 },
  { label: 'ALL', days: 0 },
];

const DateRangeFilter = ({ startDate, endDate, onRangeChange, presets = DEFAULT_PRESETS }: DateRangeFilterProps) => {
  const [activePreset, setActivePreset] = useState<string>('ALL');

  const handlePreset = (label: string, days: number) => {
    setActivePreset(label);
    if (days === 0) {
      onRangeChange(new Date('2025-12-01'), new Date('2026-03-01'));
    } else {
      const end = new Date('2026-03-01');
      const start = new Date(end);
      start.setDate(start.getDate() - days);
      onRangeChange(start, end);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="flex items-center gap-3 flex-wrap"
    >
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.label, p.days)}
            className={cn(
              'px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200',
              activePreset === p.label
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs font-mono gap-1.5 bg-secondary/30 border-secondary">
              <CalendarIcon className="w-3 h-3" />
              {format(startDate, 'MMM dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) => d && onRangeChange(d, endDate)}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground">→</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs font-mono gap-1.5 bg-secondary/30 border-secondary">
              <CalendarIcon className="w-3 h-3" />
              {format(endDate, 'MMM dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(d) => d && onRangeChange(startDate, d)}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </motion.div>
  );
};

export default DateRangeFilter;
