import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildInlineChartSvg, renderInlineCharts, observeInlineCharts } from '../../src/github/inlineRenderer.js'
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
})

describe('renderInlineCharts', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
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
})

describe('observeInlineCharts', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
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
    div2.innerHTML = `<pre lang="hillchart"><code>{"version":"1","points":[{"id":"x","description":"X","x":50,"y":50,"color":"#f00"}]}</code></pre>`
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
})
