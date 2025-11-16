
import React from "react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      <style>{`
        :root {
          --cyber-purple: #8B5CF6;
          --cyber-cyan: #06B6D4;
          --cyber-azure: #3B82F6;
          --cyber-pink: #EC4899;
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        .glow-text {
          text-shadow: 0 0 10px var(--cyber-cyan), 0 0 20px var(--cyber-azure);
        }
        
        .cyber-border {
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
        }
        
        .holographic {
          background: linear-gradient(135deg, 
            rgba(139, 92, 246, 0.1) 0%,
            rgba(6, 182, 212, 0.1) 50%,
            rgba(59, 130, 246, 0.1) 100%
          );
        }

        .neon-glow {
          box-shadow: 0 0 5px var(--cyber-cyan),
                      0 0 10px var(--cyber-cyan),
                      0 0 20px var(--cyber-azure),
                      0 0 40px var(--cyber-azure);
        }
      `}</style>
      {children}
    </div>
  );
}
