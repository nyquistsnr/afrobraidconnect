"use client";

import { motion } from "framer-motion";

export function Loader({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className || "size-4"}`}
    >
      <motion.span
        className="absolute inset-0 box-border block rounded-full border-[2px] border-transparent border-t-current border-l-current opacity-80"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear",
        }}
      />
      <motion.span
        className="absolute inset-[25%] box-border block rounded-full border-[2px] border-transparent border-b-current border-r-current opacity-60"
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
    </div>
  );
}
