import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, RotateCcw } from "lucide-react";
import { z } from "zod";
import { PerformanceChart } from "@/components/performance-chart";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getExamRun } from "@/lib/storage";

const runDetailSearchSchema = z.object({
	interval: z.coerce
		.number()
		.refine((val) => [5, 10, 15, 30].includes(val))
		.catch(30),
});

export const Route = createFileRoute("/history/odd-even/$runId")({
	validateSearch: (search) => runDetailSearchSchema.parse(search),
	component: OddEvenRunDetail,
});

function OddEvenRunDetail() {
	const { runId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const run = getExamRun(runId, "odd-even");

	if (!run) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
				<Card className="max-w-md w-full text-center p-6">
					<CardHeader>
						<CardTitle>Run Not Found</CardTitle>
						<CardDescription>
							We couldn't find the history details for this run.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Link to="/history/odd-even">
							<Button className="w-full">Back to History</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xs">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
					<Link
						to="/history/odd-even"
						className="flex items-center gap-2 hover:opacity-90"
					>
						<ArrowLeft className="size-4 text-primary" />
						<div>
							<h1 className="text-sm font-bold">Drill Report</h1>
							<p className="text-[9px] text-muted-foreground uppercase font-medium">
								Odd-Even Test Details
							</p>
						</div>
					</Link>
					<Link
						to="/exam/odd-even"
						search={{
							stage: "config",
							duration: run.config.durationSeconds,
							sessions: run.config.numSessions,
							currentSession: 1,
						}}
					>
						<Button size="sm" variant="outline" className="gap-1.5">
							<RotateCcw className="size-3.5" />
							Retake Drill
						</Button>
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
				<div className="flex flex-col gap-1.5 border-b pb-4">
					<h2 className="text-2xl font-bold tracking-tight">
						Performance Summary
					</h2>
					<div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Calendar className="size-3.5" />
							{new Date(run.date).toLocaleString()}
						</span>
						<span className="flex items-center gap-1">
							<Clock className="size-3.5" />
							{run.config.numSessions} sessions × {run.config.durationSeconds}s
						</span>
					</div>
				</div>

				{/* Detailed Stats Cards */}
				<div className="grid grid-cols-3 gap-4">
					<Card>
						<div className="text-center p-4">
							<span className="text-[10px] font-semibold text-muted-foreground uppercase">
								Correct Score
							</span>
							<div className="mt-1.5 text-2xl font-bold text-primary">
								<span>{run.totalCorrect}</span>
								<span className="text-muted-foreground text-sm font-normal">
									{"/"}
									{run.totalQuestions}
								</span>
							</div>
						</div>
					</Card>

					<Card>
						<div className="text-center p-4">
							<span className="text-[10px] font-semibold text-muted-foreground uppercase">
								Accuracy
							</span>
							<div className="mt-1.5 text-2xl font-bold text-primary">
								{run.accuracy}%
							</div>
						</div>
					</Card>

					<Card>
						<div className="text-center p-4">
							<span className="text-[10px] font-semibold text-muted-foreground uppercase">
								Consistency
							</span>
							<div className="mt-1.5 text-2xl font-bold text-primary">
								{run.consistency}%
							</div>
						</div>
					</Card>
				</div>

				{/* Chart (Now fully spreads across max-w-3xl for optimal viewing) */}
				<PerformanceChart
					sessions={run.sessions}
					durationSeconds={run.config.durationSeconds}
					intervalLength={search.interval}
					onIntervalLengthChange={(val) =>
						navigate({ search: { interval: val } })
					}
				/>

				{/* Extra Metadata */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-semibold">
							Test Parameters
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-xs text-muted-foreground">
						<div className="flex justify-between border-b pb-2">
							<span>Average response speed:</span>
							<span className="font-semibold text-foreground">
								{run.totalQuestions > 0
									? `${Math.round(
											run.sessions
												.flatMap((s) => s.answers)
												.reduce((acc, a) => acc + a.responseTimeMs, 0) /
												run.totalQuestions,
										)} ms`
									: "N/A"}
							</span>
						</div>
						<div className="flex justify-between border-b pb-2">
							<span>Attempt count:</span>
							<span className="font-semibold text-foreground">
								{run.totalQuestions} questions
							</span>
						</div>
						<div className="flex justify-between">
							<span>Total elapsed time:</span>
							<span className="font-semibold text-foreground">
								{run.config.numSessions * run.config.durationSeconds} seconds
							</span>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
