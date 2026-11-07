"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type {
  OnboardingProgress,
  OnboardingProps,
  OnboardingTourId,
  OnboardingTourStep,
} from "@/types/Onboarding";

const TOUR_VERSION = 2;
const subscribeToClient = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const TOUR_STEPS: Record<OnboardingTourId, OnboardingTourStep[]> = {
  "proponent-submission": [
    { key: "submissions", target: "shell-nav-submissions" },
    { key: "types", target: "submission-types" },
    { key: "identification", target: "submission-template-list" },
    { key: "draft", target: "submission-tab-drafts" },
    { key: "tracking", target: "submission-tab-submitted" },
  ],
  "bracvam-form": [
    { key: "forms", target: "form-catalog" },
    { key: "catalog", target: "form-catalog-list" },
    { key: "sections", target: "form-sections" },
    { key: "validation", target: "form-fields" },
    { key: "preview", target: "form-save" },
  ],
  "user-directory": [
    { key: "userSearch", target: "users-search" },
    { key: "userStatus", target: "users-status" },
    { key: "userCount", target: "users-count" },
    { key: "userList", target: "users-list" },
    { key: "userActions", target: "users-actions" },
  ],
};

export function GuidedOnboarding({
  userId,
  activePage,
  canSubmit,
  canManageForms,
  canManageUsers,
}: OnboardingProps) {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const [tour, setTour] = useState<OnboardingTourId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const eligibleTour = useMemo<OnboardingTourId | null>(() => {
    if (activePage === "users" && canManageUsers) return "user-directory";
    if (activePage === "forms" && canManageForms) return "bracvam-form";
    if (activePage === "submissions" && canSubmit) return "proponent-submission";
    if (canManageForms) return "bracvam-form";
    if (canManageUsers) return "user-directory";
    if (canSubmit) return "proponent-submission";
    return null;
  }, [activePage, canManageForms, canManageUsers, canSubmit]);

  const storageKey = useCallback((id: OnboardingTourId) =>
    `pivma:onboarding:${userId}:${id}:v${TOUR_VERSION}`, [userId]);

  const readProgress = useCallback((id: OnboardingTourId): OnboardingProgress => {
    try {
      const raw = window.localStorage.getItem(storageKey(id));
      if (!raw) return { version: TOUR_VERSION, step: 0, dismissed: false, paused: false };
      const parsed = JSON.parse(raw) as Partial<OnboardingProgress>;
      if (parsed.version !== TOUR_VERSION) return { version: TOUR_VERSION, step: 0, dismissed: false, paused: false };
      return {
        version: TOUR_VERSION,
        step: Number.isInteger(parsed.step) ? Math.max(0, parsed.step ?? 0) : 0,
        dismissed: parsed.dismissed === true,
        paused: parsed.paused === true,
      };
    } catch {
      return { version: TOUR_VERSION, step: 0, dismissed: false, paused: false };
    }
  }, [storageKey]);

  const saveProgress = useCallback((id: OnboardingTourId, progress: OnboardingProgress) => {
    try {
      window.localStorage.setItem(storageKey(id), JSON.stringify(progress));
    } catch {
      // Private browsing or storage policies may disable local persistence.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted || !eligibleTour) return;
    const expectedPage = eligibleTour === "proponent-submission"
      ? "submissions"
      : eligibleTour === "bracvam-form" ? "forms" : "users";
    if (activePage !== expectedPage) return;
    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      const progress = readProgress(eligibleTour);
      let requestedEntry = false;
      let requestedReplay = false;
      try {
        requestedEntry = window.sessionStorage.getItem("pivma:onboarding:enter") === eligibleTour;
        requestedReplay =
          window.sessionStorage.getItem("pivma:onboarding:replay") === eligibleTour ||
          window.location.hash === "#tutorial";
        if (requestedEntry) window.sessionStorage.removeItem("pivma:onboarding:enter");
        if (requestedReplay) window.sessionStorage.removeItem("pivma:onboarding:replay");
      } catch {
        requestedReplay = window.location.hash === "#tutorial";
      }
      if (requestedReplay && window.location.hash === "#tutorial") {
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }
      const shouldStart =
        requestedReplay ||
        (!progress.dismissed && (!progress.paused || requestedEntry));
      if (!shouldStart) return;
      const nextStep = requestedReplay && progress.dismissed
        ? 0
        : Math.min(progress.step, TOUR_STEPS[eligibleTour].length - 1);
      const targetSelector = `[data-tour="${TOUR_STEPS[eligibleTour][nextStep].target}"]`;
      let attempts = 0;
      const startWhenTargetIsReady = () => {
        attempts += 1;
        if (!document.querySelector(targetSelector) && attempts < 180) {
          frame = window.requestAnimationFrame(startWhenTargetIsReady);
          return;
        }
        if (requestedEntry || requestedReplay) {
          saveProgress(eligibleTour, {
            version: TOUR_VERSION,
            step: nextStep,
            dismissed: false,
            paused: false,
          });
        }
        setStepIndex(nextStep);
        setTour(eligibleTour);
      };
      startWhenTargetIsReady();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePage, eligibleTour, mounted, readProgress, saveProgress]);

  useEffect(() => {
    const enterTutorial = (event: Event) => {
      const requestedTour = (event as CustomEvent<OnboardingTourId>).detail;
      if (
        requestedTour !== eligibleTour ||
        activePage !== "submissions" ||
        requestedTour !== "proponent-submission"
      ) return;
      const progress = readProgress(requestedTour);
      if (progress.dismissed) return;
      const nextStep = Math.min(progress.step, TOUR_STEPS[requestedTour].length - 1);
      saveProgress(requestedTour, {
        version: TOUR_VERSION,
        step: nextStep,
        dismissed: false,
        paused: false,
      });
      setStepIndex(nextStep);
      setTour(requestedTour);
    };
    window.addEventListener("pivma:onboarding-enter", enterTutorial);
    return () => window.removeEventListener("pivma:onboarding-enter", enterTutorial);
  }, [activePage, eligibleTour, readProgress, saveProgress]);

  useEffect(() => {
    if (!tour) return;
    const current = TOUR_STEPS[tour][stepIndex];
    if (!current) return;

    const openFormTimeout = tour === "bracvam-form" && stepIndex >= 2
      ? window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("pivma:onboarding-open-form"));
        }, 0)
      : null;

    let frame = 0;
    let attempts = 0;
    let scrolledToTarget = false;
    const update = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
      if (target) {
        if (!scrolledToTarget) {
          const behavior: ScrollBehavior = "auto";
          if (current.target === "shell-nav-submissions") {
            document.querySelector<HTMLElement>("[data-tour-scroll-container]")?.scrollTo({
              top: 0,
              behavior,
            });
          } else {
            target.scrollIntoView({ block: "center", behavior });
          }
          scrolledToTarget = true;
        }
        const rect = target.getBoundingClientRect();
        setTargetRect(new DOMRect(rect.x, rect.y, rect.width, rect.height));
      }
    };
    const seek = () => {
      update();
      attempts += 1;
      if (attempts < 8 && !document.querySelector(`[data-tour="${current.target}"]`)) {
        frame = window.requestAnimationFrame(seek);
      }
    };
    frame = window.requestAnimationFrame(seek);
    const observer = new ResizeObserver(update);
    const domObserver = new MutationObserver(update);
    observer.observe(document.documentElement);
    domObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      if (openFormTimeout !== null) window.clearTimeout(openFormTimeout);
      observer.disconnect();
      domObserver.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [stepIndex, tour]);

  useEffect(() => {
    if (!tour) return;
    const page = document.querySelector<HTMLElement>("main");
    const hadAriaHidden = page?.hasAttribute("aria-hidden") ?? false;
    if (page) page.setAttribute("aria-hidden", "true");
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => {
      if (page && !hadAriaHidden) page.removeAttribute("aria-hidden");
      previousFocus.current?.focus();
    };
  }, [tour]);

  const closeForResume = () => {
    if (tour) saveProgress(tour, { version: TOUR_VERSION, step: 0, dismissed: false, paused: true });
    setTour(null);
  };

  const finish = (dismissed: boolean) => {
    if (tour) saveProgress(tour, { version: TOUR_VERSION, step: 0, dismissed: true, paused: false });
    setTour(null);
    setTargetRect(null);
    if (!dismissed) previousFocus.current?.focus();
  };

  const move = (nextIndex: number) => {
    if (!tour) return;
    if (nextIndex >= TOUR_STEPS[tour].length) {
      finish(false);
      return;
    }
    const normalized = Math.max(0, nextIndex);
    if (tour === "bracvam-form" && stepIndex >= 2 && normalized < 2) {
      window.dispatchEvent(new Event("pivma:onboarding-close-form"));
    }
    if (
      tour === "proponent-submission" &&
      TOUR_STEPS[tour][normalized]?.target === "shell-nav-submissions"
    ) {
      const returnPageToTop = () => {
        const scrollContainer = document.querySelector<HTMLElement>("[data-tour-scroll-container]");
        const page = scrollContainer?.closest("main");
        const scrollables = [
          ...(scrollContainer ? [scrollContainer] : []),
          ...(page ? Array.from(page.querySelectorAll<HTMLElement>("*")) : []),
          document.scrollingElement as HTMLElement | null,
        ].filter((element): element is HTMLElement => element !== null);

        for (const element of scrollables) {
          if (element.scrollHeight > element.clientHeight || element === document.scrollingElement) {
            element.scrollTop = 0;
          }
        }
      };

      returnPageToTop();
      window.requestAnimationFrame(returnPageToTop);
    }
    saveProgress(tour, { version: TOUR_VERSION, step: normalized, dismissed: false, paused: false });
    setStepIndex(normalized);
  };

  if (!mounted || !tour) return null;

  const panelPosition = tour && targetRect
    ? getTourPanelPosition(targetRect, window.innerWidth, window.innerHeight)
    : null;

  const dialog = (
    <div className="fixed inset-0 z-[100]" onKeyDown={(event) => {
      if (event.key === "Escape") closeForResume();
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [];
        if (controls.length === 0) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/70" />
      {tour && targetRect && <div aria-hidden="true" className="pointer-events-none fixed z-[101] rounded-xl ring-4 ring-teal-300" style={{ left: targetRect.left - 5, top: targetRect.top - 5, width: targetRect.width + 10, height: targetRect.height + 10, boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.7)" }} />}
      <section aria-labelledby="onboarding-title" aria-modal="true" className={`${panelPosition ? "fixed z-[102]" : "absolute inset-x-3 bottom-3 z-[102] mx-auto w-auto"} max-h-[62dvh] max-w-[35rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-18px_rgba(15,23,42,0.5)]`} ref={dialogRef} role="dialog" style={panelPosition ? { left: panelPosition.left, top: panelPosition.top, width: panelPosition.width } : undefined} tabIndex={-1}>
        <div aria-live="polite" className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">{t(`onboarding.tours.${tour}.title`)}</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">{stepIndex + 1} / {TOUR_STEPS[tour].length}</span>
        </div>
        <div aria-hidden="true" className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((stepIndex + 1) / TOUR_STEPS[tour].length) * 100}%` }} /></div>
        <h2 className="mt-4 text-lg font-semibold leading-6 tracking-tight text-slate-950" id="onboarding-title">{t(`onboarding.steps.${TOUR_STEPS[tour][stepIndex].key}.title`)}</h2>
        <p className="mt-2 text-sm leading-5 text-slate-600">{t(`onboarding.steps.${TOUR_STEPS[tour][stepIndex].key}.description`)}</p>
        {!targetRect && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-900" role="status">{t("onboarding.targetUnavailable")}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div className="flex gap-2">
            <button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-40" disabled={stepIndex === 0} onClick={() => move(stepIndex - 1)} type="button">{t("onboarding.back")}</button>
            <button className="min-h-10 rounded-lg px-3 text-sm font-medium text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-teal-600" onClick={() => finish(true)} type="button">{t("onboarding.skip")}</button>
          </div>
          <button className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2" onClick={() => move(stepIndex + 1)} type="button">{stepIndex === TOUR_STEPS[tour].length - 1 ? t("onboarding.finish") : t("onboarding.next")}</button>
        </div>
        <button className="mt-2 min-h-8 text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 focus-visible:ring-2 focus-visible:ring-teal-600" onClick={closeForResume} type="button">{t("onboarding.close")}</button>
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}

function getTourPanelPosition(target: DOMRect, viewportWidth: number, viewportHeight: number) {
  const margin = 12;
  const gap = 10;
  const width = Math.min(560, viewportWidth - margin * 2);
  const height = Math.min(240, viewportHeight * 0.62);
  const maxLeft = viewportWidth - width - margin;
  const maxTop = viewportHeight - height - margin;
  const clampLeft = (left: number) => Math.min(Math.max(margin, left), maxLeft);
  const clampTop = (top: number) => Math.min(Math.max(margin, top), maxTop);
  const candidates = [
    { left: target.right + gap, top: clampTop(target.top), priority: 0 },
    { left: target.left - width - gap, top: clampTop(target.top), priority: 1 },
    { left: clampLeft(target.left), top: target.bottom + gap, priority: 2 },
    { left: clampLeft(target.left), top: target.top - height - gap, priority: 3 },
    { left: margin, top: margin, priority: 4 },
    { left: maxLeft, top: margin, priority: 5 },
    { left: margin, top: maxTop, priority: 6 },
    { left: maxLeft, top: maxTop, priority: 7 },
  ].filter((candidate) =>
    candidate.left >= margin && candidate.left <= maxLeft &&
    candidate.top >= margin && candidate.top <= maxTop &&
    (
      candidate.left + width + gap <= target.left ||
      candidate.left >= target.right + gap ||
      candidate.top + height + gap <= target.top ||
      candidate.top >= target.bottom + gap
    ),
  );
  const selected = candidates.sort((first, second) => first.priority - second.priority)[0];

  return {
    left: selected?.left ?? margin,
    top: selected?.top ?? margin,
    width,
  };
}
