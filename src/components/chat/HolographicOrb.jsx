import React from 'react';
import { motion } from 'framer-motion';

export default function HolographicOrb({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-50 blur-md"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-70"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute inset-2 rounded-full bg-gray-950 border border-cyan-500/30"
        animate={{
          boxShadow: [
            '0 0 20px rgba(6, 182, 212, 0.5)',
            '0 0 40px rgba(139, 92, 246, 0.5)',
            '0 0 20px rgba(6, 182, 212, 0.5)',
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}