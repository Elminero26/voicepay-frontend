import React from 'react';

export const Loader: React.FC<{ fullScreen?: boolean }> = ({ fullScreen }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
      </div>
      <p className="text-sm font-medium text-text-secondary animate-pulse">Loading VoicePay System...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="p-12 flex justify-center">{content}</div>;
};
