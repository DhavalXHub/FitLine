// Simple AI abstraction for the Gym Coach.
// If VITE_AI_ENDPOINT is set, it will POST the chat to that endpoint and expect { reply }.
// Otherwise, it will return a local heuristic response suitable for fitness coaching.

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are FitLine's AI Gym Coach. Be concise, encouraging, and specific.
- Give actionable advice on workouts, sets/reps, rest, progression.
- Adjust for experience level if provided. Ask one targeted follow-up when useful.
- Avoid medical claims; recommend consulting a professional for injuries or conditions.
- Use short bullet points when listing exercises.
`;

export type ProfileContext = {
  displayName?: string | null;
  age?: number | null;
  gender?: string | null;
  height?: number | null; // cm
  weight?: number | null; // kg
  fitnessGoal?: string | null;
  experienceLevel?: string | null;
  preferredWorkoutTime?: string | null;
} | null;

export async function askAICoach(
  userInput: string,
  history: ChatMessage[],
  profile: ProfileContext
): Promise<string> {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  const profileNote = profile
    ? `User profile (if available): name=${profile.displayName ?? ""}, age=${
        profile.age ?? ""
      }, gender=${profile.gender ?? ""}, height_cm=${profile.height ?? ""}, weight_kg=${
        profile.weight ?? ""
      }, goal=${profile.fitnessGoal ?? ""}, experience=${
        profile.experienceLevel ?? ""
      }, preferred_time=${profile.preferredWorkoutTime ?? ""}. Use this to tailor advice.`
    : "";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT + (profileNote ? `\n${profileNote}` : "") },
    ...history,
    { role: "user", content: userInput },
  ];

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error(`AI endpoint error ${res.status}`);
      const data = await res.json();
      if (typeof data.reply === "string" && data.reply.trim().length > 0) {
        return data.reply.trim();
      }
    } catch (e) {
      // Fall back to local response below
    }
  }

  // Local heuristic fallback (works without server or API key)
  return localCoachFallback(userInput, profile);
}

function localCoachFallback(input: string, profile: ProfileContext): string {
  const text = input.toLowerCase();
  const p = profile || {};
  const goalHint = p.fitnessGoal ? `Goal: ${p.fitnessGoal}. ` : "";
  const xp = p.experienceLevel ? `Experience: ${p.experienceLevel}. ` : "";

  if ((/(beginner|new|start)/.test(text) && /(workout|plan|gym)/.test(text)) || p.experienceLevel === "beginner") {
    return [
      `${goalHint}${xp}Beginner full-body (3x/week):`,
      "- Squat 3x8-10 (rest 90s)",
      "- Push-ups 3x8-12 (knees if needed)",
      "- Dumbbell row 3x10-12",
      "- Plank 3x30-45s",
      "Progress: add 1-2 reps or small weight weekly.",
      "How many days per week can you train?",
    ].join("\n");
  }

  if (/(lose|fat|weight)/.test(text)) {
    return [
      `${goalHint}${xp}Fat loss focus:`,
      "- 3 strength days: compound lifts 3x8-12",
      "- 2 cardio days: 20-30 min brisk walk or intervals",
      "- Daily steps: 7k-10k",
      "- Nutrition: small calorie deficit, prioritize protein",
      "Any injuries or equipment limits?",
    ].join("\n");
  }

  if (/(muscle|mass|hypertrophy|bulk)/.test(text)) {
    return [
      `${goalHint}${xp}Muscle gain basics:`,
      "- 4-day split (upper/lower): 3-4 sets x 6-12 reps",
      "- Progressively overload weekly",
      "- Protein ~1.6-2.2 g/kg, slight calorie surplus",
      "- Sleep 7-9h, track lifts",
      "Which muscle group would you like to prioritize?",
    ].join("\n");
  }

  if (/(shoulder|knee|back|pain|injury)/.test(text)) {
    return [
      "Safety first:",
      "- Avoid painful ranges and heavy loading",
      "- Swap to low-impact options (e.g., leg press for squats if knees)",
      "- Light mobility and controlled tempo",
      "Consider a professional evaluation for specific injuries.",
      "What movement hurts and at what intensity?",
    ].join("\n");
  }

  // Default helpful response
  return [
    `${goalHint}${xp}Got it! Here's a quick guideline:`,
    "- Strength: 3-5 sets x 4-6 reps",
    "- Hypertrophy: 3-4 sets x 6-12 reps",
    "- Endurance: 2-3 sets x 12-20 reps",
    "- Rest 60-120s; track weights and add small progress weekly",
    "Want a plan for home or gym equipment?",
  ].join("\n");
}


