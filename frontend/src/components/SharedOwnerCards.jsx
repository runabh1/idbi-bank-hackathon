import React from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

// --- Mocking Shadcn UI Components for Radar Chart to avoid requiring new dependencies ---
export const Card = ({ className, children }) => (
  <div className={`bg-white text-gray-950 ${className || ''}`}>{children}</div>
)
export const CardHeader = ({ className, children }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>{children}</div>
)
export const CardTitle = ({ className, children }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className || ''}`}>{children}</h3>
)
export const CardDescription = ({ className, children }) => (
  <p className={`text-sm text-gray-500 ${className || ''}`}>{children}</p>
)
export const CardContent = ({ className, children }) => (
  <div className={`p-6 pt-0 ${className || ''}`}>{children}</div>
)
export const CardFooter = ({ className, children }) => (
  <div className={`flex items-center p-6 pt-0 ${className || ''}`}>{children}</div>
)
export const ChartContainer = ({ config, className, children }) => (
  <div className={className} style={{ '--color-desktop': config.desktop.color }}>
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
)

export const ChartTooltipContent = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-md z-50 relative">
        <div className="grid gap-1.5">
          {label && <span className="text-xs text-gray-500 font-semibold capitalize">{label}</span>}
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: entry.color || entry.fill }} />
                <span className="font-medium text-gray-700 text-sm">{entry.name === 'value' ? 'Score' : entry.name || 'Score'}</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function ChartRadarDots({ data, t }) {
  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "#000000",
    },
  }

  return (
    <Card className="h-full flex flex-col justify-center">
      <CardHeader className="items-center pb-2">
        <CardTitle>{t?.profileAnalysis || "Profile Analysis"}</CardTitle>
        <CardDescription>
          Detailed analysis across 5 key metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full h-[300px]"
        >
          <RadarChart data={data} outerRadius="65%" margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
            <Tooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <PolarGrid />
            <Radar
              dataKey="value"
              fill="var(--color-desktop)"
              fillOpacity={0.15}
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                r: 4,
                fillOpacity: 1,
                fill: '#000'
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm mt-4">
        <div className="flex items-center gap-2 leading-none font-medium">
          {t?.trendingUp || "Trending up by 5.2% this month"} <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function StatCard({ label, value, sub, tooltip }) {
  return (
    <div className="bg-gray-50/50 rounded-[20px] p-5 border border-gray-100 flex flex-col justify-between transition-colors hover:bg-gray-100/50">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {tooltip && (
          <div className="group relative flex items-center cursor-help">
            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[9px] font-bold hover:bg-gray-200 transition-colors">?</div>
            <div className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] text-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-md text-xs font-semibold text-gray-600 pointer-events-none">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
