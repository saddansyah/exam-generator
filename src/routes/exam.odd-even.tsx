import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Clock,
	Play,
	RotateCcw,
	Settings,
	Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { PerformanceChart } from "@/components/performance-chart";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	calculateConsistency,
	type Equation,
	generateEquation,
} from "@/lib/math";
import type { AnswerLog, ExamRun, SessionResult } from "@/lib/storage";
import { getExamRun, saveExamRun } from "@/lib/storage";

function generateUUID(): string {
	return `run-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
}

const examSearchSchema = z.object({
	stage: z.enum(["config", "testing", "break", "results"]).catch("config"),
	duration: z.coerce
		.number()
		.refine((val) => [30, 60, 120].includes(val))
		.catch(30),
	sessions: z.coerce.number().int().min(1).max(10).catch(3),
	currentSession: z.coerce.number().int().min(1).catch(1),
	runId: z.string().optional(),
});

type ExamSearch = z.infer<typeof examSearchSchema>;

export const Route = createFileRoute("/exam/odd-even")({
	validateSearch: (search) => examSearchSchema.parse(search),
	component: OddEvenExam,
});

const TEMP_STORAGE_KEY = "exam_generator_active_run";

function OddEvenExam() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const [equation, setEquation] = useState<Equation | null>(null);
	const [buttonOrder, setButtonOrder] = useState<("0" | "1")[]>(["0", "1"]);
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const sessionAnswersRef = useRef<AnswerLog[]>([]);
	const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
		null,
	);

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
	const questionStartTimeRef = useRef<number>(0);
	const sessionStartTimeRef = useRef<number>(0);

	const [breakTimeLeft, setBreakTimeLeft] = useState<number>(10);
	const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

	const updateSearch = (newSearch: Partial<ExamSearch>) => {
		navigate({
			search: (prev) => ({ ...prev, ...newSearch }),
		});
	};

	const nextQuestion = () => {
		setEquation(generateEquation());
		questionStartTimeRef.current = performance.now();
		setButtonOrder(Math.random() < 0.8 ? ["0", "1"] : ["1", "0"]);
	};

	const handleSessionFinished = () => {
		let accumulated: SessionResult[] = [];
		try {
			const raw = localStorage.getItem(TEMP_STORAGE_KEY);
			if (raw) accumulated = JSON.parse(raw);
		} catch (e) {
			console.error("Failed to parse temporary storage", e);
		}

		const currentSessionResult: SessionResult = {
			sessionId: search.currentSession,
			answers: sessionAnswersRef.current,
		};
		const updatedAccumulated = [...accumulated, currentSessionResult];
		localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(updatedAccumulated));

		if (search.currentSession < search.sessions) {
			updateSearch({ stage: "break" });
		} else {
			const allAnswers = updatedAccumulated.flatMap((s) => s.answers);
			const totalQuestions = allAnswers.length;
			const totalCorrect = allAnswers.filter((a) => a.isCorrect).length;
			const accuracy =
				totalQuestions > 0
					? Math.round((totalCorrect / totalQuestions) * 100)
					: 0;

			const intervalLength = 30;
			const durationSec = search.duration;
			const intervalsPerSession = Math.ceil(durationSec / intervalLength);
			const intervalPerformance: { correct: number; total: number }[] = [];

			updatedAccumulated.forEach((sess) => {
				for (let i = 0; i < intervalsPerSession; i++) {
					const start = i * intervalLength;
					const end = Math.min((i + 1) * intervalLength, durationSec);
					const answers = sess.answers.filter(
						(a) =>
							a.durationFromSessionStart >= start &&
							a.durationFromSessionStart < end,
					);
					intervalPerformance.push({
						correct: answers.filter((a) => a.isCorrect).length,
						total: answers.length,
					});
				}
			});

			const consistency = calculateConsistency(intervalPerformance);
			const runId = generateUUID();

			const newRun: ExamRun = {
				id: runId,
				date: new Date().toISOString(),
				type: "odd-even",
				config: {
					durationSeconds: durationSec,
					numSessions: search.sessions,
					isSecondsMode: true,
				},
				sessions: updatedAccumulated,
				totalCorrect,
				totalQuestions,
				accuracy,
				consistency,
			};

			saveExamRun(newRun);
			localStorage.removeItem(TEMP_STORAGE_KEY);
			updateSearch({ stage: "results", runId });
		}
	};

	const startActiveSession = () => {
		setTimeLeft(search.duration);
		sessionAnswersRef.current = [];
		setFeedback(null);
		sessionStartTimeRef.current = Date.now();

		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					if (timerRef.current) {
						clearInterval(timerRef.current);
					}
					handleSessionFinished();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		nextQuestion();
	};

	const handleAnswer = (userAnswer: "0" | "1") => {
		if (!equation) return;

		const now = performance.now();
		const responseTimeMs = Math.round(now - questionStartTimeRef.current);
		const durationFromSessionStart = Math.round(
			(Date.now() - sessionStartTimeRef.current) / 1000,
		);
		const isCorrect = equation.correctAnswer === userAnswer;

		setFeedback(isCorrect ? "correct" : "incorrect");
		if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
		feedbackTimerRef.current = setTimeout(() => setFeedback(null), 200);

		const logItem: AnswerLog = {
			question: equation.text,
			n: equation.n,
			m: equation.m,
			userAnswer,
			correctAnswer: equation.correctAnswer,
			isCorrect,
			responseTimeMs,
			timestamp: Date.now(),
			durationFromSessionStart,
		};

		sessionAnswersRef.current.push(logItem);
		nextQuestion();
	};

	useEffect(() => {
		if (search.stage === "testing") {
			startActiveSession();
		}

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
		};
	}, [search.stage, search.currentSession]);

	useEffect(() => {
		if (search.stage === "break") {
			setBreakTimeLeft(10);
			if (breakTimerRef.current) clearInterval(breakTimerRef.current);

			breakTimerRef.current = setInterval(() => {
				setBreakTimeLeft((prev) => {
					if (prev <= 1) {
						if (breakTimerRef.current) {
							clearInterval(breakTimerRef.current);
						}
						updateSearch({
							stage: "testing",
							currentSession: search.currentSession + 1,
						});
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (breakTimerRef.current) clearInterval(breakTimerRef.current);
		};
	}, [search.stage]);

	const handleAbort = () => {
		if (
			confirm("Abort practice test? Your progress for this drill will be lost.")
		) {
			localStorage.removeItem(TEMP_STORAGE_KEY);
			updateSearch({ stage: "config" });
		}
	};

	const formatTime = (sec: number) => {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	// Component
	const renderContent = () => {
		switch (search.stage) {
			case "config":
				return (
					<div className="max-w-xl mx-auto">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-1.5">
									<Sparkles className="size-4 text-emerald-500" />
									Odd-Even Practice Setup
								</CardTitle>
								<CardDescription>
									Configure duration and total session counts.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<span className="text-xs font-semibold text-muted-foreground uppercase block">
											Session Duration
										</span>
										<Select
											value={search.duration.toString()}
											onValueChange={(val) =>
												updateSearch({ duration: Number(val) })
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select duration" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="30">30 Seconds</SelectItem>
												<SelectItem value="60">60 Seconds</SelectItem>
												<SelectItem value="120">120 Seconds</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<span className="text-xs font-semibold text-muted-foreground uppercase block">
											Total Sessions
										</span>
										<Select
											value={search.sessions.toString()}
											onValueChange={(val) =>
												updateSearch({ sessions: Number(val) })
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select sessions" />
											</SelectTrigger>
											<SelectContent>
												{Array.from({ length: 10 }).map((_, i) => {
													const valStr = (i + 1).toString();
													return (
														<SelectItem key={valStr} value={valStr}>
															{i + 1} {i === 0 ? "Session" : "Sessions"}
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="rounded-lg border bg-muted/30 p-4 flex gap-3 text-xs text-muted-foreground">
									<AlertCircle className="size-4 text-primary shrink-0" />
									<div className="space-y-1">
										<h4 className="font-semibold text-foreground">
											How to Play:
										</h4>
										<p>
											1. An equation like <strong>n + m</strong> is presented.
										</p>
										<p>
											2. If the result is <strong>EVEN</strong>, click{" "}
											<strong className="text-emerald-500 font-bold">0</strong>.
										</p>
										<p>
											3. If the result is <strong>ODD</strong>, click{" "}
											<strong className="text-violet-500 font-bold">1</strong>.
										</p>
									</div>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between gap-3 border-t pt-4">
								<Link to="/">
									<Button variant="outline" className="gap-1.5">
										<ArrowLeft className="size-4" />
										Dashboard
									</Button>
								</Link>
								<Button
									onClick={() => {
										localStorage.removeItem(TEMP_STORAGE_KEY);
										updateSearch({ stage: "testing", currentSession: 1 });
									}}
									className="gap-1.5 flex-1 max-w-[200px]"
								>
									<Play className="size-4 fill-current" />
									Start Drill
								</Button>
							</CardFooter>
						</Card>
					</div>
				);

			case "testing":
				return (
					<div className="max-w-xl mx-auto space-y-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
								<span className="text-sm font-semibold">
									Session {search.currentSession} of {search.sessions}
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-lg font-bold font-mono">
								<Clock className="size-4 text-muted-foreground" />
								{formatTime(timeLeft)}
							</div>
						</div>

						<div
							className={`flex flex-col items-center justify-center p-12 text-center transition-all rounded-lg border bg-card text-card-foreground shadow-sm ${
								feedback === "correct"
									? "border-emerald-500 bg-emerald-500/5"
									: feedback === "incorrect"
										? "border-rose-500 bg-rose-500/5"
										: ""
							}`}
						>
							<div className="text-5xl font-extrabold font-mono select-none my-6">
								{equation?.text || "Generating..."}
							</div>

							<div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[300px]">
								{buttonOrder.map((btn) =>
									btn === "0" ? (
										<Button
											key="btn-0"
											size="lg"
											variant="outline"
											onClick={() => handleAnswer("0")}
											className="h-20 flex-col gap-1 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5"
										>
											<span className="text-2xl font-extrabold">0</span>
										</Button>
									) : (
										<Button
											key="btn-1"
											size="lg"
											variant="outline"
											onClick={() => handleAnswer("1")}
											className="h-20 flex-col gap-1 border-violet-500/20 text-violet-500 hover:bg-violet-500/5"
										>
											<span className="text-2xl font-extrabold">1</span>
										</Button>
									),
								)}
							</div>
						</div>

						<div className="flex justify-center">
							<Button variant="outline" onClick={handleAbort}>
								Cancel Test
							</Button>
						</div>
					</div>
				);

			case "break":
				return (
					<div className="max-w-md mx-auto text-center">
						<Card>
							<CardHeader className="items-center">
								<Clock className="size-8 text-violet-500 animate-pulse mb-2" />
								<CardTitle>Take a Break</CardTitle>
								<CardDescription>
									Session {search.currentSession} completed. Rest your mind.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-4xl font-extrabold font-mono text-violet-500">
									{breakTimeLeft}s
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Next session starts automatically
								</p>
							</CardContent>
							<CardFooter className="flex gap-3 justify-center">
								<Button
									variant="outline"
									onClick={handleAbort}
									className="flex-1"
								>
									Exit Test
								</Button>
								<Button
									onClick={() => {
										if (breakTimerRef.current)
											clearInterval(breakTimerRef.current);
										updateSearch({
											stage: "testing",
											currentSession: search.currentSession + 1,
										});
									}}
									className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
								>
									Skip Break
								</Button>
							</CardFooter>
						</Card>
					</div>
				);

			case "results": {
				const run = search.runId ? getExamRun(search.runId) : null;

				if (!run) {
					return (
						<div className="max-w-md mx-auto text-center">
							<Card>
								<CardHeader className="items-center">
									<AlertCircle className="size-10 text-rose-500 mb-2" />
									<CardTitle>Results Not Found</CardTitle>
									<CardDescription>
										Could not locate the practice run results in storage.
									</CardDescription>
								</CardHeader>
								<CardFooter className="justify-center">
									<Link
										to="/exam/odd-even"
										search={{
											stage: "config",
											duration: search.duration,
											sessions: search.sessions,
											currentSession: 1,
										}}
									>
										<Button>Back to Settings</Button>
									</Link>
								</CardFooter>
							</Card>
						</div>
					);
				}

				return (
					<div className="max-w-2xl mx-auto space-y-6">
						<div className="text-center space-y-1">
							<h2 className="text-2xl font-bold tracking-tight">
								Practice Complete!
							</h2>
							<p className="text-sm text-muted-foreground">
								Practice report results
							</p>
						</div>

						<div className="grid grid-cols-3 gap-3">
							<Card>
								<div className="text-center p-3">
									<span className="text-[10px] font-semibold text-muted-foreground uppercase">
										Correct Score
									</span>
									<div className="mt-1 text-xl font-bold text-emerald-500">
										{run.totalCorrect}
										<span className="text-muted-foreground text-sm font-normal">
											/{run.totalQuestions}
										</span>
									</div>
								</div>
							</Card>

							<Card>
								<div className="text-center p-3">
									<span className="text-[10px] font-semibold text-muted-foreground uppercase">
										Accuracy
									</span>
									<div className="mt-1 text-xl font-bold text-emerald-500">
										{run.accuracy}%
									</div>
								</div>
							</Card>

							<Card>
								<div className="text-center p-3">
									<span className="text-[10px] font-semibold text-muted-foreground uppercase">
										Consistency
									</span>
									<div className="mt-1 text-xl font-bold text-violet-500">
										{run.consistency}%
									</div>
								</div>
							</Card>
						</div>

						<PerformanceChart
							sessions={run.sessions}
							durationSeconds={run.config.durationSeconds}
						/>

						<div className="flex justify-between gap-3 border-t pt-4">
							<Link to="/">
								<Button variant="outline" className="gap-1.5">
									<ArrowLeft className="size-4" />
									Dashboard
								</Button>
							</Link>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => updateSearch({ stage: "config" })}
									className="gap-1.5"
								>
									<Settings className="size-4" />
									Settings
								</Button>
								<Button
									onClick={() => {
										localStorage.removeItem(TEMP_STORAGE_KEY);
										updateSearch({ stage: "testing", currentSession: 1 });
									}}
									className="gap-1.5"
								>
									<RotateCcw className="size-4" />
									Restart
								</Button>
							</div>
						</div>
					</div>
				);
			}
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xs">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
					<Link to="/" className="flex items-center gap-2 hover:opacity-90">
						<ArrowLeft className="size-4 text-primary" />
						<div>
							<h1 className="text-sm font-bold">Practice Portal</h1>
							<p className="text-[9px] text-muted-foreground uppercase font-medium">
								Odd-Even Test Mode
							</p>
						</div>
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-4 py-8">{renderContent()}</main>
		</div>
	);
}
