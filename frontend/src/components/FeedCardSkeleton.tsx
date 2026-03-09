import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="w-full aspect-video rounded-none" />
      <CardContent className="p-6">
        <Skeleton className="h-4 w-10 mb-2" />
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-4 w-full mb-1.5" />
        <Skeleton className="h-4 w-5/6 mb-1.5" />
        <Skeleton className="h-4 w-2/3 mb-5" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
