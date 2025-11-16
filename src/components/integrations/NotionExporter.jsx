import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Copy, Check, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function NotionExporter({ session, sessionMessages, onClose }) {
  const [exportType, setExportType] = useState('journal');
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateExport = async (type) => {
    setGenerating(true);
    setExportType(type);
    
    try {
      const conversationContext = sessionMessages
        .map(m => `**${m.role === 'user' ? 'You' : 'NEXUS'}**: ${m.content}`)
        .join('\n\n');

      let prompt = '';
      
      if (type === 'journal') {
        prompt = `Create a journal entry from this conversation. Format it as a reflection with:
- Date and title
- Key topics discussed
- Insights gained
- Action items
- Personal reflections

Conversation:
${conversationContext}

Format in clean Markdown for Notion.`;
      } else if (type === 'insights') {
        prompt = `Extract key insights and learnings from this conversation. Format as:
# Key Insights

## Main Takeaways
- [bullet points]

## Deep Dive
[paragraphs with detailed insights]

## Questions to Explore
- [follow-up questions]

Conversation:
${conversationContext}

Format in clean Markdown for Notion.`;
      } else if (type === 'summary') {
        prompt = `Create a comprehensive summary of this conversation:
# Conversation Summary

## Overview
[brief summary]

## Key Points
- [main points discussed]

## Decisions Made
- [any decisions or conclusions]

## Next Steps
- [action items]

Conversation:
${conversationContext}

Format in clean Markdown for Notion.`;
      } else {
        prompt = `Format this conversation for Notion in a clean, readable way with proper markdown formatting:

${conversationContext}`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      setContent(result);

      // Save to database
      await base44.entities.NotionExport.create({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${format(new Date(), 'MMM d, yyyy')}`,
        content: result,
        export_type: type,
        session_id: session.id,
        formatted_date: format(new Date(), 'MMMM d, yyyy'),
      });

    } catch (error) {
      console.error('Error generating export:', error);
    }
    setGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-${exportType}-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="cyber-border bg-gray-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-cyan-400" />
            Export to Notion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="grid grid-cols-4 bg-gray-900/50">
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="conversation">Full Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="journal" className="space-y-4">
              <p className="text-sm text-gray-400">
                Generate a reflective journal entry with key topics, insights, and action items
              </p>
              <Button
                onClick={() => generateExport('journal')}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {generating && exportType === 'journal' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Journal Entry
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <p className="text-sm text-gray-400">
                Extract key insights, learnings, and follow-up questions from the conversation
              </p>
              <Button
                onClick={() => generateExport('insights')}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {generating && exportType === 'insights' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract Insights
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <p className="text-sm text-gray-400">
                Create a comprehensive summary with overview, key points, and next steps
              </p>
              <Button
                onClick={() => generateExport('summary')}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {generating && exportType === 'summary' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="conversation" className="space-y-4">
              <p className="text-sm text-gray-400">
                Export the full conversation in a clean Notion-ready format
              </p>
              <Button
                onClick={() => generateExport('conversation')}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {generating && exportType === 'conversation' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Format Conversation
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {content && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-gray-300">Generated Content (Markdown)</Label>
                <ScrollArea className="h-64 rounded-lg cyber-border bg-gray-950/50 p-4">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {content}
                  </pre>
                </ScrollArea>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>

                <Button
                  onClick={downloadAsMarkdown}
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-900/20 text-purple-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download .md
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-400 p-4 rounded-lg bg-cyan-900/10 border border-cyan-500/20"
              >
                <p className="font-medium text-cyan-400 mb-2">📋 How to add to Notion:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copy the content above</li>
                  <li>Open Notion and create a new page</li>
                  <li>Paste (Cmd/Ctrl + V) - Notion will auto-format the markdown</li>
                  <li>Your NEXUS insights are now in Notion! ✨</li>
                </ol>
              </motion.div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}