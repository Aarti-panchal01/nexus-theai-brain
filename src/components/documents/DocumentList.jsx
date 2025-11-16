import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ImageIcon, File, Trash2, Sparkles, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const fileTypeIcons = {
  pdf: FileText,
  text: FileText,
  image: ImageIcon,
  other: File
};

const fileTypeColors = {
  pdf: 'from-red-500 to-orange-500',
  text: 'from-blue-500 to-cyan-500',
  image: 'from-purple-500 to-pink-500',
  other: 'from-gray-500 to-gray-600'
};

export default function DocumentList({ documents, onDelete, onSummarize }) {
  const handleDownload = (doc) => {
    // Create a text file with the document content
    const content = `${doc.title}\n${'='.repeat(doc.title.length)}\n\n${doc.content}\n\n---\nSummary: ${doc.summary || 'No summary available'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewOriginal = (doc) => {
    window.open(doc.file_url, '_blank');
  };

  return (
    <ScrollArea className="h-[600px]">
      <div className="grid gap-4">
        {documents.map((doc, index) => {
          const Icon = fileTypeIcons[doc.file_type] || File;
          const colorGradient = fileTypeColors[doc.file_type] || fileTypeColors.other;
          
          const summaryCount = [
            doc.summary_one_sentence,
            doc.summary_bullet_points,
            doc.summary_detailed
          ].filter(Boolean).length;
          
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="cyber-border bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base text-white truncate">
                        {doc.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-gray-400">
                          {doc.word_count?.toLocaleString()} words
                        </p>
                        <span className="text-gray-600">•</span>
                        <p className="text-xs text-gray-400">
                          {format(new Date(doc.created_date), 'MMM d, yyyy')}
                        </p>
                        {summaryCount > 0 && (
                          <>
                            <span className="text-gray-600">•</span>
                            <Badge className="bg-green-900/30 text-green-300 border border-green-500/30 text-xs">
                              {summaryCount}/3 summaries
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSummarize(doc)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                        title="Manage summaries"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewOriginal(doc)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        title="View original file"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {(doc.summary || doc.summary_one_sentence) && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {doc.summary_one_sentence || doc.summary}
                    </p>
                    
                    {doc.summary_keywords && doc.summary_keywords.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {doc.summary_keywords.map((keyword, i) => (
                          <Badge key={i} className="text-xs bg-purple-900/30 text-purple-300 border border-purple-500/30">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {doc.tags.map((tag, i) => (
                          <Badge key={i} className="text-xs bg-cyan-900/30 text-cyan-300 border border-cyan-500/30">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}

        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No documents yet</p>
            <p className="text-sm text-gray-500 mt-2">Upload your first document to get started</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}