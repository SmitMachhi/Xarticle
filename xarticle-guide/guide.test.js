/* global document, MouseEvent */

// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'

import { mountGuide } from './guideApp.js'

describe('xarticle guide', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="guide-root"></div>'
  })

  it('renders the xarticle-only walkthrough with the first journey step selected', () => {
    mountGuide(document.getElementById('guide-root'))

    expect(document.querySelector('h1')?.textContent).toContain('Xarticle.co')
    expect(document.querySelector('[data-panel="chart-title"]')?.textContent).toContain('Runtime system chart')
    expect(document.querySelector('[data-panel="path-title"]')?.textContent).toContain('Status URL')
    expect(document.querySelector('[data-panel="component-path"]')?.textContent).toContain('src/main.tsx')
  })

  it('shows the GraphQL runtime path in the guide chart', () => {
    mountGuide(document.getElementById('guide-root'))

    expect(document.querySelector('[data-node-id="graphql"]')?.textContent).toContain('GraphQL')
    expect(document.querySelector('[data-node-id="tweet-mapper"]')?.textContent).toContain('tweetMapper.ts')
    expect(document.querySelector('[data-node-id="worker-article-parser"]')?.textContent).toContain('worker articleParser.ts')
    expect(document.querySelector('[data-node-id="image-proxy"]')?.textContent).toContain('imageProxy.ts')
  })

  it('switches between the status and article extraction paths', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-path-button="article-html"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-path-button="article-html"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="path-title"]')?.textContent).toContain('Article URL path')
    expect(document.querySelector('[data-panel="path-copy"]')?.textContent).toContain('raw HTML')
    expect(document.querySelector('[data-panel="path-copy"]')?.textContent).toContain('browser')
  })

  it('shows a detailed component encyclopedia entry for a runtime module', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-component-button="x-client"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-component-button="x-client"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="component-title"]')?.textContent).toContain('X GraphQL client')
    expect(document.querySelector('[data-panel="component-path"]')?.textContent).toContain('worker/src/core/xClient.ts')
    expect(document.querySelector('[data-panel="component-how"]')?.textContent).toContain('GraphQL')
  })

  it('lets the system chart switch the detailed component explanation', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-node-button="threadloom-parser"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-component-button="threadloom-parser"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-node-button="threadloom-parser"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="component-title"]')?.textContent).toContain('Status payload parser')
  })

  it('switches the selected path when a node from the other branch is clicked', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-node-button="html-parser"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-path-button="article-html"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="path-title"]')?.textContent).toContain('Article URL path')
  })

  it('keeps keyboard focus on the selected runtime control after rerender', () => {
    mountGuide(document.getElementById('guide-root'))

    const pathButton = document.querySelector('[data-path-button="article-html"]')
    pathButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.activeElement?.getAttribute('data-path-button')).toBe('article-html')
  })

  it('shows a visual legend and chart explainer for the runtime diagram', () => {
    mountGuide(document.getElementById('guide-root'))

    expect(document.querySelector('[data-panel="legend-title"]')?.textContent).toContain('How to read this map')
    expect(document.querySelector('[data-panel="chart-copy"]')?.textContent).toContain('status URL')
    expect(document.querySelector('[data-panel="chart-copy"]')?.textContent).toContain('article URL')
  })

  it('updates the component detail when a different runtime module is selected', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-component-button="pdf-export"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-panel="component-title"]')?.textContent).toContain('PDF export facade')
    expect(document.querySelector('[data-panel="component-why"]')?.textContent).toContain('download')
  })

  it('links the interactive controls to polite live panels for accessibility', () => {
    mountGuide(document.getElementById('guide-root'))

    expect(document.querySelector('[data-path-button="status-graphql"]')?.getAttribute('aria-controls')).toBe('path-panel')
    expect(document.querySelector('[data-component-button="frontend"]')?.getAttribute('aria-controls')).toBe('component-panel')
    expect(document.querySelector('[data-node-button="graphql"]')?.getAttribute('aria-controls')).toBe('component-panel')
  })

  it('updates a persistent live announcer when the selected content changes', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-path-button="article-html"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-live-announcer]')?.textContent).toContain('Article URL path')
    expect(document.querySelector('[data-live-announcer]')?.textContent).toContain('browser parser')
  })
})
