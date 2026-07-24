"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function FlipControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex items-center gap-6 mt-4">
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onPrev}
        disabled={currentPage === 0}
        className="btn btn-circle btn-ghost text-white/70 disabled:opacity-20 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-6 h-6" />
      </motion.button>

      <span className="text-white/60 text-sm font-mono tabular-nums">
        {currentPage + 1} / {totalPages}
      </span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onNext}
        disabled={currentPage >= totalPages - 1}
        className="btn btn-circle btn-ghost text-white/70 disabled:opacity-20 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]/70"
        aria-label="Next page"
      >
        <ChevronRight className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
