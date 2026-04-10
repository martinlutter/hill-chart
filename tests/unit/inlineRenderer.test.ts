import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildInlineChartSvg, renderInlineCharts, observeInlineCharts, EDIT_INLINE_EVENT } from '../../src/github/inlineRenderer.js'
import type { HillPoint } from '../../src/types/index.js'

const SAMPLE_POINTS: HillPoint[] = [
  { id: 'p1', description: 'Login flow', x: 70, y: 64, color: '#3b82f6' },
  { id: 'p2', description: 'JWT handling', x: 30, y: 50, color: '#10b981' },
]

const CHART_JSON = '{"version":"1","points":[{"id":"p1","description":"Login flow","x":70,"y":64,"color":"#3b82f6"},{"id":"p2","description":"JWT handling","x":30,"y":50,"color":"#10b981"}]}'

/** Simulates what GitHub renders from a ```hillchart fenced code block (bare <pre>) */
const PRE_BLOCK = `<pre lang="hillchart"><code>${CHART_JSON}</code></pre>`

/** Simulates full GitHub DOM with snippet-clipboard-content wrapper */
const GITHUB_BLOCK = `<div class="snippet-clipboard-content notranslate position-relative overflow-auto"><pre lang="hillchart" class="notranslate"><code class="notranslate">${CHART_JSON}\n</code></pre><div class="zeroclipboard-container"><clipboard-copy>Copy</clipboard-copy></div></div>`

