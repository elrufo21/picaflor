import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import "../App.css";
import router from "./routes";
import { queryClient } from "../shared/queryClient";

function App() {
  useEffect(() => {
    const ensureFormDecoys = (form: HTMLFormElement) => {
      if (form.dataset.noHistoryDecoys === "true") return;

      const makeDecoy = (autoComplete: string, fieldName: string) => {
        const input = document.createElement("input");
        input.type = "text";
        input.name = fieldName;
        input.autocomplete = autoComplete;
        input.tabIndex = -1;
        input.setAttribute("aria-hidden", "true");
        input.style.position = "absolute";
        input.style.opacity = "0";
        input.style.pointerEvents = "none";
        input.style.height = "0";
        input.style.width = "0";
        input.style.top = "-10000px";
        input.style.left = "-10000px";
        return input;
      };

      form.prepend(
        makeDecoy(
          "street-address",
          `nohistory-address-${Math.random().toString(36).slice(2)}`,
        ),
      );
      form.prepend(
        makeDecoy(
          "name",
          `nohistory-name-${Math.random().toString(36).slice(2)}`,
        ),
      );
      form.dataset.noHistoryDecoys = "true";
    };

    const applyNoHistoryAttrs = (root: ParentNode) => {
      if (root instanceof HTMLElement) {
        if (root.matches("form")) {
          root.setAttribute("autocomplete", "new-password");
          ensureFormDecoys(root);
        }

        if (root.matches("input, textarea, select")) {
          root.setAttribute("autocomplete", "new-password");
          root.setAttribute("autocorrect", "off");
          root.setAttribute("autocapitalize", "none");
          root.setAttribute("spellcheck", "false");
          root.setAttribute("aria-autocomplete", "none");
          root.setAttribute("data-lpignore", "true");
          root.setAttribute("data-1p-ignore", "true");
          root.setAttribute("data-bwignore", "true");
          root.setAttribute("data-form-type", "other");
          root.setAttribute("data-autocomplete", "off");
        }
      }

      root.querySelectorAll("form").forEach((form) => {
        form.setAttribute("autocomplete", "new-password");
        ensureFormDecoys(form);
      });

      root.querySelectorAll("input, textarea, select").forEach((element) => {
        element.setAttribute("autocomplete", "new-password");
        element.setAttribute("autocorrect", "off");
        element.setAttribute("autocapitalize", "none");
        element.setAttribute("spellcheck", "false");
        element.setAttribute("aria-autocomplete", "none");
        element.setAttribute("data-lpignore", "true");
        element.setAttribute("data-1p-ignore", "true");
        element.setAttribute("data-bwignore", "true");
        element.setAttribute("data-form-type", "other");
        element.setAttribute("data-autocomplete", "off");
      });
    };

    applyNoHistoryAttrs(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (
            node.matches("form, input, textarea, select") ||
            node.querySelector("form, input, textarea, select")
          ) {
            applyNoHistoryAttrs(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
