"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  duration = 1,
  filter = true,
}: {
  words: string;
  className?: string;
  duration?: number;
  filter?: boolean;
}) => {
  const wordsArray = words.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: i * 0.04 },
    }),
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex text-xl leading-relaxed",
        filter && "text-neutral-600 dark:text-neutral-400",
        className
      )}
    >
      <div className="flex flex-wrap justify-center">
        {wordsArray.map((word, index) => (
          <motion.span
            key={word + index}
            variants={child}
            style={{ marginRight: "0.25rem" }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};