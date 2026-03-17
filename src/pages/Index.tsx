import { useMemo } from 'react';
import { motion } from 'framer-motion';
import MetricCard from '@/components/MetricCard';
import DriftChart from '@/components/DriftChart';
import FeatureImportanceChart from '@/components/FeatureImportanceChart';
import PredictionTable from '@/components/PredictionTable';
import ConfusionMatrix from '@/components/ConfusionMatrix';
import SystemLog from '@/components/SystemLog';
import StressChart from '@/components/StressChart';
import {
  generateDataset,
  getFeatureImportances,
  getPipelineStatus,
  getModelMetrics,
  getConfusionMatrix,
} from '@/lib/dataEngine';

const Index = () => {
  const data = useMemo(() => generateDataset(90), []);
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">v2.1.0</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status.systemStatus === 'Stable' ? 'bg-drift-positive' : 'bg-drift-negative animate-pulse-glow'}`} />
              {status.systemStatus}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* Pipeline Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-muted-foreground"
        >
          Passive Digital Behavior Analysis • Automated Pipeline • {data.length} observations across {status.filesScanned} data sources
        </motion.p>

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