describe('buildInlineChartSvg', () => {
  it('returns an SVGSVGElement', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    expect(svg.tagName).toBe('svg')
  })

  it('has the correct viewBox', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    expect(svg.getAttribute('viewBox')).toBe('0 0 600 200')
  })

  it('contains one circle per point', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    const circles = svg.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
  })

  it('sets correct fill color on each circle', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    const circles = svg.querySelectorAll('circle')
    expect(circles[0].getAttribute('fill')).toBe('#3b82f6')
    expect(circles[1].getAttribute('fill')).toBe('#10b981')
  })

  it('includes phase labels', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    const texts = Array.from(svg.querySelectorAll('text'))
    const labels = texts.map((t) => t.textContent)
    expect(labels).toContain('Figuring things out')
    expect(labels).toContain('Making it happen')
  })

  it('includes point description labels', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    const texts = Array.from(svg.querySelectorAll('text'))
    const labels = texts.map((t) => t.textContent)
    expect(labels).toContain('Login flow')
    expect(labels).toContain('JWT handling')
  })

  it('renders zero points without error', () => {
    const svg = buildInlineChartSvg([])
    expect(svg.querySelectorAll('circle')).toHaveLength(0)
  })

  it('has a hill curve path element', () => {
    const svg = buildInlineChartSvg(SAMPLE_POINTS)
    const path = svg.querySelector('path')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('d')).toContain('M')
  })

  it('label for a point at x=0 is pushed right of the circle center (not centered behind the left border)', () => {
    const desc = 'A long label here'
    const svg = buildInlineChartSvg([{ id: 'edge', description: desc, x: 0, y: 0, color: '#f00' }])
    const label = Array.from(svg.querySelectorAll('text')).find((t) => t.textContent === desc)!
    const circle = svg.querySelector('circle')!
    expect(parseFloat(label.getAttribute('x')!)).toBeGreaterThan(parseFloat(circle.getAttribute('cx')!))
  })

  it('label for a point at x=100 is pushed left of the circle center (not centered behind the right border)', () => {
    const desc = 'A long label here'
    const svg = buildInlineChartSvg([{ id: 'edge', description: desc, x: 100, y: 0, color: '#f00' }])
    const label = Array.from(svg.querySelectorAll('text')).find((t) => t.textContent === desc)!
    const circle = svg.querySelector('circle')!
    expect(parseFloat(label.getAttribute('x')!)).toBeLessThan(parseFloat(circle.getAttribute('cx')!))
  })

  it('label for a point at x=50 is centered on the point', () => {
    const svg = buildInlineChartSvg([{ id: 'mid', description: 'Middle point', x: 50, y: 0, color: '#f00' }])
    const label = Array.from(svg.querySelectorAll('text')).find((t) => t.textContent === 'Middle point')!
    const circle = svg.querySelector('circle')!
    expect(parseFloat(label.getAttribute('x')!)).toBe(parseFloat(circle.getAttribute('cx')!))
  })

  it('two well-separated points have no connector lines', () => {
    const svg = buildInlineChartSvg([
      { id: 'a', description: 'Left', x: 5, y: 0, color: '#f00' },
      { id: 'b', description: 'Right', x: 95, y: 0, color: '#0f0' },
    ])
    // Connector lines live inside g[data-point-id] elements
    const pointGroups = svg.querySelectorAll('g[data-point-id]')
    let connectorCount = 0
    pointGroups.forEach((g) => { connectorCount += g.querySelectorAll('line').length })
    expect(connectorCount).toBe(0)
  })

  it('two overlapping points produce connector lines for the displaced labels', () => {
    const svg = buildInlineChartSvg([
      { id: 'a', description: 'Overlap', x: 50, y: 0, color: '#f00' },
      { id: 'b', description: 'Overlap', x: 50, y: 0, color: '#0f0' },
    ])
    const pointGroups = svg.querySelectorAll('g[data-point-id]')
    let connectorCount = 0
    pointGroups.forEach((g) => { connectorCount += g.querySelectorAll('line').length })
    expect(connectorCount).toBeGreaterThan(0)
  })

  it('label x moves gradually as point moves from center toward left edge', () => {
    const xAt = (pct: number) => {
      const svg = buildInlineChartSvg([{ id: 'p', description: 'Label', x: pct, y: 0, color: '#f00' }])
      const label = Array.from(svg.querySelectorAll('text')).find((t) => t.textContent === 'Label')!
      return parseFloat(label.getAttribute('x')!)
    }
    // Moving left: label x should decrease (or stay clamped), never jump
    const x50 = xAt(50)
    const x25 = xAt(25)
    const x10 = xAt(10)
    const x0  = xAt(0)
    expect(x50).toBeGreaterThan(x25)
    expect(x25).toBeGreaterThanOrEqual(x10)
    expect(x10).toBeGreaterThanOrEqual(x0)
  })

  describe('theming', () => {
    it('dark theme: hill curve uses dark border color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'dark')
      const path = svg.querySelector('path')!
      expect(path.getAttribute('stroke')).toBe('#30363d')
    })

    it('light theme: hill curve uses light border color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'light')
      const path = svg.querySelector('path')!
      expect(path.getAttribute('stroke')).toBe('#d0d7de')
    })

    it('dark theme: phase labels use dark muted text color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'dark')
      const phaseLabel = Array.from(svg.querySelectorAll('text')).find(
        (t) => t.textContent === 'Figuring things out',
      )!
      expect(phaseLabel.getAttribute('fill')).toBe('#8b949e')
    })

    it('light theme: phase labels use light muted text color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'light')
      const phaseLabel = Array.from(svg.querySelectorAll('text')).find(
        (t) => t.textContent === 'Figuring things out',
      )!
      expect(phaseLabel.getAttribute('fill')).toBe('#57606a')
    })

    it('dark theme: point labels use dark text color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'dark')
      const pointLabel = Array.from(svg.querySelectorAll('text')).find(
        (t) => t.textContent === 'Login flow',
      )!
      expect(pointLabel.getAttribute('fill')).toBe('#e6edf3')
    })

    it('light theme: point labels use light text color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'light')
      const pointLabel = Array.from(svg.querySelectorAll('text')).find(
        (t) => t.textContent === 'Login flow',
      )!
      expect(pointLabel.getAttribute('fill')).toBe('#1f2328')
    })

    it('dark theme: circle halo uses dark surface color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'dark')
      const circle = svg.querySelector('circle')!
      expect(circle.getAttribute('stroke')).toBe('#0d1117')
    })

    it('light theme: circle halo uses white surface color', () => {
      const svg = buildInlineChartSvg(SAMPLE_POINTS, 'light')
      const circle = svg.querySelector('circle')!
      expect(circle.getAttribute('stroke')).toBe('#ffffff')
    })
  })
})

