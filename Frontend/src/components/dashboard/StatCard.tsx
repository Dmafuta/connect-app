import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface SparkData { v: number }

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  accent?: string;  // tailwind text color class
  spark?: SparkData[];
  sparkColor?: string;
  icon?: React.ElementType;
}

export default function StatCard({
  label, value, sub, trend, trendValue, accent = "text-brand-red",
  spark, sparkColor = "#e8002e", icon: Icon,
}: Props) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground";

  return (
    <div className="flex flex-col justify-between rounded-none border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-2 font-display text-3xl font-semibold leading-none", accent)}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {Icon && (
          <span className={cn("rounded-none border border-border p-2", accent)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      {spark && spark.length > 0 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ display: "none" }}
                cursor={{ stroke: sparkColor, strokeWidth: 1 }}
              />
              <Area
                type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5}
                fill={`url(#sg-${label})`} dot={false} isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {trendValue && (
        <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {trendValue}
        </div>
      )}
    </div>
  );
}
