'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Calendar } from "lucide-react";
import { getContentIcon, getContentTypeLabel, getContentTypeColor } from "@/lib/utils/content-helpers";
import { GeneratedContent } from "./ContentCard";

interface ContentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: GeneratedContent | null;
  onCopy: (text: string) => void;
}

export function ContentPreviewDialog({
  open,
  onOpenChange,
  content,
  onCopy
}: ContentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {content && getContentIcon(content.content_type)}
            {content?.title || 'Content Preview'}
          </DialogTitle>
        </DialogHeader>

        {content ? (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getContentTypeColor(content.content_type)}>
                {getContentTypeLabel(content.content_type)}
              </Badge>
              {content.brand_voice && (
                <Badge variant="outline">
                  {content.brand_voice.replace('_', ' ')}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(content.created_at).toLocaleDateString()}
              </Badge>
            </div>

            {/* SEO Keywords */}
            {content.seo_keywords && content.seo_keywords.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Keywords:</div>
                <div className="flex flex-wrap gap-1">
                  {content.seo_keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content with Copy Button */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Generated Content</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(content.content)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              {/* Scrollable Content Area */}
              <div
                className="bg-muted/20 border rounded-lg p-4 max-h-[300px] overflow-y-auto"
                style={{ wordWrap: 'break-word' }}
              >
                <div className="whitespace-pre-wrap text-sm leading-6">
                  {content.content || 'No content available'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center text-sm text-muted-foreground pt-3 border-t">
              <div className="flex gap-4">
                <span>{Math.ceil(content.content?.length / 5) || 0} words</span>
                <span>{content.content?.length || 0} characters</span>
              </div>
              <span>
                Created {new Date(content.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No content selected
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
