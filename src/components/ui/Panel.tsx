import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface PanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'dark' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: 'none' | 'default' | 'gold' | 'red' | 'blue';
}

const variantClasses = {
  default: 'panel',
  dark: 'panel-dark',
  transparent: 'bg-transparent',
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

const borderClasses = {
  none: 'border-0',
  default: 'border-gray-700/50',
  gold: 'border-yellow-600/50',
  red: 'border-red-700/50',
  blue: 'border-blue-600/50',
};

export function Panel({
  children,
  title,
  className,
  variant = 'default',
  padding = 'md',
  border = 'default',
}: PanelProps) {
  return (
    <div
      className={clsx(
        variantClasses[variant],
        paddingClasses[padding],
        borderClasses[border],
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-yellow-500 mb-4 pb-2 border-b border-gray-700/50">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Sub-components for common panel layouts
export function PanelHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('space-y-4', className)}>{children}</div>;
}

export function PanelFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-gray-700/50 flex gap-3', className)}>
      {children}
    </div>
  );
}
