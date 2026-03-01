import type { HillPoint, ParseResult } from '../types/index.js'
import { decode } from '../data/codec.js'
import {
  buildHillPath,
  hillY,
  percentToSvgX,
  SVG_WIDTH,
  SVG_HEIGHT,
  BASELINE_Y,
  PEAK_HEIGHT,
} from '../hill-chart/hillMath.js'

const INLINE_MARKER = 'data-hillchart-inline'
const POINT_RADIUS = 10
const LABEL_OFFSET = 16

export const EDIT_INLINE_EVENT = 'hillchart:edit-inline'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v)
  }
  return el
}

function buildPencilIcon(): SVGSVGElement {
  const svg = svgEl('svg', {
    width: '14',
    height: '14',
    viewBox: '0 0 16 16',
    fill: 'currentColor',
  })
  const path = svgEl('path', {
    d: 'M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.264a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.811l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.064l6.286-6.286Z',
  })
  svg.appendChild(path)
  return svg
}

function buildEditButton(points: HillPoint[]): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.setAttribute('data-testid', 'hillchart-inline-edit')
  btn.setAttribute('aria-label', 'Edit hill chart')
  btn.appendChild(buildPencilIcon())
  Object.assign(btn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#21262d',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#8b949e',
    cursor: 'pointer',
    opacity: '0',
    transition: 'opacity 0.15s',
    padding: '0',
  })
  btn.addEventListener('mouseenter', () => {
    btn.style.color = '#e6edf3'
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.color = '#8b949e'
  })
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points } }),
    )
  })
  return btn
}

export function buildInlineChartSvg(points: HillPoint[]): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
    'aria-label': 'Hill chart',
    role: 'img',
  })
  svg.style.display = 'block'
  svg.style.width = '600px'
  svg.style.maxWidth = '100%'

  // Hill curve
  const path = svgEl('path', {
    d: buildHillPath(),
    fill: 'none',
    stroke: '#30363d',
    'stroke-width': '2',
  })
  svg.appendChild(path)

  // Baseline
  const baseline = svgEl('line', {
    x1: '0',
    y1: String(BASELINE_Y),
    x2: String(SVG_WIDTH),
    y2: String(BASELINE_Y),
    stroke: '#30363d',
    'stroke-width': '1',
  })
  svg.appendChild(baseline)

  // Center divider
  const midX = SVG_WIDTH / 2
  const divider = svgEl('line', {
    x1: String(midX),
    y1: '0',
    x2: String(midX),
    y2: String(BASELINE_Y),
    stroke: '#30363d',
    'stroke-width': '1',
    'stroke-dasharray': '4 4',
  })
  svg.appendChild(divider)

  // Phase labels
  const leftLabel = svgEl('text', {
    x: String(midX / 2),
    y: String(SVG_HEIGHT - 4),
    'text-anchor': 'middle',
    'font-size': '11',
    fill: '#8b949e',
  })
  leftLabel.textContent = 'Figuring things out'
  svg.appendChild(leftLabel)

  const rightLabel = svgEl('text', {
    x: String(midX + midX / 2),
    y: String(SVG_HEIGHT - 4),
    'text-anchor': 'middle',
    'font-size': '11',
    fill: '#8b949e',
  })
  rightLabel.textContent = 'Making it happen'
  svg.appendChild(rightLabel)

  // Points
  for (const pt of points) {
    const cx = percentToSvgX(pt.x)
    const cy = hillY(pt.x, BASELINE_Y, PEAK_HEIGHT)
    const g = svgEl('g')
    g.setAttribute('data-point-id', pt.id)

    const circle = svgEl('circle', {
      cx: String(cx),
      cy: String(cy),
      r: String(POINT_RADIUS),
      fill: pt.color,
      stroke: '#0d1117',
      'stroke-width': '1.5',
    })
    g.appendChild(circle)

    const label = svgEl('text', {
      x: String(cx),
      y: String(cy - LABEL_OFFSET),
      'text-anchor': 'middle',
      'font-size': '11',
      fill: '#e6edf3',
    })
    label.textContent = pt.description
    g.appendChild(label)

    svg.appendChild(g)
  }

  return svg
}

