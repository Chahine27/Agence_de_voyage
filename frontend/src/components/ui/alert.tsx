import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}

const variantClasses = {
  default: 'bg-blue-100 border-blue-500 text-blue-700',
  destructive: 'bg-red-100 border-red-500 text-red-700',
} as const;

export function Alert({ children, variant = 'default' }: AlertProps) {
  return (
    <div className={`border-l-4 p-4 ${variantClasses[variant]}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}