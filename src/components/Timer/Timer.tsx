import { useEffect } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatTimer, cn } from '../../lib/utils';

interface TimerProps {
  onComplete?: (elapsedSeconds: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Timer({ onComplete, className, size = 'md' }: TimerProps) {
  const { timer, startTimer, pauseTimer, stopTimer, resetTimer, tickTimer } =
    useStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (timer.isRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, tickTimer]);

  const handleStop = () => {
    const { elapsedSeconds } = stopTimer();
    onComplete?.(elapsedSeconds);
  };

  const timerSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Timer Display */}
      <div
        className={cn(
          'font-mono font-bold tabular-nums',
          timerSizes[size],
          timer.isRunning ? 'text-primary-600' : 'text-gray-700'
        )}
      >
        {formatTimer(timer.elapsedSeconds)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => (timer.isRunning ? pauseTimer() : startTimer())}
          className={cn(
            'rounded-full flex items-center justify-center transition-all',
            buttonSizes[size],
            timer.isRunning
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          )}
          title={timer.isRunning ? 'Pausar' : 'Iniciar'}
        >
          {timer.isRunning ? (
            <Pause className={iconSizes[size]} />
          ) : (
            <Play className={cn(iconSizes[size], 'ml-0.5')} />
          )}
        </button>

        {/* Stop Button */}
        {timer.elapsedSeconds > 0 && (
          <button
            onClick={handleStop}
            className={cn(
              'rounded-full flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition-all',
              buttonSizes[size]
            )}
            title="Detener y guardar"
          >
            <Square className={iconSizes[size]} />
          </button>
        )}

        {/* Reset Button */}
        {timer.elapsedSeconds > 0 && !timer.isRunning && (
          <button
            onClick={resetTimer}
            className={cn(
              'rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all',
              buttonSizes[size]
            )}
            title="Reiniciar"
          >
            <RotateCcw className={iconSizes[size]} />
          </button>
        )}
      </div>

      {/* Status Text */}
      <p className="text-sm text-gray-500">
        {timer.isRunning
          ? 'Cronometro en marcha...'
          : timer.elapsedSeconds > 0
          ? 'En pausa'
          : 'Listo para iniciar'}
      </p>
    </div>
  );
}
