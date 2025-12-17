import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Pro Access Card Component
 * Upgrade/upsell card for promoting premium features
 * Based on the "Become Pro Access" card from the design
 */

export interface ProAccessCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  onUpgrade?: () => void;
  className?: string;
}

export function ProAccessCard({
  title = 'Become Pro Access',
  description = 'Try our experience for using more features',
  buttonText = 'Upgrade Pro',
  icon = <Sparkles size={18} />,
  onUpgrade,
  className = '',
}: ProAccessCardProps) {
  return (
    <div
      className={`rounded-xl p-6 text-white text-center ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2D6EF7 0%, #1E5EE8 100%)',
      }}
    >
      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {/* Description */}
      <p className="text-xs opacity-90 mb-4">{description}</p>

      {/* Upgrade Button */}
      <button
        onClick={onUpgrade}
        className="w-full bg-white text-[#2D6EF7] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-neutral-50 transition-all duration-200 inline-flex items-center justify-center gap-2"
      >
        {icon}
        {buttonText}
      </button>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <ProAccessCard
 *   title="Become Pro Access"
 *   description="Try our experience for using more features"
 *   buttonText="Upgrade Pro"
 *   onUpgrade={() => console.log('Upgrade clicked')}
 * />
 */
