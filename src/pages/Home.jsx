import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Target, MessageSquare, FileText, Mail, Download, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createSessionMutation = useMutation({
    mutationFn: async (mode) => {
      const session = await base44.entities.ChatSession.create({
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Session - ${new Date().toLocaleString()}`,
        mode,
        last_message_at: new Date().toISOString(),
        message_count: 0,
      });
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      navigate(createPageUrl('Nexus'));
    },
  });

  const modes = [
    {
      id: 'general',
      title: 'General Mode',
      description: 'Explore ideas, ask questions, and have natural conversations',
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-500',
      features: ['Open discussions', 'General knowledge', 'Casual learning']
    },
    {
      id: 'focus',
      title: 'Focus Mode',
      description: 'Get straight to the point with productivity-focused assistance',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      features: ['Task-oriented', 'Quick answers', 'Action items']
    },
    {
      id: 'mentor',
      title: 'Mentor Mode',
      description: 'Deep learning with thoughtful guidance and education',
      icon: Brain,
      color: 'from-purple-500 to-blue-500',
      features: ['Deep insights', 'Teaching approach', 'Critical thinking']
    },
    {
      id: 'creative',
      title: 'Creative Mode',
      description: 'Unleash imagination and explore unconventional possibilities',
      icon: Sparkles,
      color: 'from-pink-500 to-purple-500',
      features: ['Brainstorming', 'Innovative ideas', 'Free exploration']
    }
  ];

  const features = [
    {
      icon: FileText,
      title: 'Knowledge Base',
      description: 'Upload documents and NEXUS remembers everything'
    },
    {
      icon: Mail,
      title: 'Email Drafting',
      description: 'Generate professional emails from your conversations'
    },
    {
      icon: Download,
      title: 'Notion Export',
      description: 'Export insights and summaries to your workspace'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px rgba(6, 182, 212, 0.5)',
                '0 0 60px rgba(139, 92, 246, 0.5)',
                '0 0 30px rgba(6, 182, 212, 0.5)',
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 glow-text">
            Welcome to NEXUS
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            What do you want to learn today?
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Your personal AI brain powered by advanced language models. 
            Upload documents, have conversations, and unlock insights with context-aware intelligence.
          </p>
        </motion.div>

        {/* Modes Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Choose Your Learning Mode
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {modes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cyber-border bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all cursor-pointer group"
                  onClick={() => createSessionMutation.mutate(mode.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <mode.icon className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {mode.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {mode.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mode.features.map((feature, i) => (
                            <span key={i} className="text-xs px-3 py-1 rounded-full bg-gray-800/50 text-gray-300 border border-gray-700/50">
                              {feature}
                            </span>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          className={`bg-gradient-to-r ${mode.color} hover:opacity-90 text-white group-hover:gap-3 transition-all`}
                          onClick={(e) => {
                            e.stopPropagation();
                            createSessionMutation.mutate(mode.id);
                          }}
                        >
                          Start {mode.title}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="cyber-border bg-gray-900/50 backdrop-blur-sm h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            onClick={() => navigate(createPageUrl('Nexus'))}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-lg px-8 py-6"
          >
            <Brain className="w-5 h-5 mr-2" />
            Continue to NEXUS
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}