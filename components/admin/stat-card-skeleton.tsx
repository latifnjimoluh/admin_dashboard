import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  )
}
