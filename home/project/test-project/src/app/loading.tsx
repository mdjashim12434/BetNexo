import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingMatchCard() {
    return (
        <Card className="p-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex items-center justify-between gap-2 mb-2">
                <Skeleton className="h-6 w-2/5" />
                <Skeleton className="h-6 w-1/5" />
                <Skeleton className="h-6 w-2/5" />
            </div>
            <Skeleton className="h-4 w-1/3 mx-auto" />
        </Card>
    );
}

export default function Loading() {
  return (
    <AppLayout>
        <div className="container py-6">
            <div className="space-y-4 md:space-y-6 pb-24">
                {/* Skeletons for top navs and banners */}
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-28 w-full" />

                {/* Skeletons for matches */}
                <div className="space-y-6">
                    <section>
                        <div className="mb-2 flex justify-between items-center">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                        <div className="space-y-3">
                            <LoadingMatchCard />
                            <LoadingMatchCard />
                        </div>
                    </section>
                    <section>
                         <div className="mb-2 flex justify-between items-center">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                        <div className="space-y-3">
                            <LoadingMatchCard />
                            <LoadingMatchCard />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </AppLayout>
  );
}
