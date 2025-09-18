'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ExportPDFButtonProps {
  ideaId: string;
  ideaTitle: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'ghost';
}

export function ExportPDFButton({
  ideaId,
  ideaTitle,
  className,
  size = 'sm',
  variant = 'outline'
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      // Create a clean filename from the title
      const filename = `${ideaTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_startup_idea.pdf`;

      // Generate the PDF using jsPDF
      await generatePDF(ideaId, filename);

      toast.success('PDF exported successfully!', {
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExportPDF}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isExporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}

// PDF generation using jsPDF
async function generatePDF(ideaId: string, filename: string): Promise<void> {
  // Fetch the idea data
  const response = await fetch(`/api/ideas/${ideaId}/export`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch idea data for export');
  }

  const ideaData = await response.json();

  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 30;

  // Helper function to add text with automatic wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.4) + 5;

    // Add new page if needed
    if (yPosition > doc.internal.pageSize.height - 30) {
      doc.addPage();
      yPosition = 30;
    }
  };

  // Helper function to add section spacing
  const addSpacing = (space: number = 10) => {
    yPosition += space;
  };

  // Title and header
  addText('STARTUP IDEA REPORT', 20, true);
  addSpacing(5);
  addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
  addSpacing(15);

  // Idea title
  addText(ideaData.title, 16, true);
  addSpacing(10);

  // Problem statement
  addText('PROBLEM STATEMENT', 14, true);
  addText(ideaData.problem_statement || 'No problem statement available');
  addSpacing(10);

  // Target market
  addText('TARGET MARKET', 14, true);
  const formatTargetMarket = (targetMarket: any) => {
    if (typeof targetMarket === 'object' && targetMarket) {
      let formatted = '';
      if (targetMarket.primary_demographic) {
        formatted += `Primary Demographics: ${targetMarket.primary_demographic}\n\n`;
      }
      if (targetMarket.pain_level) {
        formatted += `Pain Level: ${targetMarket.pain_level.charAt(0).toUpperCase() + targetMarket.pain_level.slice(1)}\n\n`;
      }
      if (targetMarket.market_size_estimate) {
        formatted += `Market Size Estimate: ${targetMarket.market_size_estimate.toLocaleString()} potential users\n\n`;
      }
      if (targetMarket.user_personas && targetMarket.user_personas.length > 0) {
        formatted += 'User Personas:\n';
        targetMarket.user_personas.forEach((persona: any, index: number) => {
          formatted += `${index + 1}. ${persona.name || 'Target User'}\n`;
          if (persona.age_range) formatted += `   Age Range: ${persona.age_range}\n`;
          if (persona.income_level) formatted += `   Income Level: ${persona.income_level}\n`;
          if (persona.pain_points && persona.pain_points.length > 0) {
            formatted += `   Key Pain Points:\n`;
            persona.pain_points.forEach((point: string) => {
              formatted += `   • ${point}\n`;
            });
          }
          formatted += '\n';
        });
      }
      return formatted.trim();
    }
    return targetMarket || 'No target market information available';
  };
  addText(formatTargetMarket(ideaData.target_market));
  addSpacing(10);

  // Solution
  addText('SOLUTION', 14, true);
  const formatSolution = (solution: any) => {
    if (typeof solution === 'object' && solution) {
      let formatted = '';
      if (solution.business_model) {
        formatted += `Business Model: ${solution.business_model}\n\n`;
      }
      if (solution.key_features && solution.key_features.length > 0) {
        formatted += 'Key Features:\n';
        solution.key_features.forEach((feature: string) => {
          formatted += `• ${feature}\n`;
        });
        formatted += '\n';
      }
      if (solution.differentiators && solution.differentiators.length > 0) {
        formatted += 'Competitive Differentiators:\n';
        solution.differentiators.forEach((diff: string) => {
          formatted += `• ${diff}\n`;
        });
        formatted += '\n';
      }
      return formatted.trim();
    }
    return solution || 'No solution information available';
  };
  addText(formatSolution(ideaData.solution));
  addSpacing(10);

  // AI Confidence Score
  addText('AI CONFIDENCE SCORE', 14, true);
  addText(`${ideaData.ai_confidence_score || 0}%`);
  addSpacing(10);

  // Reddit Sources
  addText('REDDIT SOURCES', 14, true);
  if (ideaData.redditSources && ideaData.redditSources.length > 0) {
    ideaData.redditSources.forEach((source: any) => {
      addText(`• r/${source.subreddit}: ${source.title}`);
    });
  } else {
    addText('No Reddit sources available');
  }
  addSpacing(15);

  // Footer
  addText('Generated by StartupSniff - AI-Powered Startup Ideas & Validation', 10, true);

  // Save the PDF
  doc.save(filename);
}