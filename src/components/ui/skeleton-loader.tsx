import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const CardSkeleton = () => (
  <Card variant="glass">
    <CardHeader className="space-y-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = () => (
  <Card variant="glass">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-24 mt-3" />
    </CardContent>
  </Card>
);

export const ListItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="h-12 w-12 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <div className="text-right space-y-2">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <Card variant="glass">
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <div className="h-48 flex items-end justify-between gap-2 mb-4 px-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-lg" 
            style={{ height: `${Math.random() * 60 + 30}%` }} 
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    <div className="flex gap-4 p-3 border-b border-border/50">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-24 w-full" />
    </div>
    <Skeleton className="h-10 w-32" />
  </div>
);

export const ProfileSkeleton = () => (
  <div className="flex items-center gap-4">
    <Skeleton className="h-16 w-16 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-8 p-6">
    <div className="text-center space-y-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
    </div>
    <div className="grid md:grid-cols-3 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <ChartSkeleton />
    <Card variant="glass">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={5} />
      </CardContent>
    </Card>
  </div>
);
