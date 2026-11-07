import type { AuthenticatedPage } from "./AreaAutenticada";

export type OnboardingTourId = "proponent-submission" | "bracvam-form" | "user-directory";

export type OnboardingTourStep = {
  key: string;
  target: string;
};

export type OnboardingProgress = {
  version: number;
  step: number;
  dismissed: boolean;
  paused: boolean;
};

export type OnboardingProps = {
  userId: string;
  activePage: AuthenticatedPage;
  canSubmit: boolean;
  canManageForms: boolean;
  canManageUsers: boolean;
};
