import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton (IKEA Style) */}
      <div className="relative h-[500px] w-full bg-stone-100 animate-pulse mb-8 overflow-hidden">
         <div className="absolute inset-0 bg-linear-to-t from-stone-200/50 to-transparent" />
         <div className="container mx-auto px-6 h-full flex flex-col justify-center relative z-10">
             <Skeleton className="h-12 w-64 md:w-96 mb-4 bg-stone-300/50" />
             <Skeleton className="h-6 w-48 md:w-80 mb-8 bg-stone-300/50" />
             <Skeleton className="h-10 w-32 rounded-full bg-stone-300" />
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Tiles Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="aspect-4/3 w-full rounded-none bg-stone-100" />
                    <Skeleton className="h-4 w-24 bg-stone-100" />
                </div>
            ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex justify-between items-end mb-8">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-stone-100" />
                <Skeleton className="h-8 w-48 bg-stone-200" />
            </div>
            <div className="flex gap-2">
                 <Skeleton className="h-10 w-40 rounded-full bg-stone-100" />
                 <Skeleton className="h-10 w-32 rounded-full bg-stone-100" />
            </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-4">
              <Skeleton className="aspect-square w-full rounded-none bg-stone-100" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 bg-stone-200" />
                <Skeleton className="h-4 w-1/2 bg-stone-100" />
                <div className="pt-2">
                    <Skeleton className="h-8 w-24 bg-stone-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
