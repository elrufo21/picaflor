export const focusFirstInput = (root?: HTMLElement | null) => {
  const scope: ParentNode | Document = root ?? document;

  // Use rAF to ensure DOM is ready after state updates
  window.requestAnimationFrame(() => {
    const findFocusable = (root: ParentNode | Document, selector: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null
      );

    const inputsOnly = findFocusable(
      scope,
      'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)'
    );
    const allFocusables = findFocusable(
      scope,
      'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );

    const preferred = scope.querySelector<HTMLElement>(
      '[data-focus-first="true"]'
    );
    const element =
      preferred && !(preferred as HTMLInputElement).disabled
        ? preferred
        : inputsOnly[0] ?? allFocusables[0];
    if (!element) return;

    element.focus({ preventScroll: true });

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      const length = element.value?.length ?? 0;
      try {
        element.setSelectionRange(length, length);
      } catch {
        // Ignore selection errors (e.g., unsupported input types)
      }
    }
  });
};
