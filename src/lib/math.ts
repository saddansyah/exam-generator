// Math generator and calculators for Odd-Even test

export interface Equation {
	text: string;
	n: number;
	m: number;
	correctAnswer: "0" | "1";
}

/**
 * Generates an addition equation n + m, where n and m are random positive integers from 0 to 99.
 * Correct answer is '0' if the sum is even, and '1' if the sum is odd.
 */
export function generateEquation(): Equation {
	const n = Math.floor(Math.random() * 100);
	const m = Math.floor(Math.random() * 100);
	const sum = n + m;
	const correctAnswer = sum % 2 === 0 ? "0" : "1";

	return {
		text: `${n} + ${m}`,
		n,
		m,
		correctAnswer,
	};
}

/**
 * Calculates consistency as a percentage based on the coefficient of variation (CV)
 * of the total attempts (questions answered) per 30-second interval.
 * A low variance in workload cadence yields a consistency score closer to 100%.
 */
export function calculateConsistency(
	intervals: Array<{ correct: number; total: number }>,
): number {
	if (intervals.length <= 1) {
		return 100;
	}

	const attempts = intervals.map((i) => i.total);
	const sum = attempts.reduce((acc, val) => acc + val, 0);
	const mean = sum / attempts.length;

	if (mean === 0) {
		return 100;
	}

	// Calculate standard deviation
	const varianceSum = attempts.reduce((acc, val) => acc + (val - mean) ** 2, 0);
	const stdDev = Math.sqrt(varianceSum / attempts.length);

	// Coefficient of Variation = stdDev / mean
	const cv = stdDev / mean;

	// Consistency score represents stability: 100% means zero variation (completely consistent pace)
	const score = Math.max(0, 100 * (1 - cv));

	return Math.round(score);
}
