'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { TargetMarket, Solution } from '@/types/startup-ideas';

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
  const formatTargetMarket = (targetMarket: TargetMarket) => {
    if (typeof targetMarket === 'object' && targetMarket) {
      let formatted = '';
      const market = targetMarket as unknown as Record<string, unknown>;
      if (market.primary_demographic) {
        formatted += `Primary Demographics: ${market.primary_demographic}\n\n`;
      }
      if (market.pain_level) {
        formatted += `Pain Level: ${(market.pain_level as string).charAt(0).toUpperCase() + (market.pain_level as string).slice(1)}\n\n`;
      }
      if (market.market_size_estimate) {
        formatted += `Market Size Estimate: ${(market.market_size_estimate as number).toLocaleString()} potential users\n\n`;
      }
      if (market.user_personas && Array.isArray(market.user_personas) && market.user_personas.length > 0) {
        formatted += 'User Personas:\n';
        (market.user_personas as Record<string, unknown>[]).forEach((persona: Record<string, unknown>, index: number) => {
          formatted += `${index + 1}. ${persona.name || 'Target User'}\n`;
          if (persona.age_range) formatted += `   Age Range: ${persona.age_range}\n`;
          if (persona.income_level) formatted += `   Income Level: ${persona.income_level}\n`;
          if (persona.pain_points && Array.isArray(persona.pain_points) && persona.pain_points.length > 0) {
            formatted += `   Key Pain Points:\n`;
            (persona.pain_points as string[]).forEach((point: string) => {
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
  const formatSolution = (solution: Solution) => {
    if (typeof solution === 'object' && solution) {
      let formatted = '';
      const sol = solution as unknown as Record<string, unknown>;
      if (sol.business_model) {
        formatted += `Business Model: ${sol.business_model}\n\n`;
      }
      if (sol.key_features && Array.isArray(sol.key_features) && sol.key_features.length > 0) {
        formatted += 'Key Features:\n';
        (sol.key_features as string[]).forEach((feature: string) => {
          formatted += `• ${feature}\n`;
        });
        formatted += '\n';
      }
      if (sol.differentiators && Array.isArray(sol.differentiators) && sol.differentiators.length > 0) {
        formatted += 'Competitive Differentiators:\n';
        (sol.differentiators as string[]).forEach((diff: string) => {
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
    ideaData.redditSources.forEach((source: Record<string, unknown>) => {
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