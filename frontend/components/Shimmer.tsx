import React from 'react';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className = 'h-4 w-full bg-neutral-200' }: ShimmerProps) {
  return (
    <div className={`animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:1000px_100%] rounded-md ${className}`} />
  );
}

export function TableShimmer({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4 w-full animate-pulse-subtle">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-6 flex-1 bg-neutral-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center py-2 border-b border-neutral-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Shimmer key={c} className="h-5 flex-1 bg-neutral-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardShimmer() {
  return (
    <div className="border border-neutral-100 rounded-xl p-6 bg-white shadow-sm space-y-4">
      <Shimmer className="h-6 w-1/3" />
      <div className="space-y-2">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Shimmer className="h-8 w-20" />
        <Shimmer className="h-8 w-16" />
      </div>
    </div>
  );
}
