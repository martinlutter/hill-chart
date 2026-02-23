import { createPortal } from 'react-dom'

export interface HillChartWidgetProps {
  /** Raw innerHTML of the first issue body — contains the hillchart HTML comment block */
  issueBodyText: string
  /** GitHub's comment textarea — used for write-back */
  commentTextarea: HTMLTextAreaElement | null
  /** The form's submit button — clicked after pre-filling the textarea */
  submitButton: HTMLButtonElement | null
  /** Where to portal the "Hill Chart" trigger button in the host page */
  toolbarAnchor: Element | null
}

/**
 * Phase 5 stub — wires up the Portal entry point so the build and E2E
 * harness work end-to-end. Replaced with the full state machine in Phase 7.
 */
export function HillChartWidget({ toolbarAnchor }: HillChartWidgetProps) {
  if (!toolbarAnchor) return null

  return createPortal(
    <button className="hillchart-trigger-btn" type="button" data-testid="hillchart-button">
      Hill Chart
    </button>,
    toolbarAnchor,
  )
}
