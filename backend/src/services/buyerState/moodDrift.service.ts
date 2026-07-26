import type { ChatTurn } from "../../types/chat";
import type { MoodDrift } from "../../types/conversationState";
import { computeInterestScore } from "./interestScore.service";

const TREND_WINDOW_USER_TURNS = 3;
const TREND_THRESHOLD = 8;

function dropLastUserTurns(history: ChatTurn[], count: number): ChatTurn[] {
  let remaining = count;
  const result: ChatTurn[] = [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const turn = history[i];
    if (turn.sender === "user" && remaining > 0) {
      remaining -= 1;
      continue;
    }
    result.unshift(turn);
  }
  return result;
}

export function computeMoodDrift(history: ChatTurn[]): MoodDrift {
  const userTurnCount = history.filter((t) => t.sender === "user").length;
  if (userTurnCount <= TREND_WINDOW_USER_TURNS) {
    return { trend: "steady", guidance: "" };
  }

  const currentScore = computeInterestScore(history);
  const earlierHistory = dropLastUserTurns(history, TREND_WINDOW_USER_TURNS);
  const earlierScore = computeInterestScore(earlierHistory);
  const trendDelta = currentScore - earlierScore;

  if (trendDelta > TREND_THRESHOLD) {
    return {
      trend: "warming",
      guidance:
        "Compared to earlier in this call, you're warming up - sounding more engaged and a little more willing to extend trust than your base mood alone would suggest.",
    };
  }

  if (trendDelta < -TREND_THRESHOLD) {
    return {
      trend: "cooling",
      guidance:
        "Compared to earlier in this call, you're growing more impatient and skeptical than your base mood alone would suggest - this conversation hasn't been landing well.",
    };
  }

  return { trend: "steady", guidance: "" };
}
