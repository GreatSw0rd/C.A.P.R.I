import { motion } from "motion/react";
import { useLocation } from "react-router-dom";
import { useEffetsVisuels } from "@/hooks/useEffets";

// Transition douce entre les pages (fondu + leger glissement, sans flou pour rester fluide).
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const [niveau] = useEffetsVisuels();

  if (niveau === "aucun") {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      className="flex min-h-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
