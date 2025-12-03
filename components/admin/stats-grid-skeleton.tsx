import { StatCardSkeleton } from "@/components/admin/stat-card-skeleton"

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}
