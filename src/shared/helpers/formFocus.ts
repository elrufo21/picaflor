import type { KeyboardEvent } from "react";

export const getFocusableElements = (scope: ParentNode) =>
  Array.from(
    scope.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);

export const focusNextElement = (
  current?: HTMLElement | null,
  root?: ParentNode | null
) => {
  if (!current) return;
  const scope = root ?? current.closest("form") ?? current.ownerDocument;
  if (!scope) return;
  const focusables = getFocusableElements(scope);
  if (!focusables.length) return;
  const active = current.ownerDocument.activeElement as HTMLElement | null;
  const cursor = focusables.includes(current)
    ? current
    : active && focusables.includes(active)
    ? active
    : null;
  const currentIndex = cursor ? focusables.indexOf(cursor) : -1;
  const next =
    currentIndex >= 0 ? focusables[currentIndex + 1] ?? focusables[0] : focusables[0];
  next.focus();
};

export const handleEnterFocus = (event: KeyboardEvent<HTMLElement>) => {
  if (event.key !== "Enter") return;
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target.tagName === "BUTTON" || target.tagName === "TEXTAREA") return;

  const nextSelector =
    target.getAttribute("data-focus-next") ??
    target.closest<HTMLElement>("[data-focus-next]")?.getAttribute("data-focus-next");

  event.preventDefault();
  if (nextSelector) {
    setTimeout(() => {
      const next = document.querySelector<HTMLElement>(nextSelector);
      next?.focus();
    }, 0);
    return;
  }
  setTimeout(() => focusNextElement(target, target.closest("form")), 0);
};
