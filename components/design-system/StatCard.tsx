import React from 'react';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

/**
 * Stat Card Component
 * Displays key metrics with optional trend indicators
 * Based on the transaction/metrics cards from the design
 */

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  iconColor?: 'success' | 'error' | 'warning' | 'primary';
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  iconColor = 'primary',
  className = '',
}: StatCardProps) {
  const iconColorClasses = {
    success: 'text-[#10B981] bg-[#D1FAE5]',
    error: 'text-[#EF4444] bg-[#FEE2E2]',
    warning: 'text-[#F59E0B] bg-[#FEF3C7]',
    primary: 'text-[#2D6EF7] bg-[#EBF2FE]',
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return <ArrowUp size={16} className="text-[#10B981]" />;
    }
    if (trend === 'down') {
      return <ArrowDown size={16} className="text-[#EF4444]" />;
    }
    if (trend === 'neutral') {
      return <TrendingUp size={16} className="text-[#6B7280]" />;
    }
    return null;
  };

  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* Icon */}
      {icon && (
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconColorClasses[iconColor]}`}
        >
          {icon}
        </div>
      )}

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            {getTrendIcon()}
            {trendValue && <span>{trendValue}</span>}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <StatCard
 *   label="Transaction"
 *   value="$12,801"
 *   trend="up"
 *   trendValue="+12.5%"
 *   icon={<DollarSign size={20} />}
 *   iconColor="success"
 * />
 *
 * <StatCard
 *   label="Reach"
 *   value="120 times"
 *   trend="neutral"
 *   icon={<TrendingUp size={20} />}
 *   iconColor="primary"
 * />
 */
