import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import MetricCard from '@/components/MetricCard';
import DriftChart from '@/components/DriftChart';
import FeatureImportanceChart from '@/components/FeatureImportanceChart';
import PredictionTable from '@/components/PredictionTable';
import ConfusionMatrix from '@/components/ConfusionMatrix';
import SystemLog from '@/components/SystemLog';
import StressChart from '@/components/StressChart';
import DateRangeFilter from '@/components/DateRangeFilter';
import LSTMVisualization from '@/components/LSTMVisualization';
import BehaviorDetector from '@/components/BehaviorDetector';
import type { BehaviorStatsData } from '@/components/BehaviorDetector';
import DataExport from '@/components/DataExport';
import DataUploader from '@/components/DataUploader';
import MoodChat from '@/components/MoodChat';
import MoodHistory from '@/components/MoodHistory';
import {
  generateDataset,
  getFeatureImportances,
  getPipelineStatus,
  getModelMetrics,
  getConfusionMatrix,
} from '@/lib/dataEngine';

const Index = () => {
  const allData = useMemo(() => generateDataset(90), []);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date('2025-12-01'),
    end: new Date('2026-03-01'),
  });
  const [behaviorStats, setBehaviorStats] = useState<BehaviorStatsData>({
    keystrokes: 0, clicks: 0, scrolls: 0, avgIntensity: 0, recentEvents: [],
  });

  const handleRangeChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  const handleBehaviorStats = useCallback((stats: BehaviorStatsData) => {
    setBehaviorStats(stats);
  }, []);

  const data = useMemo(() => {
    return allData.filter(d => {
      const t = new Date(d.timestamp);
      return t >= dateRange.start && t <= dateRange.end;
    });
  }, [allData, dateRange]);

  const status = useMemo(() => getPipelineStatus(data), [data]);
  const features = useMemo(() => getFeatureImportances(), []);
  const metrics = useMemo(() => getModelMetrics(), []);
  const matrix = useMemo(() => getConfusionMatrix(), []);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-secondary px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-primary glow-primary"
            />
            <h1 className="text-sm font-semibold heading-tight tracking-wide">
              AETHER
            </h1>
            <span className="text-xs text-muted-foreground font-mono">// Emotion Drift Engine</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <DataUploader onDataLoaded={setUploadedFiles} />
            <DataExport data={data} />
            <span className="font-mono tabular-nums">v2.2.0</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status.systemStatus === 'Stable' ? 'bg-drift-positive' : 'bg-drift-negative animate-pulse'}`} />
              {status.systemStatus}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* Pipeline Caption + Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-muted-foreground"
          >
            Passive Digital Behavior Analysis • {data.length} observations across {status.filesScanned} sources
          </motion.p>
          <DateRangeFilter
            startDate={dateRange.start}
            endDate={dateRange.end}
            onRangeChange={handleRangeChange}
          />
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Data Points" value={status.dataPoints} delay={0.1} />
          <MetricCard label="Features" value={status.featuresExtracted} delay={0.15} />
          <MetricCard
            label="Drift Coefficient"
            value={status.driftCoefficient}
            delta={`${status.driftDelta >= 0 ? '+' : ''}${status.driftDelta}`}
            deltaType={status.driftDelta < 0 ? 'positive' : 'negative'}
            delay={0.2}
          />
          <MetricCard
            label="Model Accuracy"
            value={`${metrics.accuracy}%`}
            delta={`F1: ${metrics.f1Score} · MAE: ${metrics.mae}`}
            deltaType="neutral"
            delay={0.25}
          />
        </div>

        {/* Main Visualization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DriftChart data={data} />
          </div>
          <FeatureImportanceChart features={features} />
        </div>

        {/* LSTM + Mood Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LSTMVisualization />
          <MoodChat behaviorStats={behaviorStats} />
        </div>

        {/* Behavior Stream */}
        <BehaviorDetector onStatsChange={handleBehaviorStats} />

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PredictionTable data={data} />
          </div>
          <div className="space-y-6">
            <ConfusionMatrix matrix={matrix} />
            <SystemLog />
          </div>
        </div>

        {/* Stress Row */}
        <StressChart data={data} />
      </main>
    </div>
  );
};

export default Index;
