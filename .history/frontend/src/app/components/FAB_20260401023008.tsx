import { motion } from "motion/react";
import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <motion.button
      className="fab"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Create new game"
    >
      <Plus className="w-7 h-7" />
      
      {/* Pulse ring animation */}
      <span className="absolute inset-0 rounded-full">
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-ping opacity-20" />
      </span>
    </motion.button>
  );
}