"use client";

import { useCallback, useState } from "react";
import { submitScore } from "@/app/actions/games";
import type { ScoreSubmission } from "@/lib/games/types";

export function useSubmitScore(defaults: Partial<ScoreSubmission> = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  const run = useCallback(async (input: Omit<ScoreSubmission, "username"> & { username?: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitScore({ ...defaults, ...input } as ScoreSubmission);
      if (!res.success) throw new Error(res.error || "Failed to submit score");
      setLastId(res.id || null);
      return res;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [defaults]);

  return { submit: run, submitting, error, lastId };
}
