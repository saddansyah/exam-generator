// LocalStorage manager and statistics analyzer

export interface AnswerLog {
	question: string;
	n: number;
	m: number;
	userAnswer: "0" | "1";
	correctAnswer: "0" | "1";
	isCorrect: boolean;
	responseTimeMs: number;
	timestamp: number;
	durationFromSessionStart: number; // in seconds
}

export interface SessionResult {
	sessionId: number;
	answers: AnswerLog[];
}

export interface ExamRun {
	id: string;
	date: string; // ISO string
	type: "odd-even";
	config: {
		durationSeconds: number;
		numSessions: number;
		isSecondsMode: boolean;
	};
	sessions: SessionResult[];
	totalCorrect: number;
	totalQuestions: number;
	accuracy: number; // percentage
	consistency: number; // percentage
}

const STORAGE_KEY_PREFIX = "exam_generator_history";

function getStorageKey(type: string): string {
	return `${STORAGE_KEY_PREFIX}_${type}`;
}

export function getExamHistory(type: string = "odd-even"): ExamRun[] {
	if (typeof window === "undefined") return [];
	const key = getStorageKey(type);
	try {
		let raw = localStorage.getItem(key);

		// Migration check: if the type-specific key doesn't exist but the old general key does, migrate it
		if (!raw && type === "odd-even") {
			const oldRaw = localStorage.getItem(STORAGE_KEY_PREFIX);
			if (oldRaw) {
				localStorage.setItem(key, oldRaw);
				// Clean up the legacy key
				localStorage.removeItem(STORAGE_KEY_PREFIX);
				raw = oldRaw;
			}
		}

		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error(
			`Failed to parse history for type ${type} from localStorage`,
			e,
		);
		return [];
	}
}

export function getExamRun(
	id: string,
	type: string = "odd-even",
): ExamRun | undefined {
	const history = getExamHistory(type);
	return history.find((run) => run.id === id);
}

export function saveExamRun(run: ExamRun): void {
	if (typeof window === "undefined") return;
	const type = run.type || "odd-even";
	const key = getStorageKey(type);
	try {
		const history = getExamHistory(type);
		history.unshift(run); // Add new run to the start of history
		localStorage.setItem(key, JSON.stringify(history));
	} catch (e) {
		console.error(`Failed to save exam run of type ${type} to localStorage`, e);
	}
}

export function clearHistory(type: string = "odd-even"): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(getStorageKey(type));
}

export interface OverallStats {
	totalRuns: number;
	totalQuestions: number;
	totalCorrect: number;
	avgAccuracy: number;
	avgConsistency: number;
	avgSpeed: number; // questions per minute
	historyData: {
		id: string;
		date: string;
		accuracy: number;
		consistency: number;
		speed: number;
	}[];
}

export function getOverallStats(type: string = "odd-even"): OverallStats {
	const history = getExamHistory(type);

	if (history.length === 0) {
		return {
			totalRuns: 0,
			totalQuestions: 0,
			totalCorrect: 0,
			avgAccuracy: 0,
			avgConsistency: 0,
			avgSpeed: 0,
			historyData: [],
		};
	}

	let totalQuestions = 0;
	let totalCorrect = 0;
	let totalAccuracySum = 0;
	let totalConsistencySum = 0;
	let totalSpeedSum = 0;

	const historyData = history
		.slice()
		.reverse()
		.map((run) => {
			totalQuestions += run.totalQuestions;
			totalCorrect += run.totalCorrect;
			totalAccuracySum += run.accuracy;
			totalConsistencySum += run.consistency;

			// Calculate speed: total questions answered / total active test duration (minutes)
			const totalDurationSeconds =
				run.config.durationSeconds * run.config.numSessions;
			const totalDurationMinutes = totalDurationSeconds / 60;
			const speed =
				totalDurationMinutes > 0
					? run.totalQuestions / totalDurationMinutes
					: 0;
			totalSpeedSum += speed;

			return {
				id: run.id,
				date: new Date(run.date).toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
				}),
				accuracy: run.accuracy,
				consistency: run.consistency,
				speed: Math.round(speed),
			};
		});

	const totalRuns = history.length;

	return {
		totalRuns,
		totalQuestions,
		totalCorrect,
		avgAccuracy: Math.round(totalAccuracySum / totalRuns),
		avgConsistency: Math.round(totalConsistencySum / totalRuns),
		avgSpeed: Math.round(totalSpeedSum / totalRuns),
		historyData,
	};
}
