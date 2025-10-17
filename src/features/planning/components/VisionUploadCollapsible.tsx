import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisionUploadPanel } from './VisionUploadPanel';
import type { VisionInsightNormalized } from '@/types/vision';
import { cn } from '@/lib/utils';

interface VisionUploadCollapsibleProps {
  onApplyInsight?: (insight: VisionInsightNormalized) => void;
  className?: string;
}

export function VisionUploadCollapsible({ onApplyInsight, className }: VisionUploadCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('mt-6 border-t border-border/50 pt-6', className)}>
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="xs"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex items-center gap-2 rounded-full border-emerald-200 bg-background px-3 py-1 text-xs"
        >
          <Camera className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">
            {isExpanded ? 'Ocultar análisis de fotos' : 'Análisis de fotos'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-emerald-600" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-4 overflow-hidden"
          >
            <div className="max-w-2xl mx-auto">
              <VisionUploadPanel onApplyInsight={onApplyInsight} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
