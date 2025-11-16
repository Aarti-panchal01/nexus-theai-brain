import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';

export default function MessageBubble({ message, index }) {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex gap-4 mb-6 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isAssistant 
          ? 'bg-gradient-to-br from-purple-600 to-cyan-600' 
          : 'bg-gradient-to-br from-blue-600 to-purple-600'
      }`}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>

      <div className={`flex-1 ${isAssistant ? 'mr-12' : 'ml-12'}`}>
        <motion.div
          className={`relative p-4 rounded-2xl ${
            isAssistant
              ? 'cyber-border holographic bg-gray-900/50 backdrop-blur-sm'
              : 'bg-gradient-to-br from-blue-600 to-purple-600'
          }`}
          initial={isAssistant ? { scale: 0.95 } : {}}
          animate={isAssistant ? { 
            scale: 1,
            boxShadow: [
              '0 0 20px rgba(139, 92, 246, 0.2)',
              '0 0 30px rgba(6, 182, 212, 0.3)',
              '0 0 20px rgba(139, 92, 246, 0.2)',
            ]
          } : {}}
          transition={isAssistant ? { 
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          } : {}}
        >
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isAssistant ? 'text-gray-100' : 'text-white'
          }`}>
            {message.content}
          </p>
          
          {message.timestamp && (
            <p className={`text-xs mt-2 ${
              isAssistant ? 'text-cyan-400' : 'text-purple-200'
            }`}>
              {format(new Date(message.timestamp), 'HH:mm')}
            </p>
          )}
        </motion.div>

        {isAssistant && message.context_used && message.context_used.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 flex gap-2 flex-wrap"
          >
            {message.context_used.map((docId, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30">
                📄 Context used
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}