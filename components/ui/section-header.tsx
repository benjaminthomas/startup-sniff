import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** The main title of the section */
  title: string;
  /** The description/subtitle text */
  description?: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Additional content to display on the right side (e.g., buttons) */
  actions?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Size variant for the header */
  size?: 'sm' | 'md' | 'lg';
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
  size = 'lg'
}: SectionHeaderProps) {
  const sizeStyles = {
    sm: {
      container: 'space-y-1',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      title: 'text-xl font-semibold',
      description: 'text-sm text-muted-foreground'
    },
    md: {
      container: 'space-y-2',
      icon: 'w-7 h-7',
      iconSize: 'h-4 w-4',
      title: 'text-2xl font-bold',
      description: 'text-sm text-muted-foreground'
    },
    lg: {
      container: 'space-y-2',
      icon: 'w-8 h-8',
      iconSize: 'h-5 w-5',
      title: 'text-3xl font-bold',
      description: 'text-base text-muted-foreground'
    }
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div className={cn('flex items-center space-x-3', styles.container)}>
        {Icon && (
          <div className={cn(
            'bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0',
            styles.icon
          )}>
            <Icon className={cn('text-primary', styles.iconSize)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className={cn(styles.title, 'leading-tight')}>{title}</h1>
          {description && (
            <p className={cn(styles.description, 'leading-relaxed')}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}