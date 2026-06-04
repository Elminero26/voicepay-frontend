import React from 'react';
import { cn } from '../utils/cn';

interface LoaderProps {
  fullScreen?: boolean;
  variant?: 'dashboard' | 'table' | 'settings' | 'general' | 'spinner';
  className?: string;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  fullScreen,
  variant = 'spinner',
  className,
  text
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'dashboard':
        return (
          <div className="space-y-8 w-full animate-pulse">
            {/* Header placeholder */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-white/10 rounded-xl" />
                <div className="h-4 w-72 bg-white/5 rounded-lg" />
              </div>
              <div className="h-10 w-48 bg-white/5 rounded-xl self-end md:self-auto" />
            </div>

            {/* Metrics cards grid placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-white/10 rounded" />
                      <div className="h-8 w-24 bg-white/20 rounded-lg" />
                    </div>
                    <div className="h-10 w-10 bg-white/10 rounded-xl" />
                  </div>
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
              ))}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-white/10 rounded" />
                    <div className="h-3 w-64 bg-white/5 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-white/10 rounded-lg" />
                </div>
                <div className="h-[280px] w-full bg-white/5 rounded-2xl flex items-end justify-between p-4 space-x-2">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      style={{ height: `${20 + Math.random() * 60}%` }}
                      className="w-full bg-white/10 rounded-t"
                    />
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded" />
                  <div className="h-3 w-48 bg-white/5 rounded" />
                </div>
                <div className="h-[280px] w-full flex items-center justify-center">
                  <div className="h-40 w-40 rounded-full border-8 border-white/5 border-t-white/10 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </div>

            {/* Table list placeholder */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="h-5 w-36 bg-white/10 rounded" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-white/10" />
                      <div className="space-y-1">
                        <div className="h-3 w-28 bg-white/10 rounded" />
                        <div className="h-3 w-20 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-3 w-24 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-8 w-full animate-pulse">
            {/* Header placeholder */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-44 bg-white/10 rounded-xl" />
                <div className="h-4 w-64 bg-white/5 rounded-lg" />
              </div>
              <div className="h-10 w-32 bg-white/10 rounded-xl self-start md:self-auto" />
            </div>

            {/* Table block */}
            <div className="glass rounded-2xl p-0 overflow-hidden">
              {/* Filter bar */}
              <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="h-10 w-full max-w-md bg-white/5 rounded-xl" />
                <div className="flex space-x-3">
                  <div className="h-9 w-24 bg-white/10 rounded-xl" />
                  <div className="h-9 w-20 bg-white/10 rounded-xl" />
                </div>
              </div>

              {/* Table rows */}
              <div className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 py-3 items-center border-b border-white/5">
                    <div className="col-span-2 flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-white/10" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-[70%] bg-white/15 rounded" />
                        <div className="h-3 w-[50%] bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-28 bg-white/10 rounded" />
                    <div className="h-6 w-16 bg-white/10 rounded-lg justify-self-start" />
                    <div className="h-3 w-20 bg-white/5 rounded justify-self-end" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8 w-full animate-pulse">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-white/10 rounded-xl" />
              <div className="h-4 w-80 bg-white/5 rounded-lg" />
            </div>

            {/* Tab pill placeholders */}
            <div className="h-12 w-64 bg-white/5 border border-border/50 rounded-xl p-1 flex space-x-1">
              <div className="h-full w-1/2 bg-white/10 rounded-lg" />
              <div className="h-full w-1/2 rounded-lg" />
            </div>

            {/* Form & Cards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-white/10 rounded" />
                  <div className="h-3.5 w-64 bg-white/5 rounded" />
                </div>
                <div className="space-y-4 pt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 bg-white/10 rounded" />
                      <div className="h-11 w-full bg-white/5 rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-6 space-y-4 h-fit">
                <div className="h-5 w-20 bg-white/10 rounded" />
                <div className="flex space-x-3">
                  <div className="h-8 w-8 rounded bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-24 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-white/15" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-[60%] bg-white/15 rounded" />
                    <div className="h-3 w-[40%] bg-white/5 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full bg-white/10 rounded" />
                  <div className="h-3 w-[80%] bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'spinner':
      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            </div>
            <p className="text-sm font-medium text-text-secondary animate-pulse">{text || 'Loading VoicePay System...'}</p>
          </div>
        );
    }
  };

  const content = renderSkeleton();

  if (fullScreen) {
    return (
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-8", className)}>
        {variant === 'spinner' ? content : (
          <div className="max-w-7xl mx-auto w-full">
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(variant !== 'spinner' ? "w-full" : "p-12 flex justify-center", className)}>
      {content}
    </div>
  );
};
