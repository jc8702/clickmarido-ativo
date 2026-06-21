import React from 'react';

export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className={`w-full text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHead({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-gradient-subtle dark:bg-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-700 ${className}`} {...props} />
  );
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`
        border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700
        transition-colors duration-150
        ${className}
      `}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-6 py-4 text-neutral-700 dark:text-neutral-300 ${className}`} {...props} />;
}

export function TableHeader({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`
        px-6 py-4 text-left font-semibold text-neutral-900 dark:text-neutral-100
        bg-neutral-100/50 dark:bg-neutral-700/50
        ${className}
      `}
      {...props}
    />
  );
}
