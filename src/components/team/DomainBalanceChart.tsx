"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ErrorBoundary } from "@/components/effects/ErrorBoundary";
import type { DomainSlug } from "@/constants/strengths-data";

interface DomainData {
  domain: DomainSlug;
  domainName: string;
  color: string;
  count: number;
  percentage: number;
}

interface DomainBalanceChartProps {
  data: DomainData[];
  title?: string;
  description?: string;
}

const DOMAIN_COLORS: Record<DomainSlug, string> = {
  executing: "#7B68EE",
  influencing: "#F5A623",
  relationship: "#4A90D9",
  strategic: "#7CB342",
};

export function DomainBalanceChart({
  data,
  title = "Domain Balance",
  description = "Distribution of top 5 strengths across domains",
}: DomainBalanceChartProps) {
  const chartData = data.map((d) => ({
    name: d.domainName,
    value: d.count,
    percentage: d.percentage,
    domain: d.domain,
    color: DOMAIN_COLORS[d.domain],
  }));

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Build dynamic aria-label from chart data
  const ariaLabel = `${title} chart showing distribution of strengths across domains: ${data
    .map((d) => `${d.domainName} ${d.count} (${d.percentage}%)`)
    .join(", ")}. Total: ${totalCount}.`;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {data.value} themes ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-domain-executing via-domain-influencing to-domain-strategic" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorBoundary>
          <div role="img" aria-label={ariaLabel} className="h-[280px]" tabIndex={0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Visually-hidden data table for screen readers */}
          <table className="sr-only">
            <caption>{title} - {description}</caption>
            <thead>
              <tr>
                <th scope="col">Domain</th>
                <th scope="col">Count</th>
                <th scope="col">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.domain}>
                  <td>{d.domainName}</td>
                  <td>{d.count}</td>
                  <td>{d.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {data.map((d) => (
              <div
                key={d.domain}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <DomainIcon domain={d.domain} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.domainName}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.count} ({d.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Balance indicator */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total strengths analyzed</span>
              <span className="font-medium">{totalCount}</span>
            </div>
            <div className="flex gap-1 mt-2 h-2 rounded-full overflow-hidden">
              {data.map((d) => (
                <div
                  key={d.domain}
                  className="h-full transition-all"
                  style={{
                    width: `${d.percentage}%`,
                    backgroundColor: DOMAIN_COLORS[d.domain],
                  }}
                />
              ))}
            </div>
          </div>
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}
