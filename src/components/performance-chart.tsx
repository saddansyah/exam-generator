import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionResult } from "@/lib/storage";

interface PerformanceChartProps {
  sessions: SessionResult[];
  durationSeconds: number;
  intervalLength?: number;
  onIntervalLengthChange?: (val: number) => void;
}

const chartConfig = {
  correct: {
    label: "Correct",
    color: "#10b981", // emerald-500
  },
  incorrect: {
    label: "Incorrect",
    color: "#f43f5e", // rose-500
  },
} satisfies ChartConfig;

export function PerformanceChart({
  sessions,
  durationSeconds,
  intervalLength: controlledIntervalLength,
  onIntervalLengthChange,
}: PerformanceChartProps) {
  const [internalIntervalLength, setInternalIntervalLength] = useState<number>(30);

  const intervalLength = controlledIntervalLength !== undefined 
    ? controlledIntervalLength 
    : internalIntervalLength;

  const handleIntervalChange = (val: number) => {
    setInternalIntervalLength(val);
    onIntervalLengthChange?.(val);
  };


  // Group answers into variable length intervals
  const chartData = useMemo(() => {
    const data: {
      label: string;
      sessionNum: number;
      intervalNum: number;
      correct: number;
      incorrect: number;
      total: number;
    }[] = [];

    const intervalsPerSession = Math.ceil(durationSeconds / intervalLength);

    sessions.forEach((session) => {
      for (let i = 0; i < intervalsPerSession; i++) {
        const startSec = i * intervalLength;
        const endSec = Math.min((i + 1) * intervalLength, durationSeconds);

        const answersInInterval = session.answers.filter(
          (ans) =>
            ans.durationFromSessionStart >= startSec &&
            ans.durationFromSessionStart < endSec,
        );

        const correct = answersInInterval.filter((ans) => ans.isCorrect).length;
        const total = answersInInterval.length;
        const incorrect = total - correct;

        data.push({
          label: `S${session.sessionId} I${i + 1} (${startSec}-${endSec}s)`,
          sessionNum: session.sessionId,
          intervalNum: i + 1,
          correct,
          incorrect,
          total,
        });
      }
    });

    return data;
  }, [sessions, durationSeconds, intervalLength]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        No answer data to show in chart.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Performance Over Time
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Interval:</span>
              <Select
                value={intervalLength.toString()}
                onValueChange={(val) => handleIntervalChange(Number(val))}
              >
                <SelectTrigger className="h-7 w-18">
                  <SelectValue placeholder="30s" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="15">15s</SelectItem>
                  <SelectItem value="30">30s</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 text-[10px] font-medium border-l pl-3">
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Correct
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Incorrect
              </span>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[20vh]">
          <div className="absolute inset-0">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 5,
                }}
              >
              <CartesianGrid vertical={false} className="stroke-muted/30" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="fill-muted-foreground text-[9px]"
                tickFormatter={(value: string) => {
                  const match = value.match(/(S\d+ I\d+)/);
                  return match ? match[1] : value;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="fill-muted-foreground text-[10px]"
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="correct"
                stroke={chartConfig.correct.color}
                strokeWidth={2}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 0,
                }}
              />
              <Line
                type="monotone"
                dataKey="incorrect"
                stroke={chartConfig.incorrect.color}
                strokeWidth={2}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 0,
                }}
              />
            </LineChart>
          </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
