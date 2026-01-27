'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"

// Types
interface ChartDataPoint {
  name: string
  sales: number
  revenue: number
}

interface PieDataPoint {
  name: string
  value: number
  fill: string
}

interface DashboardChartsProps {
  salesChartData: ChartDataPoint[]
  productPieData: { name: string; value: number }[]
}

// Chart Config for Theming
const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-2)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export default function DashboardCharts({ salesChartData, productPieData }: DashboardChartsProps) {
  
  // Enhance Pie Data with Chart Colors
  const pieDataWithColors = productPieData.map((item, index) => ({
    ...item,
    fill: `var(--chart-${(index % 5) + 1})`,
  }))

  const pieConfig = Object.fromEntries(
    productPieData.map((item, index) => [
      item.name,
      {
        label: item.name,
        color: `var(--chart-${(index % 5) + 1})`,
      },
    ])
  ) satisfies ChartConfig

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* AREA CHART - Sales & Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>
            Showing total revenue and sales for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={salesChartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="var(--color-revenue)"
                fillOpacity={0.4}
                stroke="var(--color-revenue)"
                stackId="a"
              />
              <Area
                dataKey="sales"
                type="natural"
                fill="var(--color-sales)"
                fillOpacity={0.4}
                stroke="var(--color-sales)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* PIE CHART - Top Products */}
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Top Products</CardTitle>
          <CardDescription>By Sales Volume</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={pieConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={pieDataWithColors}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {productPieData.reduce((acc, curr) => acc + curr.value, 0)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-xs"
                          >
                            Sold
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
           <div className="flex items-center gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Displaying top selling products distribution
          </div>
        </CardFooter>
      </Card>

      {/* BAR CHART - Orders per Period (Full Width) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Orders Overview</CardTitle>
          <CardDescription>Total orders processed per period</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
            <BarChart accessibilityLayer data={salesChartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  )
}
