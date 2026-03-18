import { useState, useCallback, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { fetchDailySummary, fetchTTSAudio } from '../lib/aiClient';
import { useStore } from '../store/useStore';
import { getTodayString } from '../lib/utils';

const CACHE_PREFIX = 'kaizen-ai-summary-';

function getCachedSummary(date: string): string | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + date);
    return cached ? JSON.parse(cached).summary : null;
  } catch {
    return null;
  }
}

function setCachedSummary(date: string, summary: string) {
  localStorage.setItem(CACHE_PREFIX + date, JSON.stringify({ summary, ts: Date.now() }));
}

export function useDailySummary() {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { activities, settings, dailyGoals } = useStore();

  const buildPayload = useCallback(() => {
    const today = getTodayString();

    // Today's activities
    const todayActivities = activities.filter((a) => {
      const d = a.startTime instanceof Date ? a.startTime : (a.startTime?.toDate?.() || new Date(a.startTime as any));
      return format(d, 'yyyy-MM-dd') === today;
    });

    const totalIncome = todayActivities.reduce((s, a) => s + a.income, 0);
    const totalCosts = todayActivities.reduce((s, a) => s + a.costs, 0);
    const totalProfit = totalIncome - totalCosts;
    const productiveMinutes = todayActivities.filter(a => a.isProductive).reduce((s, a) => s + a.durationMinutes, 0);
    const wastedMinutes = todayActivities.filter(a => !a.isProductive).reduce((s, a) => s + a.durationMinutes, 0);
    const goalAchievementPct = settings.dailyProfitTarget > 0
      ? Math.round((totalProfit / settings.dailyProfitTarget) * 100)
      : 0;

    // Top 3 activities by profit
    const topActivities = [...todayActivities]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3)
      .map(a => ({ name: a.name, profit: a.profit, minutes: a.durationMinutes }));

    // Streak: consecutive days with activities
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const hasActivities = activities.some(a => {
        const ad = a.startTime instanceof Date ? a.startTime : (a.startTime?.toDate?.() || new Date(a.startTime as any));
        return format(ad, 'yyyy-MM-dd') === d;
      });
      if (hasActivities) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Weekly profit
    const weeklyProfit = (() => {
      let total = 0;
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        total += activities
          .filter(a => {
            const ad = a.startTime instanceof Date ? a.startTime : (a.startTime?.toDate?.() || new Date(a.startTime as any));
            return format(ad, 'yyyy-MM-dd') === d;
          })
          .reduce((s, a) => s + a.profit, 0);
      }
      return total;
    })();

    return {
      date: today,
      totalIncome,
      totalCosts,
      totalProfit,
      dailyProfitTarget: settings.dailyProfitTarget,
      goalAchievementPct,
      productiveMinutes,
      wastedMinutes,
      activitiesCount: todayActivities.length,
      topActivities,
      streak,
      weeklyProfit,
      weeklyTarget: settings.dailyProfitTarget * 7,
    };
  }, [activities, settings, dailyGoals]);

  const generateSummary = useCallback(async (forceRegenerate = false) => {
    const today = getTodayString();

    if (!forceRegenerate) {
      const cached = getCachedSummary(today);
      if (cached) {
        setSummary(cached);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = buildPayload();
      const result = await fetchDailySummary(payload);
      setSummary(result);
      setCachedSummary(today, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando resumen');
    } finally {
      setIsLoading(false);
    }
  }, [buildPayload]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthUtteranceRef.current) {
      speechSynthesis.cancel();
      synthUtteranceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (text: string) => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsPlaying(true);

    try {
      // Try TTS API first
      const audioBuffer = await fetchTTSAudio(text);
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback to SpeechSynthesis
        fallbackSpeech(text);
      };

      await audio.play();
    } catch {
      // Fallback to browser SpeechSynthesis
      fallbackSpeech(text);
    }
  }, [isPlaying, stopAudio]);

  const fallbackSpeech = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 1;
    utterance.onend = () => {
      setIsPlaying(false);
      synthUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      synthUtteranceRef.current = null;
    };

    synthUtteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, []);

  return {
    summary,
    isLoading,
    error,
    isPlaying,
    generateSummary,
    playAudio,
    stopAudio,
  };
}
