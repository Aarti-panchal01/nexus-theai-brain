import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Brain, Sparkles, Target, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const modeIcons = {
  focus: Target,
  mentor: Brain,
  creative: Sparkles,
  general: MessageSquare
};

const modeColors = {
  focus: 'from-orange-500 to-red-500',
  mentor: 'from-purple-500 to-blue-500',
  creative: 'from-pink-500 to-purple-500',
  general: 'from-cyan-500 to-blue-500'
};

export default function SessionSidebar({ 
  sessions, 
  currentSession, 
  onSelectSession, 
  onNewSession,
  documents,
  onShowDocuments,
  isOpen,
  onClose
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 bg-gray-950/95 backdrop-blur-xl border-r border-purple-500/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold glow-text flex items-center gap-2">
                  <Brain className="w-6 h-6 text-cyan-400" />
                  NEXUS
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <Button
                onClick={onNewSession}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </div>

            {/* Documents Section */}
            <div className="px-6 py-4 border-b border-purple-500/20">
              <Button
                onClick={onShowDocuments}
                variant="outline"
                className="w-full justify-start border-purple-500/30 hover:bg-purple-900/20 text-purple-300 hover:text-purple-200"
              >
                <FileText className="w-4 h-4 mr-2" />
                Knowledge Base
                <span className="ml-auto text-xs bg-purple-900/50 px-2 py-1 rounded-full">
                  {documents?.length || 0}
                </span>
              </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-2">
                {sessions.map((session) => {
                  const Icon = modeIcons[session.mode] || MessageSquare;
                  const isActive = currentSession?.id === session.id;
                  
                  return (
                    <motion.button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session);
                        onClose();
                      }}
                      whileHover={{ x: 4 }}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        isActive
                          ? 'cyber-border holographic bg-gray-900/50'
                          : 'bg-gray-900/30 hover:bg-gray-900/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${modeColors[session.mode]} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-white truncate">
                            {session.title}
                          </h3>
                          {session.summary && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                              {session.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-cyan-400">
                              {session.message_count || 0} messages
                            </span>
                            {session.last_message_at && (
                              <span className="text-xs text-gray-500">
                                • {format(new Date(session.last_message_at), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}