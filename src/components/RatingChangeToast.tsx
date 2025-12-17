import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export interface RatingChangeData {
  winnerName: string;
  loserName: string;
  winnerChange: number;
  loserChange: number;
  winnerNewRating: number;
  loserNewRating: number;
}

interface RatingChangeToastProps {
  data: RatingChangeData | null;
  onClose: () => void;
  duration?: number;
}

export const RatingChangeToast: React.FC<RatingChangeToastProps> = ({
  data,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [data, duration, onClose]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-3 right-3 z-50 pointer-events-auto"
        >
          <div className="border-2 border-ink bg-paper shadow-brutal min-w-[280px]">
            {/* Header */}
            <div className="bg-ink text-paper px-3 py-1 flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase">
                RATING UPDATE
              </span>
              <button
                onClick={onClose}
                className="text-paper/80 hover:text-paper text-lg leading-none font-bold"
                aria-label="Close"
              >
                X
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {/* Winner */}
              <div className="flex items-center justify-between font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500" />
                  <span className="font-bold truncate max-w-[120px]">
                    {data.winnerName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">
                    +{data.winnerChange}
                  </span>
                  <span className="text-smoke text-xs">
                    {data.winnerNewRating}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-ink" />

              {/* Loser */}
              <div className="flex items-center justify-between font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-signal" />
                  <span className="font-bold truncate max-w-[120px]">
                    {data.loserName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-signal font-bold">
                    {data.loserChange}
                  </span>
                  <span className="text-smoke text-xs">
                    {data.loserNewRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-1 bg-navy origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
