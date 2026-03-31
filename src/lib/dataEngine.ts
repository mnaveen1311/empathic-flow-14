// Emotion Drift Data Engine
// Generates behavioral + emotional time-series data (NO fake predictions)

export interface DataPoint {
  timestamp: string;
  date: string;
  userId: string;
  mood: number;
  stress: number;
  screenTime: number;
  activityLevel: number;
  sleepDuration: number;
  socialInteraction: number;
  behavioralConsistency: number;
  usageIntensity: number;
  driftCoefficient: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ModelMetrics {
  accuracy: number;
  f1Score: number;
  mae: number;
  trained: boolean;
}

export interface PipelineStatus {
  filesScanned: number;
  dataPoints: number;
  featuresExtracted: number;
  driftCoefficient: number;
  driftDelta: number;
  systemStatus: 'Stable' | 'Drifting' | 'Alert';
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSmoothSeries(length: number, base: number, variance: number, seed: number): number[] {
  const series: number[] = [];
  let current = base;
  for (let i = 0; i < length; i++) {
    const noise = (seededRandom(seed + i * 7.3) - 0.5) * variance;
    const trend = Math.sin(i / 14) * variance * 0.3;
    current = current * 0.85 + (base + noise + trend) * 0.15;
    series.push(Math.round(current * 100) / 100);
  }
  return series;
}

export function generateDataset(days = 90): DataPoint[] {
  const data: DataPoint[] = [];
  const startDate = new Date('2025-12-01');
  
  const moods = generateSmoothSeries(days, 6.5, 4, 42);
  const stress = generateSmoothSeries(days, 4.5, 3.5, 73);
  const screenTime = generateSmoothSeries(days, 5.2, 3, 19);
  const activity = generateSmoothSeries(days, 6, 4, 55);
  const sleep = generateSmoothSeries(days, 7, 2.5, 31);
  const social = generateSmoothSeries(days, 4, 3, 88);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const mood = Math.max(1, Math.min(10, moods[i]));
    
    const consistency = i >= 7 
      ? moods.slice(Math.max(0, i - 7), i).reduce((a, b) => a + Math.abs(b - moods[Math.max(0, i - 1)]), 0) / 7
      : 0;

    // Drift coefficient: based on behavioral variance over past 7 days (no fake predictions)
    const recentMoods = moods.slice(Math.max(0, i - 7), i + 1);
    const moodVariance = recentMoods.length > 1
      ? recentMoods.reduce((s, m) => s + Math.abs(m - recentMoods[0]), 0) / recentMoods.length / 10
      : 0;

    data.push({
      timestamp: date.toISOString(),
      date: date.toISOString().split('T')[0],
      userId: 'USR-001',
      mood: Math.round(mood * 10) / 10,
      stress: Math.round(Math.max(1, Math.min(10, stress[i])) * 10) / 10,
      screenTime: Math.round(Math.max(0.5, screenTime[i]) * 10) / 10,
      activityLevel: Math.round(Math.max(0, Math.min(10, activity[i])) * 10) / 10,
      sleepDuration: Math.round(Math.max(3, Math.min(12, sleep[i])) * 10) / 10,
      socialInteraction: Math.round(Math.max(0, Math.min(10, social[i])) * 10) / 10,
      behavioralConsistency: Math.round(consistency * 100) / 100,
      usageIntensity: Math.round((screenTime[i] / (screenTime[Math.max(0, i - 1)] || 1)) * 100) / 100,
      driftCoefficient: Math.round(moodVariance * 1000) / 1000,
    });
  }
  return data;
}

export function getFeatureImportances(data: DataPoint[]): FeatureImportance[] {
  if (data.length < 5) {
    return [
      { feature: 'Sleep Duration', importance: 0 },
      { feature: 'Behavioral Consistency', importance: 0 },
      { feature: 'Screen Time', importance: 0 },
      { feature: 'Social Interaction', importance: 0 },
      { feature: 'Activity Level', importance: 0 },
      { feature: 'Usage Intensity', importance: 0 },
    ];
  }

  const features: { name: string; values: number[] }[] = [
    { name: 'Sleep Duration', values: data.map(d => d.sleepDuration) },
    { name: 'Behavioral Consistency', values: data.map(d => d.behavioralConsistency) },
    { name: 'Screen Time', values: data.map(d => d.screenTime) },
    { name: 'Social Interaction', values: data.map(d => d.socialInteraction) },
    { name: 'Activity Level', values: data.map(d => d.activityLevel) },
    { name: 'Usage Intensity', values: data.map(d => d.usageIntensity) },
  ];

  const moods = data.map(d => d.mood);
  const moodMean = moods.reduce((s, v) => s + v, 0) / moods.length;

  const importances = features.map(f => {
    const fMean = f.values.reduce((s, v) => s + v, 0) / f.values.length;
    let cov = 0, fVar = 0, mVar = 0;
    for (let i = 0; i < data.length; i++) {
      const fd = f.values[i] - fMean;
      const md = moods[i] - moodMean;
      cov += fd * md;
      fVar += fd * fd;
      mVar += md * md;
    }
    const corr = Math.abs(cov / (Math.sqrt(fVar * mVar) || 1));
    return { feature: f.name, importance: corr };
  });

  const total = importances.reduce((s, v) => s + v.importance, 0);
  if (total > 0) importances.forEach(v => v.importance = Math.round((v.importance / total) * 100) / 100);

  return importances.sort((a, b) => b.importance - a.importance);
}

export function getPipelineStatus(data: DataPoint[]): PipelineStatus {
  const avgDrift = data.slice(-7).reduce((s, d) => s + d.driftCoefficient, 0) / Math.min(7, data.length || 1);
  const prevDrift = data.slice(-14, -7).reduce((s, d) => s + d.driftCoefficient, 0) / Math.min(7, data.slice(-14, -7).length || 1);

  return {
    filesScanned: 4,
    dataPoints: data.length,
    featuresExtracted: 8,
    driftCoefficient: Math.round(avgDrift * 100) / 100,
    driftDelta: Math.round((avgDrift - prevDrift) * 100) / 100,
    systemStatus: avgDrift > 0.15 ? 'Drifting' : 'Stable',
  };
}

// These now require trained model results — no fake metrics
export function getModelMetrics(trainedResult?: { accuracy: number; f1Score: number; mae: number } | null): ModelMetrics {
  if (!trainedResult) {
    return { accuracy: 0, f1Score: 0, mae: 0, trained: false };
  }
  return {
    accuracy: trainedResult.accuracy,
    f1Score: trainedResult.f1Score,
    mae: trainedResult.mae,
    trained: true,
  };
}

export function getConfusionMatrix(trainedMatrix?: number[][] | null): number[][] {
  if (!trainedMatrix) return Array.from({ length: 3 }, () => [0, 0, 0]);
  return trainedMatrix;
}
