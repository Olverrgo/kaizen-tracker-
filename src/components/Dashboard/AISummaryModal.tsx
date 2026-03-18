import { useEffect } from 'react';
import { X, Sparkles, Play, Square, RefreshCw, Loader2 } from 'lucide-react';
import { useDailySummary } from '../../hooks/useDailySummary';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISummaryModal({ isOpen, onClose }: AISummaryModalProps) {
  const {
    summary,
    isLoading,
    error,
    isPlaying,
    generateSummary,
    playAudio,
    stopAudio,
  } = useDailySummary();

  useEffect(() => {
    if (isOpen && !summary && !isLoading) {
      generateSummary();
    }
  }, [isOpen, summary, isLoading, generateSummary]);

  // Cleanup audio on close
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen, stopAudio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-green-500 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Resumen del Dia</h2>
              <p className="text-white/80 text-sm">Coach Kaizen IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              <p className="text-gray-500 text-sm">Analizando tu dia...</p>
              <div className="w-full max-w-xs space-y-2">
                <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse w-4/5" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse w-3/5" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button
                onClick={() => generateSummary(true)}
                className="text-sm text-red-600 underline hover:no-underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !error && summary && (
            <div className="space-y-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {summary}
              </p>

              {/* Audio controls */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() =>
                    isPlaying ? stopAudio() : playAudio(summary)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isPlaying
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="h-4 w-4" />
                      Detener
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Escuchar
                    </>
                  )}
                </button>

                <button
                  onClick={() => generateSummary(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
