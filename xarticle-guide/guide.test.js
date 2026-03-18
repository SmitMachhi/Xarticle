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
    expect(document.querySelector('[data-step-button="paste-url"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="journey-title"]')?.textContent).toContain('Step 1')
    expect(document.querySelector('[data-panel="journey-copy"]')?.textContent).toContain('Paste one public X link')
  })

  it('switches the journey explanation when a new step is selected', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-step-button="parse-clean"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-step-button="parse-clean"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="journey-title"]')?.textContent).toContain('Step 5')
    expect(document.querySelector('[data-panel="journey-copy"]')?.textContent).toContain('worker')
    expect(document.querySelector('[data-panel="journey-copy"]')?.textContent).toContain('browser')
  })

  it('switches between the real app and the simpler starter version', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-view-button="starter"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-view-button="starter"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="compare-title"]')?.textContent).toContain('Starter version')
    expect(document.querySelector('[data-panel="compare-copy"]')?.textContent).toContain('one backend route')
  })

  it('shows a plain-language explanation for the selected component', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-component-button="worker"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-component-button="worker"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="component-title"]')?.textContent).toContain('Worker backend')
    expect(document.querySelector('[data-panel="component-copy"]')?.textContent).toContain('backend door')
  })

  it('lets the diagram itself switch the component explanation', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-node-button="exports"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-component-button="exports"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-node-button="exports"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-panel="component-title"]')?.textContent).toContain('Export pipeline')
  })

  it('keeps keyboard focus on the selected control after rerender', () => {
    mountGuide(document.getElementById('guide-root'))

    const stepButton = document.querySelector('[data-step-button="parse-clean"]')
    stepButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.activeElement?.getAttribute('data-step-button')).toBe('parse-clean')
  })

  it('shows a visual legend and a live progress readout for the prettier diagram', () => {
    mountGuide(document.getElementById('guide-root'))

    expect(document.querySelector('[data-panel="legend-title"]')?.textContent).toContain('How to read this map')
    expect(document.querySelector('[data-panel="progress-copy"]')?.textContent).toContain('Step 1 of 6')
    expect(document.querySelector('[data-panel="progress-copy"]')?.textContent).toContain('Paste one public X link')
  })

  it('updates the progress readout when the active journey step changes', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-step-button="preview-export"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-panel="progress-copy"]')?.textContent).toContain('Step 6 of 6')
    expect(document.querySelector('[data-panel="progress-copy"]')?.textContent).toContain('frontend shows the result')
  })

  it('links the interactive controls to polite live panels for accessibility', () => {
    mountGuide(document.getElementById('guide-root'))

    expect(document.querySelector('[data-step-button="paste-url"]')?.getAttribute('aria-controls')).toBe('journey-panel')
    expect(document.querySelector('[data-component-button="frontend"]')?.getAttribute('aria-controls')).toBe('component-panel')
    expect(document.querySelector('#journey-panel')?.getAttribute('aria-live')).toBe('polite')
    expect(document.querySelector('#component-panel')?.getAttribute('aria-live')).toBe('polite')
  })

  it('updates a persistent live announcer when the selected content changes', () => {
    mountGuide(document.getElementById('guide-root'))

    document.querySelector('[data-step-button="worker-route"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.querySelector('[data-live-announcer]')?.textContent).toContain('Step 3')
    expect(document.querySelector('[data-live-announcer]')?.textContent).toContain('worker receives the request')
  })
})