describe('renderInlineCharts', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-color-mode')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-color-mode')
  })

  it('replaces a <pre lang="hillchart"> block with an inline chart', () => {
    document.body.innerHTML = `
      <div class="markdown-body">
        <p>Issue text</p>
        ${PRE_BLOCK}
      </div>
    `

    const cleanup = renderInlineCharts()
    const inline = document.querySelector('[data-testid="hillchart-inline"]')
    expect(inline).not.toBeNull()
    expect(inline!.querySelector('svg')).not.toBeNull()
    cleanup()
  })

  it('hides the original <pre> element', () => {
    document.body.innerHTML = `
      <div class="markdown-body">
        ${PRE_BLOCK}
      </div>
    `

    const cleanup = renderInlineCharts()
    const pre = document.querySelector('pre[lang="hillchart"]') as HTMLElement
    expect(pre.style.display).toBe('none')
    cleanup()
  })

  it('skips pages without hillchart code blocks', () => {
    document.body.innerHTML = `
      <div class="markdown-body">
        <p>Just a regular comment</p>
      </div>
    `

    const cleanup = renderInlineCharts()
    expect(document.querySelector('[data-testid="hillchart-inline"]')).toBeNull()
    cleanup()
  })

  it('handles multiple code blocks, injecting for each', () => {
    document.body.innerHTML = `
      <div class="comment-1">
        ${PRE_BLOCK}
      </div>
      <div class="comment-2">
        <pre lang="hillchart"><code>{"version":"1","points":[{"id":"x","description":"X","x":50,"y":50,"color":"#f00"}]}</code></pre>
      </div>
      <div class="comment-3">
        <p>No chart</p>
      </div>
    `

    const cleanup = renderInlineCharts()
    const inlines = document.querySelectorAll('[data-testid="hillchart-inline"]')
    expect(inlines).toHaveLength(2)
    cleanup()
  })

  it('cleanup removes injected elements and restores original <pre>', () => {
    document.body.innerHTML = `
      <div>
        ${PRE_BLOCK}
      </div>
    `

    const cleanup = renderInlineCharts()
    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(1)
    const pre = document.querySelector('pre[lang="hillchart"]') as HTMLElement
    expect(pre.style.display).toBe('none')

    cleanup()
    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(0)
    expect(pre.style.display).toBe('')
  })

  it('does not double-inject on repeated calls', () => {
    document.body.innerHTML = `
      <div>
        ${PRE_BLOCK}
      </div>
    `

    const cleanup1 = renderInlineCharts()
    const cleanup2 = renderInlineCharts()
    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(1)
    cleanup1()
    cleanup2()
  })

  it('inline SVG has the correct number of point circles', () => {
    document.body.innerHTML = `
      <div>
        ${PRE_BLOCK}
      </div>
    `

    const cleanup = renderInlineCharts()
    const svg = document.querySelector('[data-testid="hillchart-inline"] svg')
    expect(svg).not.toBeNull()
    expect(svg!.querySelectorAll('circle')).toHaveLength(2)
    cleanup()
  })

  it('skips <pre> with invalid JSON', () => {
    document.body.innerHTML = `
      <div>
        <pre lang="hillchart"><code>not json at all</code></pre>
      </div>
    `

    const cleanup = renderInlineCharts()
    expect(document.querySelector('[data-testid="hillchart-inline"]')).toBeNull()
    cleanup()
  })

  it('hides the snippet-clipboard-content wrapper when present (real GitHub DOM)', () => {
    document.body.innerHTML = `
      <div class="markdown-body">
        ${GITHUB_BLOCK}
      </div>
    `

    const cleanup = renderInlineCharts()
    const wrapper = document.querySelector('.snippet-clipboard-content') as HTMLElement
    expect(wrapper.style.display).toBe('none')
    expect(document.querySelector('[data-testid="hillchart-inline"]')).not.toBeNull()
    cleanup()
    expect(wrapper.style.display).toBe('')
  })

  it('handles trailing newline in code content (real GitHub DOM)', () => {
    document.body.innerHTML = `
      <div class="markdown-body">
        ${GITHUB_BLOCK}
      </div>
    `

    const cleanup = renderInlineCharts()
    const svg = document.querySelector('[data-testid="hillchart-inline"] svg')
    expect(svg).not.toBeNull()
    expect(svg!.querySelectorAll('circle')).toHaveLength(2)
    cleanup()
  })

  it('includes an edit button in each inline chart wrapper', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = renderInlineCharts()
    const editBtn = document.querySelector('[data-testid="hillchart-inline-edit"]')
    expect(editBtn).not.toBeNull()
    expect(editBtn!.getAttribute('aria-label')).toBe('Edit hill chart')
    cleanup()
  })

  it('edit button is hidden by default (opacity 0)', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = renderInlineCharts()
    const editBtn = document.querySelector('[data-testid="hillchart-inline-edit"]') as HTMLElement
    expect(editBtn.style.opacity).toBe('0')
    cleanup()
  })

  it('edit button becomes visible on wrapper mouseenter', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = renderInlineCharts()
    const wrapper = document.querySelector('[data-testid="hillchart-inline"]') as HTMLElement
    const editBtn = document.querySelector('[data-testid="hillchart-inline-edit"]') as HTMLElement

    wrapper.dispatchEvent(new Event('mouseenter'))
    expect(editBtn.style.opacity).toBe('1')

    wrapper.dispatchEvent(new Event('mouseleave'))
    expect(editBtn.style.opacity).toBe('0')
    cleanup()
  })

  it('edit button dispatches hillchart:edit-inline event with correct points on click', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = renderInlineCharts()
    const editBtn = document.querySelector('[data-testid="hillchart-inline-edit"]') as HTMLElement

    const handler = vi.fn()
    window.addEventListener(EDIT_INLINE_EVENT, handler)

    editBtn.click()

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0][0] as CustomEvent
    expect(event.detail.points).toHaveLength(2)
    expect(event.detail.points[0].description).toBe('Login flow')
    expect(event.detail.points[1].description).toBe('JWT handling')

    window.removeEventListener(EDIT_INLINE_EVENT, handler)
    cleanup()
  })

  it('cleanup removes edit button along with wrapper', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = renderInlineCharts()
    expect(document.querySelector('[data-testid="hillchart-inline-edit"]')).not.toBeNull()
    cleanup()
    expect(document.querySelector('[data-testid="hillchart-inline-edit"]')).toBeNull()
  })

  describe('theming', () => {
    it('dark theme: SVG hill curve uses dark border color', () => {
      document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
      const cleanup = renderInlineCharts('dark')
      const path = document.querySelector('[data-testid="hillchart-inline"] svg path')!
      expect(path.getAttribute('stroke')).toBe('#30363d')
      cleanup()
    })

    it('light theme: SVG hill curve uses light border color', () => {
      document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
      const cleanup = renderInlineCharts('light')
      const path = document.querySelector('[data-testid="hillchart-inline"] svg path')!
      expect(path.getAttribute('stroke')).toBe('#d0d7de')
      cleanup()
    })

    it('dark theme: SVG point labels use dark text color', () => {
      document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
      const cleanup = renderInlineCharts('dark')
      const label = Array.from(
        document.querySelectorAll('[data-testid="hillchart-inline"] svg text'),
      ).find((t) => t.textContent === 'Login flow')!
      expect(label.getAttribute('fill')).toBe('#e6edf3')
      cleanup()
    })

    it('light theme: SVG point labels use light text color', () => {
      document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
      const cleanup = renderInlineCharts('light')
      const label = Array.from(
        document.querySelectorAll('[data-testid="hillchart-inline"] svg text'),
      ).find((t) => t.textContent === 'Login flow')!
      expect(label.getAttribute('fill')).toBe('#1f2328')
      cleanup()
    })

    it('auto-detects light theme from data-color-mode attribute', () => {
      document.documentElement.setAttribute('data-color-mode', 'light')
      document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
      const cleanup = renderInlineCharts()
      const path = document.querySelector('[data-testid="hillchart-inline"] svg path')!
      expect(path.getAttribute('stroke')).toBe('#d0d7de')
      cleanup()
    })
  })
})

