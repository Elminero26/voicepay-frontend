import React from 'react';
import { cn } from '../utils/cn';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className }) => {
  return (
    <div className={cn('w-full overflow-x-auto custom-scrollbar', className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {headers.map((header, index) => (
              <th
                key={index}
                className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <tr className={cn('group hover:bg-white/5 transition-colors', className)}>
    {children}
  </tr>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, colSpan, ...props }) => (
  <td colSpan={colSpan} className={cn('py-4 px-4 text-sm text-text-primary', className)} {...props}>
    {children}
  </td>
);
