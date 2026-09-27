"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type {
  PasswordChecklistProps,
  PasswordFieldProps,
  PasswordInputProps,
  PasswordVisibilityIconProps,
  RegistrationFormProps,
  RegistrationFormState,
  RegistrationValidationInput,
} from "@/types/Autenticacao";
import type { ApiMessage } from "@/types/Servico";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegistrationForm({ onLogin }: RegistrationFormProps) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registrationState, setRegistrationState] = useState<RegistrationFormState>({
    kind: "idle",
  });

  const passwordCriteria = useMemo(
    () => [
      { label: t("auth.register.criterionLength"), met: password.length >= 8 },
      { label: t("auth.register.criterionUppercase"), met: /[A-Z]/.test(password) },
      { label: t("auth.register.criterionLowercase"), met: /[a-z]/.test(password) },
      { label: t("auth.register.criterionNumber"), met: /\d/.test(password) },
    ],
    [password, t],
  );

  const validationKey = getValidationKey({
    fullName,
    username,
    email,
    passwordCriteria,
    passwordConfirmation,
    password,
  });
  const validationMessage = validationKey ? t(validationKey) : null;
  const passwordsMatch =
    passwordConfirmation.length > 0 && password === passwordConfirmation;
  const canSubmit = !validationMessage && !isLoadingState(registrationState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setRegistrationState({ kind: "loading" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });
      const responseBody = (await response.json().catch(() => null)) as ApiMessage | null;

      if (!response.ok) {
        setPassword("");
        setPasswordConfirmation("");
        setRegistrationState({ kind: "idle" });
        toast.error(
          responseBody?.message ?? t("auth.register.failed"),
        );
        return;
      }

      setPassword("");
      setPasswordConfirmation("");
      setRegistrationState({ kind: "idle" });
      toast.success(t("auth.register.success"), {
        description: t("auth.register.successDescription"),
      });
      onLogin();
    } catch {
      setPassword("");
      setPasswordConfirmation("");
      setRegistrationState({ kind: "idle" });
      toast.error(t("auth.register.connectionFailed"));
    }
  }

  const isLoading = registrationState.kind === "loading";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-400/20 backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {t("auth.register.eyebrow")}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
          {t("auth.register.title")}
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {t("auth.register.description")}
        </p>
      </div>

      <form className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <Field label={t("auth.register.fullName")} htmlFor="full-name">
            <input
              aria-describedby="full-name-help"
              autoComplete="name"
              className={inputClassName}
              id="full-name"
              maxLength={255}
              name="fullName"
              onChange={(event) => setFullName(event.target.value)}
              placeholder={t("auth.register.fullNamePlaceholder")}
              required
              value={fullName}
            />
          </Field>
          <p className="mt-1 text-[11px] text-slate-500" id="full-name-help">
            {t("auth.register.fullNameHelp")}
          </p>
        </div>

        <Field label={t("auth.register.username")} htmlFor="username">
          <input
            autoComplete="username"
            className={inputClassName}
            id="username"
            maxLength={64}
            minLength={3}
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            pattern="[A-Za-z0-9._-]+"
            placeholder={t("auth.register.usernamePlaceholder")}
            required
            value={username}
          />
        </Field>

        <Field label={t("auth.register.email")} htmlFor="email">
          <input
            autoComplete="email"
            className={inputClassName}
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.register.emailPlaceholder")}
            required
            type="email"
            value={email}
          />
        </Field>

        <Field label={t("auth.register.password")} htmlFor="registration-password">
          <PasswordInput
            id="registration-password"
            onChange={setPassword}
            showPassword={showPassword}
            value={password}
          />
        </Field>

        <div>
          <Field label={t("auth.register.passwordConfirmation")} htmlFor="password-confirmation">
          <PasswordInput
            autoComplete="new-password"
            id="password-confirmation"
            onChange={setPasswordConfirmation}
            showPassword={showPassword}
            value={passwordConfirmation}
          />
          </Field>
          {passwordConfirmation && (
            <p
              aria-live="polite"
              className={`mt-1 text-[11px] font-medium ${
                passwordsMatch ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {passwordsMatch ? t("auth.register.passwordsMatch") : t("auth.register.passwordsDoNotMatch")}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <PasswordChecklist criteria={passwordCriteria} />
        </div>

        <button
          aria-label={showPassword ? t("auth.register.hidePasswords") : t("auth.register.showPasswords")}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:col-span-2"
          onClick={() => setShowPassword((visible) => !visible)}
          type="button"
        >
          <EyeIcon open={showPassword} />
          {showPassword ? t("auth.register.hidePasswords") : t("auth.register.showPasswords")}
        </button>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-[#efeef1] disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2"
          disabled={!canSubmit}
          type="submit"
        >
          {isLoading ? t("auth.register.creating") : t("auth.register.submit")}
          {!isLoading && <ArrowIcon />}
        </button>
      </form>

      <div className="mt-4 border-t border-slate-200 pt-3 text-center text-xs leading-4 text-slate-500">
        <p>{t("auth.register.hasAccount")}</p>
        <button
          className="mt-1 font-semibold text-teal-700 transition hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          onClick={onLogin}
          type="button"
        >
          {t("auth.register.login")}
        </button>
      </div>
    </section>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-3 focus:ring-teal-600/15";

function Field({
  label,
  htmlFor,
  children,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  showPassword,
  autoComplete = "new-password",
}: PasswordInputProps) {
  const { t } = useTranslation();

  return (
    <input
      autoComplete={autoComplete}
      className={inputClassName}
      id={id}
      minLength={8}
      maxLength={128}
      name={id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t("auth.login.passwordPlaceholder")}
      required
      type={showPassword ? "text" : "password"}
      value={value}
    />
  );
}

function PasswordChecklist({
  criteria,
}: PasswordChecklistProps) {
  const { t } = useTranslation();

  return (
    <ul aria-label={t("auth.register.requirements")} className="grid grid-cols-1 gap-x-3 gap-y-1 rounded-xl bg-slate-100 px-3 py-2 sm:grid-cols-2">
      {criteria.map((criterion) => (
        <li className="flex items-center gap-2 text-xs text-slate-600" key={criterion.label}>
          <input
            aria-label={criterion.label}
            aria-readonly="true"
            checked={criterion.met}
            className="pointer-events-none size-3.5 accent-teal-600"
            readOnly
            tabIndex={-1}
            type="checkbox"
          />
          <span className={criterion.met ? "text-teal-800" : undefined}>
            {criterion.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function isLoadingState(state: RegistrationFormState) {
  return state.kind === "loading";
}

function getValidationKey({
  fullName,
  username,
  email,
  passwordCriteria,
  passwordConfirmation,
  password,
}: RegistrationValidationInput) {
  const normalizedFullName = fullName.trim();

  if (normalizedFullName.length < 1 || normalizedFullName.length > 255) {
    return "auth.register.validationFullName";
  }

  if (!USERNAME_PATTERN.test(username.trim())) {
    return "auth.register.validationUsername";
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return "auth.register.validationEmail";
  }

  if (!passwordCriteria.every((criterion) => criterion.met)) {
    return "auth.register.validationPassword";
  }

  if (password.length > 128) {
    return "auth.register.validationPassword";
  }

  if (password !== passwordConfirmation) {
    return "auth.register.validationConfirmation";
  }

  return null;
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function EyeIcon({ open }: PasswordVisibilityIconProps) {
  return open ? (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.1A10.7 10.7 0 0 1 12 5c5.2 0 8.7 5.1 9 7-.1.7-.7 2-1.8 3.3M6.2 6.2C4.5 7.6 3.3 9.6 3 12c.5 2.8 4.1 7 9 7 1.2 0 2.4-.3 3.4-.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M3 12s3.4-7 9-7 9 7 9 7-3.4 7-9 7-9-7-9-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
