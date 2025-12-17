import React from 'react';

/**
 * Feature Card Component
 * Blue gradient card for highlighting primary features or CTAs
 * Based on the "Let's create campaign" card from the design
 */

export interface FeatureCardProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  buttonText = 'Get Started',
  onButtonClick,
  className = '',
}: FeatureCardProps) {
  return (
    <div
      className={`rounded-2xl p-12 text-white ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2D6EF7 0%, #1E5EE8 100%)',
      }}
    >
      {/* Title */}
      <h2 className="text-3xl font-bold leading-tight mb-4 text-balance">
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm opacity-90 mb-8 max-w-md">
        {description}
      </p>

      {/* CTA Button */}
      <button
        onClick={onButtonClick}
        className="bg-white text-[#2D6EF7] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-neutral-50 transition-all duration-200 hover:shadow-lg inline-flex items-center gap-2"
      >
        {buttonText}
      </button>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <FeatureCard
 *   title="Let's create campaign for your amazing brand!"
 *   description="Quia minus veniam, eget molestie sit urna"
 *   buttonText="Go for it!"
 *   onButtonClick={() => console.log('Feature clicked')}
 * />
 */
