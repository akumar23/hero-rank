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

/**
 * Toast notification showing rating changes after a vote.
 * Displays winner/loser with their rating changes in a clean, animated format.
 */
export const RatingChangeToast: React.FC<RatingChangeToastProps> = ({
  data,
  onClose,
  duration = 4000,
}) => {
  // Auto-close the toast after duration
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
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden min-w-[320px] max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Rating Update</h3>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors text-lg leading-none"
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Winner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-2 h-2 rounded-full bg-green-400"
                  />
                  <span className="text-white font-medium truncate max-w-[140px]">
                    {data.winnerName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-green-400 font-bold text-lg"
                  >
                    +{data.winnerChange}
                  </motion.span>
                  <span className="text-gray-400 text-sm">
                    → {data.winnerNewRating}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700" />

              {/* Loser */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-2 h-2 rounded-full bg-red-400"
                  />
                  <span className="text-white font-medium truncate max-w-[140px]">
                    {data.loserName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-red-400 font-bold text-lg"
                  >
                    {data.loserChange}
                  </motion.span>
                  <span className="text-gray-400 text-sm">
                    → {data.loserNewRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-1 bg-blue-500 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
