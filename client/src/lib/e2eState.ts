import type { FitnessMetric, GoogleFitStatus, User } from "@/lib/api";

const isE2E = import.meta.env.VITE_E2E_BYPASS_AUTH === "true";

export interface E2EFitnessState {
  metrics?: FitnessMetric[];
  isLoading?: boolean;
  errorMessage?: string;
  insight?: string;
}

export interface E2EAuthState {
  isLoading?: boolean;
  isAuthenticated?: boolean;
  user?: Partial<User>;
}

export interface E2EState {
  auth?: E2EAuthState;
  fitness?: E2EFitnessState;
  googleFitStatus?: Partial<GoogleFitStatus>;
}

export function getE2EState(): E2EState | null {
  if (!isE2E || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem("E2E_STATE");
    if (!raw) return null;
    return JSON.parse(raw) as E2EState;
  } catch (error) {
    console.warn("[e2e] Failed to parse E2E state", error);
    return null;
  }
}

export const isE2EMode = isE2E;
