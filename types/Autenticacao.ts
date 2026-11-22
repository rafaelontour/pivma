import type { ReactNode } from "react";
import type { AssignedPermissionProfile } from "./Rbac";
import type { CurrentUser } from "./Usuario";
import type { SessionAccessScope } from "./ParticipacaoEscopo";

export type AuthMode = "login" | "register";

export type LoginCurrentUser = Pick<CurrentUser, "username" | "email">;

export type LoginResult = {
  setCookies: string[];
};

export type { SessionAccessScope } from "./ParticipacaoEscopo";

export type CurrentSessionUser = {
  id?: string;
  username?: string;
  email?: string;
  full_name?: string | null;
  preferred_locale?: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
    full_name: string | null;
    preferred_locale?: string | null;
  };
  access: {
    profiles: AssignedPermissionProfile[];
    global_permissions: string[];
    scopes: SessionAccessScope[];
  };
};

export type LoginFormState = { kind: "idle" } | { kind: "loading" };

export type LoginFormProps = {
  onRegister: () => void;
  returnTo?: string;
};

export type RegistrationFormState = { kind: "idle" } | { kind: "loading" };

export type RegistrationFormProps = {
  onLogin: () => void;
  returnTo?: string;
};

export type PasswordCriterion = {
  label: string;
  met: boolean;
};

export type RegistrationValidationInput = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  passwordCriteria: PasswordCriterion[];
};

export type RegistrationInput = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

export type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  autoComplete?: string;
};

export type PasswordChecklistProps = {
  criteria: PasswordCriterion[];
};

export type PasswordFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

export type PasswordVisibilityIconProps = {
  open: boolean;
};
