import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DocumentUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file) => {
    setUploading(true);
    setProgress('Uploading file...');
    setError('');

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress('Extracting content...');
      
      // Determine file type
      const fileType = file.type.includes('pdf') ? 'pdf' 
        : file.type.includes('text') ? 'text'
        : file.type.includes('image') ? 'image'
        : 'other';

      let content = '';
      let extractSuccess = false;

      // Try to extract content
      try {
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              content: { type: "string" }
            }
          }
        });

        if (extractResult.status === 'success' && extractResult.output?.content) {
          content = extractResult.output.content;
          extractSuccess = true;
        }
      } catch (extractError) {
        console.log('Extraction failed, will try LLM for image/pdf:', extractError);
      }

      // If extraction failed and it's an image or pdf, try using LLM with file_urls
      if (!extractSuccess && (fileType === 'image' || fileType === 'pdf')) {
        setProgress('Processing with AI...');
        try {
          content = await base44.integrations.Core.InvokeLLM({
            prompt: 'Extract and transcribe all text content from this document. Return only the extracted text, nothing else.',
            file_urls: [file_url]
          });
          extractSuccess = true;
        } catch (llmError) {
          console.error('LLM extraction failed:', llmError);
        }
      }

      // If still no content, create a placeholder
      if (!content || content.trim().length === 0) {
        content = `Document uploaded: ${file.name}. Content extraction not available for this file type. File URL: ${file_url}`;
      }

      setProgress('Generating summary...');
      
      // Generate summary
      let summary = '';
      try {
        summary = await base44.integrations.Core.InvokeLLM({
          prompt: `Provide a concise 2-3 sentence summary of this document:\n\n${content.slice(0, 3000)}`,
        });
      } catch (summaryError) {
        summary = 'Summary generation failed. Content available in document.';
      }

      setProgress('Extracting keywords...');
      
      // Extract keywords
      let keywords = [];
      try {
        const keywordsResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract 5-8 key keywords or topics from this document. Return them as a comma-separated list only.\n\n${content.slice(0, 3000)}`,
        });
        keywords = keywordsResult.split(',').map(k => k.trim()).filter(k => k);
      } catch (keywordError) {
        console.log('Keyword extraction failed:', keywordError);
      }

      // Save document to database
      await base44.entities.Document.create({
        title: file.name,
        file_url,
        content,
        file_type: fileType,
        summary,
        summary_keywords: keywords,
        word_count: content.split(/\s+/).filter(w => w).length,
        tags: []
      });

      setProgress('Complete!');
      setTimeout(() => {
        onUploadComplete();
        setUploading(false);
        setProgress('');
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(`Error: ${error.message || 'Failed to upload file'}`);
      setProgress('');
      setTimeout(() => {
        setUploading(false);
        setError('');
      }, 3000);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
        dragActive 
          ? 'border-cyan-500 bg-cyan-500/10' 
          : 'border-purple-500/30 bg-gray-900/30 hover:border-purple-500/50'
      }`}
    >
      {!uploading ? (
        <div className="text-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
          >
            <Upload className="w-10 h-10 text-white" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            Upload Documents
          </h3>
          <p className="text-gray-400 mb-6">
            Drag & drop or click to upload PDFs, text files, images, or documents
          </p>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.txt,.doc,.docx,.md,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <label htmlFor="file-upload">
            <Button
              as="span"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2" />
              Select File
            </Button>
          </label>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
            {progress === 'Complete!' ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            )}
          </div>
          <p className="text-cyan-400 font-medium">{progress}</p>
        </div>
      )}
    </div>
  );
}