import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function EmailDrafter({ sessionMessages, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const conversationContext = sessionMessages
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'User' : 'NEXUS'}: ${m.content}`)
        .join('\n\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this conversation, draft a professional email. Include both a subject line and email body.

Conversation context:
${conversationContext}

Generate a professional email with:
1. A clear, concise subject line
2. A well-structured, professional email body

Format your response as:
SUBJECT: [subject line]
BODY: [email body]`,
      });

      // Parse the response
      const subjectMatch = result.match(/SUBJECT:\s*(.+?)(?=\n|BODY:|$)/i);
      const bodyMatch = result.match(/BODY:\s*(.+)/is);

      if (subjectMatch) setSubject(subjectMatch[1].trim());
      if (bodyMatch) setBody(bodyMatch[1].trim());

    } catch (error) {
      console.error('Error generating email:', error);
    }
    setGenerating(false);
  };

  const sendEmail = async () => {
    if (!recipient || !subject || !body) return;
    
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: recipient,
        subject: subject,
        body: body,
      });

      await base44.entities.EmailDraft.create({
        subject,
        body,
        recipient,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    }
    setSending(false);
  };

  const saveDraft = async () => {
    if (!subject || !body) return;
    
    try {
      await base44.entities.EmailDraft.create({
        subject,
        body,
        recipient: recipient || '',
        status: 'draft',
      });
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="cyber-border bg-gray-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Draft Email with NEXUS
            </span>
            <Button
              onClick={generateEmail}
              disabled={generating || sessionMessages.length === 0}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-gray-300">To</Label>
            <Input
              id="recipient"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="recipient@example.com"
              className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-gray-300">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body" className="text-gray-300">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body..."
              rows={12}
              className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={sendEmail}
              disabled={!recipient || !subject || !body || sending}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
            
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="border-purple-500/30 hover:bg-purple-900/20 text-purple-300"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>

            <Button
              onClick={saveDraft}
              disabled={!subject || !body}
              variant="outline"
              className="border-purple-500/30 hover:bg-purple-900/20 text-purple-300"
            >
              Save Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-gray-400 text-center"
      >
        💡 NEXUS will use your conversation context to generate relevant emails
      </motion.div>
    </div>
  );
}