describe('observeInlineCharts', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-color-mode')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-color-mode')
  })

  it('renders existing hillchart blocks immediately on call', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = observeInlineCharts()
    expect(document.querySelector('[data-testid="hillchart-inline"]')).not.toBeNull()
    cleanup()
  })

  it('renders a chart when a pre[lang="hillchart"] is dynamically added', async () => {
    const cleanup = observeInlineCharts()

    const div = document.createElement('div')
    div.innerHTML = PRE_BLOCK
    document.body.appendChild(div)
    await Promise.resolve()

    expect(document.querySelector('[data-testid="hillchart-inline"]')).not.toBeNull()
    cleanup()
  })

  it('does not trigger for unrelated DOM mutations', async () => {
    const cleanup = observeInlineCharts()

    document.body.appendChild(document.createElement('p'))
    await Promise.resolve()

    expect(document.querySelector('[data-testid="hillchart-inline"]')).toBeNull()
    cleanup()
  })

  it('does not double-render a pre that was already processed by renderInlineCharts', async () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanupRender = renderInlineCharts()
    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(1)

    const cleanup = observeInlineCharts()
    // Trigger observer with an unrelated addition
    document.body.appendChild(document.createElement('span'))
    await Promise.resolve()

    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(1)
    cleanupRender()
    cleanup()
  })

  it('renders charts across multiple separate dynamic additions', async () => {
    const cleanup = observeInlineCharts()

    const div1 = document.createElement('div')
    div1.innerHTML = PRE_BLOCK
    document.body.appendChild(div1)
    await Promise.resolve()

    const div2 = document.createElement('div')
    div2.innerHTML = '<pre lang="hillchart"><code>{"version":"1","points":[{"id":"x","description":"X","x":50,"y":50,"color":"#f00"}]}</code></pre>'
    document.body.appendChild(div2)
    await Promise.resolve()

    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(2)
    cleanup()
  })

  it('cleanup disconnects the observer so no further charts are rendered', async () => {
    const cleanup = observeInlineCharts()
    cleanup()

    const div = document.createElement('div')
    div.innerHTML = PRE_BLOCK
    document.body.appendChild(div)
    await Promise.resolve()

    expect(document.querySelector('[data-testid="hillchart-inline"]')).toBeNull()
  })

  it('cleanup removes charts rendered by the observer', async () => {
    const cleanup = observeInlineCharts()

    const div = document.createElement('div')
    div.innerHTML = PRE_BLOCK
    document.body.appendChild(div)
    await Promise.resolve()

    expect(document.querySelector('[data-testid="hillchart-inline"]')).not.toBeNull()
    cleanup()
    expect(document.querySelector('[data-testid="hillchart-inline"]')).toBeNull()
  })

  it('re-renders with new theme when data-color-mode changes', async () => {
    document.documentElement.setAttribute('data-color-mode', 'dark')
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = observeInlineCharts()

    // Verify dark theme initially
    let path = document.querySelector('[data-testid="hillchart-inline"] svg path')!
    expect(path.getAttribute('stroke')).toBe('#30363d')

    // Switch to light theme
    document.documentElement.setAttribute('data-color-mode', 'light')
    await Promise.resolve()

    path = document.querySelector('[data-testid="hillchart-inline"] svg path')!
    expect(path.getAttribute('stroke')).toBe('#d0d7de')

    cleanup()
  })

  it('cleanup removes charts rendered initially on call', () => {
    document.body.innerHTML = `<div>${PRE_BLOCK}</div>`
    const cleanup = observeInlineCharts()
    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(1)
    cleanup()
    expect(document.querySelectorAll('[data-testid="hillchart-inline"]')).toHaveLength(0)
  })
})
