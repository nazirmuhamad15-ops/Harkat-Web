import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[150px]" />
        <div className="flex items-center space-x-2">
           <Skeleton className="h-8 w-[140px]" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-[100px]" /></CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
           <CardHeader>
              <Skeleton className="h-4 w-[150px] mb-2" />
              <Skeleton className="h-3 w-[200px]" />
           </CardHeader>
           <CardContent>
              <Skeleton className="h-[250px] w-full" />
           </CardContent>
        </Card>
        <Card className="shadow-sm">
           <CardHeader>
              <Skeleton className="h-4 w-[150px] mb-2" />
              <Skeleton className="h-3 w-[200px]" />
           </CardHeader>
           <CardContent>
              <Skeleton className="h-[250px] w-full" />
           </CardContent>
        </Card>
        <Card className="shadow-sm lg:col-span-2">
           <CardHeader>
              <Skeleton className="h-4 w-[150px] mb-2" />
              <Skeleton className="h-3 w-[200px]" />
           </CardHeader>
           <CardContent>
              <Skeleton className="h-[200px] w-full" />
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
