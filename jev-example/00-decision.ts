/**
 * Example: Zev-1 decision (判断 / 选择 / 评分)
 *
 * One request mixes all three question types against the same state, then the
 * code reads each answer by its question name and branches on its type.
 */
import {
	ZEV_MODEL,
	choice,
	formatPercent,
	getChoice,
	getNoul,
	getScore,
	noul,
	printJson,
	printMode,
	score,
	section,
	systemOne,
	ZevAnswerError,
	ZevUnavailableError,
} from "./shared/jev.ts";

// Uncalibrated demo thresholds: pick these by evaluating on your own data
const REFUND_CONFIDENCE_THRESHOLD = 0.75;
const URGENT_SCORE_THRESHOLD = 2;

const req = {
	model: ZEV_MODEL,
	state: "我上周申请了退款，请帮我查询一下处理进度。",
	questions: {
		billing: noul("这条消息是否与账单或退款有关？", {
			true: "涉及付款、账单或退款",
			false: "仅涉及产品使用或技术支持",
		}),
		category: choice("这条客户留言属于哪一类？", {
			billing: "账单、付款或退款问题",
			technical: "产品使用或技术问题",
			other: "其他问题",
		}),
		urgency: score("评估需要处理的紧急程度。", [
			"可以等待",
			"本周需要处理",
			"今天需要处理",
		]),
	},
};

printMode();
section("Zev-1 decision");
printJson("Request", req);

let res;
try {
	res = await systemOne(req);
} catch (err) {
	if (err instanceof ZevUnavailableError) {
		console.log(`→ Zev-1 unavailable (${err.message}), falling back to manual review`);
		process.exit(0);
	}
	throw err;
}

try {
	printJson("Answers", res.answers);

	const billingProbability = getNoul(res, req, "billing");
	const category = getChoice(res, req, "category");
	const urgency = getScore(res, req, "urgency");

	console.log(`\n${"判断 billing:".padEnd(18)}P(yes) ${formatPercent(billingProbability)}`);
	console.log(`${"选择 category:".padEnd(18)}${category.choice} (confidence ${formatPercent(category.confidence)})`, category.probabilities);
	console.log(`${"评分 urgency:".padEnd(18)}score ${urgency.score.toFixed(2)} (confidence ${formatPercent(urgency.confidence)})`, urgency.legend);

	// Decisions owned by code, not by the model's raw output
	const isRefund = billingProbability >= REFUND_CONFIDENCE_THRESHOLD;
	const urgent = urgency.score >= URGENT_SCORE_THRESHOLD;
	console.log(`\n→ ${isRefund ? "进入退款流程" : "不进入退款流程"}`);
	console.log(`→ ${urgent ? "优先处理" : "常规处理"}`);
} catch (err) {
	if (err instanceof ZevAnswerError) {
		console.log(`→ Answer validation failed (${err.message}), falling back to manual review`);
		process.exit(0);
	}
	throw err;
}
