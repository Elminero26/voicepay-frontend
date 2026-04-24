import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, description, footer }) => {
  return (
    <div className={cn('glass card-hover rounded-2xl p-6 overflow-hidden', className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
        </div>
      )}
      <div className="relative">{children}</div>
      {footer && <div className="mt-6 pt-4 border-t border-border">{footer}</div>}
    </div>
  );
};
