import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Award,
  Clock,
  Play,
  Trash2,
  TrendingUp,
  Zap,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getExamHistory,
  getOverallStats,
  clearHistory,
  type ExamRun,
} from "@/lib/storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/history/odd-even/")({
  component: OddEvenHistoryList,
});

function OddEvenHistoryList() {
  const [history, setHistory] = useState<ExamRun[]>(() => getExamHistory("odd-even"));

  const handleClearHistory = () => {
    if (
      confirm(
        "Are you sure you want to delete all Odd-Even practice history? This action cannot be undone."
      )
    ) {
      clearHistory("odd-even");
      setHistory([]);
    }
  };

  const stats = getOverallStats("odd-even");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90">
            <ArrowLeft className="size-4 text-primary" />
            <div>
              <h1 className="text-sm font-bold">Practice History</h1>
              <p className="text-[9px] text-muted-foreground uppercase font-medium">
                Odd-Even Test
              </p>
            </div>
          </Link>
          <Link
            to="/exam/odd-even"
            search={{
              stage: "config",
              duration: 30,
              sessions: 3,
              currentSession: 1,
            }}
          >
            <Button size="sm" className="gap-1.5">
              <Play className="size-3.5 fill-current" />
              New Drill
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Odd-Even History</h2>
            <p className="text-sm text-muted-foreground">
              Review and analyze your cognitive performance over time.
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-fit"
            >
              <Trash2 className="size-3.5 mr-1" />
              Clear History
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Activity className="size-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No History Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You haven't completed any Odd-Even drill yet.
            </p>
            <Link
              to="/exam/odd-even"
              search={{
                stage: "config",
                duration: 30,
                sessions: 3,
                currentSession: 1,
              }}
            >
              <Button>Configure & Start First Drill</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Drills
                  </span>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">{stats.totalRuns}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Avg Accuracy
                  </span>
                  <Award className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    {stats.avgAccuracy}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Avg Consistency
                  </span>
                  <Activity className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    {stats.avgConsistency}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Avg Speed
                  </span>
                  <Zap className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    {stats.avgSpeed}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      QPM
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Practice Runs</CardTitle>
                <CardDescription>
                  Select a run to view detailed session analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="px-4 py-3">Date</TableHead>
                      <TableHead className="px-4 py-3">Setup</TableHead>
                      <TableHead className="px-4 py-3 text-right">Attempts</TableHead>
                      <TableHead className="px-4 py-3 text-right">Accuracy</TableHead>
                      <TableHead className="px-4 py-3 text-right">Consistency</TableHead>
                      <TableHead className="px-4 py-3 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="px-4 py-3 font-medium">
                          {new Date(run.date).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {run.config.numSessions}s ×{" "}
                            {run.config.durationSeconds >= 60
                              ? `${run.config.durationSeconds / 60}m`
                              : `${run.config.durationSeconds}s`}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className="text-emerald-500 font-semibold">
                            {run.totalCorrect}
                          </span>
                          <span className="text-muted-foreground font-normal">
                            /{run.totalQuestions}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold text-emerald-500">
                          {run.accuracy}%
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold text-violet-500">
                          {run.consistency}%
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Link
                            to="/history/odd-even/$runId"
                            params={{ runId: run.id }}
                          >
                            <Button variant="ghost" size="sm" className="gap-1.5 text-primary font-medium">
                              <Eye className="size-3.5" />
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
