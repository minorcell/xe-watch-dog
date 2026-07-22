"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePageLoading } from "./page-transition-context";

export function PageLoadingBar() {
  const isPending = usePageLoading();

  return (
    <AnimatePresence>
      {isPending && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 right-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              boxShadow:
                "0 0 8px 1px var(--primary), 0 0 16px 2px var(--primary)",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
