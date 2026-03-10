import { StanceLabel } from "@prisma/client";
import { prisma } from "@/lib/db";

// Very lightweight stance heuristic that can later be replaced by LLM/embeddings.

const yesKeywords = ["bullish", "up", "beat", "win", "higher", "through", "above", "breakout", "favorable", "optimistic"];
const noKeywords = ["bearish", "down", "miss", "lose", "lower", "below", "dump", "risk-off", "unfavorable", "pessimistic"];

function classifyHeuristic(text: string): { label: StanceLabel; confidence: number } {
  const lower = text.toLowerCase();
  let yesScore = 0;
  let noScore = 0;

  for (const kw of yesKeywords) {
    if (lower.includes(kw)) yesScore += 1;
  }
  for (const kw of noKeywords) {
    if (lower.includes(kw)) noScore += 1;
  }

  if (yesScore === 0 && noScore === 0) {
    return { label: StanceLabel.NEUTRAL, confidence: 0.4 };
  }

  if (yesScore > noScore) {
    const confidence = Math.min(0.9, 0.6 + (yesScore - noScore) * 0.1);
    return { label: StanceLabel.YES, confidence };
  }

  if (noScore > yesScore) {
    const confidence = Math.min(0.9, 0.6 + (noScore - yesScore) * 0.1);
    return { label: StanceLabel.NO, confidence };
  }

  return { label: StanceLabel.NEUTRAL, confidence: 0.5 };
}

export async function classifyStanceForMatches() {
  const matches = await prisma.marketPostMatch.findMany({
    where: {
      manualOverride: false,
    },
    include: {
      post: true,
    },
    take: 200,
  });

  for (const match of matches) {
    const { label, confidence } = classifyHeuristic(match.post.text);
    await prisma.marketPostMatch.update({
      where: { id: match.id },
      data: {
        stanceLabel: label,
        stanceConfidence: confidence,
        stanceMethod: "heuristic_v1",
      },
    });
  }
}

