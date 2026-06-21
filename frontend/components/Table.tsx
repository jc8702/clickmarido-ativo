import React from 'react';

export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className={`w-full text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHead({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-gradient-subtle border-b-2 border-neutral-200 ${className}`} {...props} />
  );
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`
        border-b border-neutral-200 hover:bg-neutral-50
        transition-colors duration-150
        ${className}
      `}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-6 py-4 text-neutral-700 ${className}`} {...props} />;
}

export function TableHeader({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`
        px-6 py-4 text-left font-semibold text-neutral-900
        bg-neutral-100/50
        ${className}
      `}
      {...props}
    />
  );
}