/**
 * Parses the text content of a <code> element as hillchart JSON.
 * This handles the rendered output of a ```hillchart fenced block —
 * GitHub renders the JSON as the text content of a <code> element.
 */
function parseCodeContent(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text.trim())
  } catch {
    return { ok: false, error: 'Invalid JSON in hillchart block' }
  }

  // Re-wrap and let decode() handle validation + sanitization
  const fenced = '```hillchart\n' + JSON.stringify(parsed) + '\n```'
  return decode(fenced)
}

/**
 * Finds the best element to hide when replacing a hillchart code block.
 *
 * GitHub wraps fenced code blocks in:
 *   <div class="snippet-clipboard-content ...">
 *     <pre lang="hillchart"><code>...</code></pre>
 *     <div class="zeroclipboard-container ...">...</div>
 *   </div>
 *
 * We hide the entire snippet container so the clipboard button disappears too.
 * Falls back to the <pre> itself if no container wrapper is found.
 */
function findHideTarget(pre: HTMLElement): HTMLElement {
  const parent = pre.parentElement
  if (parent?.classList.contains('snippet-clipboard-content')) {
    return parent
  }
  return pre
}

/**
 * Watches for dynamically added hillchart code blocks (e.g. new comments, soft-nav late loads)
 * and renders them as inline SVG charts.
 * Returns a cleanup function that disconnects the observer and restores any replaced blocks.
 */
export function observeInlineCharts(): () => void {
  const cleanups: (() => void)[] = []

  const observer = new MutationObserver((mutations) => {
    const hasNewPre = mutations.some((m) =>
      Array.from(m.addedNodes).some(
        (node) =>
          node instanceof Element &&
          (node.matches('pre[lang="hillchart"]') ||
            node.querySelector('pre[lang="hillchart"]') !== null),
      ),
    )
    if (!hasNewPre) return
    cleanups.push(renderInlineCharts())
  })

  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    for (const cleanup of cleanups) cleanup()
  }
}

/**
 * Finds rendered hillchart code blocks on the page and replaces them with SVG charts.
 *
 * GitHub renders ```hillchart fenced blocks as:
 *   <div class="snippet-clipboard-content ...">
 *     <pre lang="hillchart" class="notranslate"><code class="notranslate">...</code></pre>
 *     <div class="zeroclipboard-container ..."><!-- copy button --></div>
 *   </div>
 *
 * Returns a cleanup function that restores the original code blocks.
 */
export function renderInlineCharts(): () => void {
  const replaced: { wrapper: HTMLElement; hideTarget: HTMLElement }[] = []

  const codeBlocks = document.querySelectorAll<HTMLElement>(
    'pre[lang="hillchart"]',
  )

  for (const pre of codeBlocks) {
    const hideTarget = findHideTarget(pre)

    // Skip if already processed
    if (hideTarget.style.display === 'none') continue

    const code = pre.querySelector('code') ?? pre
    const result = parseCodeContent(code.textContent ?? '')
    if (!result.ok) continue

    const wrapper = document.createElement('div')
    wrapper.setAttribute(INLINE_MARKER, '')
    wrapper.setAttribute('data-testid', 'hillchart-inline')
    wrapper.style.display = 'inline-block'
    wrapper.style.margin = '16px 0 8px'
    wrapper.style.padding = '12px'
    wrapper.style.background = '#161b22'
    wrapper.style.border = '1px solid #30363d'
    wrapper.style.borderRadius = '6px'
    wrapper.style.position = 'relative'

    const svg = buildInlineChartSvg(result.data.points)
    wrapper.appendChild(svg)

    const editBtn = buildEditButton(result.data.points)
    wrapper.appendChild(editBtn)
    wrapper.addEventListener('mouseenter', () => {
      editBtn.style.opacity = '1'
    })
    wrapper.addEventListener('mouseleave', () => {
      editBtn.style.opacity = '0'
    })

    // Insert chart before the code block and hide the original
    hideTarget.parentElement!.insertBefore(wrapper, hideTarget)
    hideTarget.style.display = 'none'
    replaced.push({ wrapper, hideTarget })
  }

  return () => {
    for (const { wrapper, hideTarget } of replaced) {
      hideTarget.style.display = ''
      wrapper.remove()
    }
  }
}
