interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`} />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      {/* Top badges */}
      <div className="flex items-start justify-between">
        <Skeleton className="w-20 h-6 rounded-full" />
        <Skeleton className="w-24 h-6 rounded-md" />
      </div>

      {/* Game icon */}
      <div className="flex justify-center my-6">
        <Skeleton className="w-20 h-20 rounded-2xl" />
      </div>

      {/* VS */}
      <Skeleton className="w-8 h-4 mx-auto" />

      {/* Players */}
      <div className="flex items-center justify-between my-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-12 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="space-y-1 text-right">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-12 h-3" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Stakes */}
      <Skeleton className="w-full h-12 rounded-lg" />

      {/* Players count */}
      <Skeleton className="w-24 h-4 mx-auto" />

      {/* Timestamp */}
      <Skeleton className="w-32 h-3 mx-auto" />

      {/* Button */}
      <Skeleton className="w-full h-12 rounded-lg" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stats-card p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-8" />
          <Skeleton className="w-20 h-3" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function TournamentCardSkeleton() {
  return (
    <div className="tournament-card flex-shrink-0 w-[360px]">
      {/* Banner */}
      <Skeleton className="h-40 w-full" />
      
      {/* Info */}
      <div className="p-5 space-y-4 bg-white/5">
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-12 h-4" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-32 h-4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-full h-12 rounded-lg" />
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="activity-item">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="w-48 h-4" />
        <Skeleton className="w-32 h-3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 px-4">
        <Skeleton className="w-24 h-4" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="w-16 h-4" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="w-20 h-4" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="w-16 h-6 rounded-full" />
      </td>
    </tr>
  );
}