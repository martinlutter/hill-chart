/**
 * Content script entry point.
 * Creates a Shadow DOM host, injects scoped CSS, mounts the React widget,
 * and re-mounts on Turbo/Pjax soft-navigation events.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { detectIssuePage } from "../github/detector.js";
import { setupNavigation } from "../github/navigation.js";
import { HillChartWidget } from "../components/HillChartWidget.js";
import styles from "./styles.css?inline";

function mount(): () => void {
  const page = detectIssuePage();

  if (!page.isIssuePage) {
    // Not a GitHub issue page — nothing to do
    return () => {};
  }

  // Create shadow host
  const host = document.createElement("div");
  host.id = "hillchart-extension-root";
  document.body.appendChild(host);

  // Attach shadow DOM and inject scoped CSS
  const shadow = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  // Prevent keyboard events from leaking out of the shadow DOM
  // so GitHub's single-key shortcuts (e.g. "l", "a", "g") don't fire
  // while the user is typing in our inputs.
  for (const eventType of ["keydown", "keypress", "keyup"] as const) {
    shadow.addEventListener(eventType, (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        e.stopPropagation();
      }
    });
  }

  // React render container inside the shadow root
  const container = document.createElement("div");
  shadow.appendChild(container);

  const root = createRoot(container);
  root.render(
    React.createElement(HillChartWidget, {
      issueBodyText: page.issueBodyText,
      commentTextarea: page.commentTextarea,
      submitButton: page.submitButton,
      toolbarAnchor: page.toolbarAnchor,
    }),
  );

  return () => {
    root.unmount();
    host.remove();
  };
}

setupNavigation(mount);
