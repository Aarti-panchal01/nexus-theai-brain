
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, Send, FileText, Brain, Sparkles, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import HolographicOrb from '../components/chat/HolographicOrb';
import MessageBubble from '../components/chat/MessageBubble';
import SessionSidebar from '../components/chat/SessionSidebar';
import DocumentUploader from '../components/documents/DocumentUploader';
import DocumentList from '../components/documents/DocumentList';
import SummarizationDialog from '../components/documents/SummarizationDialog';
import NotionExporter from '../components/integrations/NotionExporter';
import VoiceInput from '../components/chat/VoiceInput';

export default function NexusPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showNotionExport, setShowNotionExport] = useState(false);
  const [showSummarization, setShowSummarization] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.ChatSession.list('-last_message_at'),
  });

  // Fetch messages for current session
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', currentSession?.id],
    queryFn: () => currentSession 
      ? base44.entities.Message.filter({ session_id: currentSession.id }, 'created_date')
      : Promise.resolve([]),
    enabled: !!currentSession,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (mode = 'general') => {
      const session = await base44.entities.ChatSession.create({
        title: `New Session - ${new Date().toLocaleString()}`,
        mode,
        last_message_at: new Date().toISOString(),
        message_count: 0,
      });
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries(['sessions']);
      setCurrentSession(session);
    },
  });

  // Update session mode
  const updateModeMutation = useMutation({
    mutationFn: async ({ sessionId, mode }) => {
      await base44.entities.ChatSession.update(sessionId, { mode });
      return mode;
    },
    onSuccess: (mode) => {
      queryClient.invalidateQueries(['sessions']);
      if (currentSession) {
        setCurrentSession({ ...currentSession, mode });
      }
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, sessionId }) => {
      // Create user message
      const userMessage = await base44.entities.Message.create({
        session_id: sessionId,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      });

      // Get relevant document context
      let contextDocuments = [];
      if (documents.length > 0) {
        const keywords = content.toLowerCase().split(' ').filter(w => w.length > 3);
        contextDocuments = documents.filter(doc => 
          keywords.some(kw => doc.content?.toLowerCase().includes(kw))
        ).slice(0, 2);
      }

      // Build context prompt
      let contextPrompt = '';
      if (contextDocuments.length > 0) {
        contextPrompt = '\n\nRelevant context from your knowledge base:\n\n';
        contextDocuments.forEach(doc => {
          contextPrompt += `From "${doc.title}":\n${doc.content.slice(0, 1000)}...\n\n`;
        });
      }

      // Get conversation history
      const recentMessages = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'NEXUS'}: ${m.content}`
      ).join('\n');

      // Mode-specific system prompts
      const modePrompts = {
        focus: 'You are NEXUS in Focus Mode - be direct, concise, and productivity-focused. Help the user accomplish tasks efficiently.',
        mentor: 'You are NEXUS in Mentor Mode - be thoughtful, educational, and guide the user to deeper understanding. Ask clarifying questions.',
        creative: 'You are NEXUS in Creative Mode - be imaginative, playful, and help explore unconventional ideas and possibilities.',
        general: 'You are NEXUS - an intelligent AI assistant. Be helpful, insightful, and conversational.',
      };

      const systemPrompt = modePrompts[currentSession.mode] || modePrompts.general;

      // Generate AI response
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}

Previous conversation:
${recentMessages}
${contextPrompt}

User: ${content}

NEXUS:`,
      });

      // Create assistant message
      const assistantMessage = await base44.entities.Message.create({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        context_used: contextDocuments.map(d => d.id),
        timestamp: new Date().toISOString(),
      });

      // Update session
      await base44.entities.ChatSession.update(sessionId, {
        last_message_at: new Date().toISOString(),
        message_count: (currentSession.message_count || 0) + 2,
      });

      return { userMessage, assistantMessage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', currentSession?.id]);
      queryClient.invalidateQueries(['sessions']);
      setIsThinking(false);
      setInput('');
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    },
  });

  // Initialize with first session or create one
  useEffect(() => {
    if (sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0]);
    } else if (sessions.length === 0 && !currentSession && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [sessions, currentSession, createSessionMutation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSession || isThinking) return;
    
    setIsThinking(true);
    sendMessageMutation.mutate({
      content: input.trim(),
      sessionId: currentSession.id,
    });
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
  };

  const handleNewSession = () => {
    createSessionMutation.mutate();
    setSidebarOpen(false);
  };

  const handleSummarizeDocument = (doc) => {
    setSelectedDocument(doc);
    setShowSummarization(true);
  };

  const handleModeChange = (mode) => {
    if (currentSession) {
      updateModeMutation.mutate({ sessionId: currentSession.id, mode });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={setCurrentSession}
        onNewSession={handleNewSession}
        documents={documents}
        onShowDocuments={() => setShowDocuments(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="cyber-border bg-gray-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(6, 182, 212, 0.5)',
                    '0 0 40px rgba(139, 92, 246, 0.5)',
                    '0 0 20px rgba(6, 182, 212, 0.5)',
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
              >
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
              
              <div>
                <h1 className="text-lg font-bold glow-text">
                  {currentSession?.title || 'NEXUS'}
                </h1>
                <p className="text-xs text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {currentSession?.mode || 'general'} mode
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={currentSession?.mode || 'general'}
              onValueChange={handleModeChange}
            >
              <SelectTrigger className="w-32 bg-gray-900/50 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="focus">Focus</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNotionExport(true)}
              disabled={messages.length === 0}
              className="border-purple-500/30 hover:bg-purple-900/20 text-purple-300"
              title="Export to Notion"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDocuments(true)}
              className="border-purple-500/30 hover:bg-purple-900/20 text-purple-300"
              title="Knowledge Base"
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && !isThinking ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                <HolographicOrb size="lg" />
                
                <h2 className="text-4xl md:text-5xl font-bold mt-8 mb-4 glow-text">
                  Ask NEXUS anything
                </h2>
                
                <p className="text-xl text-gray-400 mb-8 max-w-2xl">
                  Your AI companion is ready to help you learn, create, and explore ideas
                </p>

                <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInput("Explain quantum computing in simple terms")}
                    className="p-4 rounded-xl cyber-border holographic bg-gray-900/50 backdrop-blur-sm text-left hover:bg-gray-900/70 transition-all"
                  >
                    <p className="text-cyan-400 font-medium mb-1">💡 Learn Something New</p>
                    <p className="text-sm text-gray-400">Explain quantum computing in simple terms</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInput("Help me brainstorm ideas for a creative project")}
                    className="p-4 rounded-xl cyber-border holographic bg-gray-900/50 backdrop-blur-sm text-left hover:bg-gray-900/70 transition-all"
                  >
                    <p className="text-purple-400 font-medium mb-1">✨ Get Creative</p>
                    <p className="text-sm text-gray-400">Help me brainstorm ideas for a creative project</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInput("What's in my knowledge base?")}
                    className="p-4 rounded-xl cyber-border holographic bg-gray-900/50 backdrop-blur-sm text-left hover:bg-gray-900/70 transition-all"
                  >
                    <p className="text-green-400 font-medium mb-1">📚 Use Your Knowledge</p>
                    <p className="text-sm text-gray-400">What's in my knowledge base?</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInput("Help me solve a problem I'm facing")}
                    className="p-4 rounded-xl cyber-border holographic bg-gray-900/50 backdrop-blur-sm text-left hover:bg-gray-900/70 transition-all"
                  >
                    <p className="text-orange-400 font-medium mb-1">🎯 Solve a Problem</p>
                    <p className="text-sm text-gray-400">Help me solve a problem I'm facing</p>
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-sm text-gray-500"
                >
                  💬 Use voice input or type your question below
                </motion.div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <MessageBubble key={message.id} message={message} index={index} />
                ))}
              </AnimatePresence>
            )}

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 mb-6"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 mr-12">
                  <div className="cyber-border holographic bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl">
                    <HolographicOrb size="sm" />
                    <p className="text-cyan-400 text-sm text-center mt-4">
                      NEXUS is thinking...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="cyber-border bg-gray-950/80 backdrop-blur-xl p-6"
        >
          <div className="max-w-4xl mx-auto flex gap-4">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={isThinking}
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask NEXUS anything..."
              className="flex-1 bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              disabled={isThinking}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isThinking}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Documents Dialog */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-4xl bg-gray-950 border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl glow-text flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              Knowledge Base
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <DocumentUploader
              onUploadComplete={() => {
                queryClient.invalidateQueries(['documents']);
              }}
            />
            
            <DocumentList
              documents={documents}
              onDelete={(id) => deleteDocumentMutation.mutate(id)}
              onSummarize={handleSummarizeDocument}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Summarization Dialog */}
      <Dialog open={showSummarization} onOpenChange={setShowSummarization}>
        <DialogContent className="max-w-4xl bg-gray-950 border-purple-500/30 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl glow-text flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              Advanced Summarization
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <SummarizationDialog
              document={selectedDocument}
              onComplete={() => {
                queryClient.invalidateQueries(['documents']);
                setShowSummarization(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notion Exporter Dialog */}
      <Dialog open={showNotionExport} onOpenChange={setShowNotionExport}>
        <DialogContent className="max-w-4xl bg-gray-950 border-purple-500/30 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl glow-text flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              Notion Integration
            </DialogTitle>
          </DialogHeader>
          
          <NotionExporter
            session={currentSession}
            sessionMessages={messages}
            onClose={() => setShowNotionExport(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
