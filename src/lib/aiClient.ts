const AI_URL = import.meta.env.VITE_KAIZEN_AI_URL || '';
const AI_KEY = import.meta.env.VITE_KAIZEN_AI_KEY || '';

interface SummaryData {
  date: string;
  totalIncome: number;
  totalCosts: number;
  totalProfit: number;
  dailyProfitTarget: number;
  goalAchievementPct: number;
  productiveMinutes: number;
  wastedMinutes: number;
  activitiesCount: number;
  topActivities: { name: string; profit: number; minutes: number }[];
  streak: number;
  weeklyProfit: number;
  weeklyTarget: number;
}

export async function fetchDailySummary(data: SummaryData): Promise<string> {
  const res = await fetch(`${AI_URL}/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`AI summary failed: ${res.status}`);
  }

  const json = await res.json();
  return (json as { summary: string }).summary;
}

export async function fetchTTSAudio(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${AI_URL}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`TTS failed: ${res.status}`);
  }

  return res.arrayBuffer();
}
