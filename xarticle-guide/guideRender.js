import {
  buildChecklist,
  compareViews,
  componentExplainers,
  fundamentals,
  glossary,
  journeySteps,
  systemNodes,
} from './guideData.js'

const compareOrder = ['real', 'starter']
const PERCENT_SCALE = 100

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const panelIdByKey = {
  'component-button': 'component-panel',
  'step-button': 'journey-panel',
  'view-button': 'compare-panel',
}

const renderButtons = (items, activeId, key) =>
  items
    .map(
      (item) => `
        <button class="chip" data-${key}="${item.id}" aria-controls="${panelIdByKey[key]}" aria-pressed="${item.id === activeId}">
          ${escapeHtml(item.label)}
        </button>
      `,
    )
    .join('')

const renderDiagram = (activeStep, selectedNodeId) =>
  systemNodes
    .map((node) => {
      const active = activeStep.highlightIds.includes(node.id) ? ' is-active' : ''
      const selected = selectedNodeId === node.id ? ' is-selected' : ''
      return `
        <button class="node${active}${selected}" data-node-button="${node.id}" aria-pressed="${selected !== ''}">
          <h3>${escapeHtml(node.label)}</h3>
          <p>${escapeHtml(node.note)}</p>
        </button>
      `
    })
    .join('')

const renderList = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

const renderFactCards = () =>
  fundamentals
    .map(
      (item) => `
        <article class="fact-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.copy)}</p>
        </article>
      `,
    )
    .join('')

const renderGlossary = () =>
  glossary
    .map(
      ([term, meaning]) => `
        <article class="glossary-item">
          <h3>${escapeHtml(term)}</h3>
          <p>${escapeHtml(meaning)}</p>
        </article>
      `,
    )
    .join('')

const getViewModel = (state) => {
  const activeStep = journeySteps.find((step) => step.id === state.stepId) ?? journeySteps[0]
  const activeComponent = componentExplainers.find((item) => item.id === state.componentId) ?? componentExplainers[0]
  const activeView = compareViews[state.viewId] ?? compareViews.real
  const activeStepNumber = journeySteps.findIndex((step) => step.id === activeStep.id) + 1
  return {
    activeComponent,
    activeNodeId: state.selectedNodeId,
    activeStep,
    activeStepNumber,
    activeView,
    progressWidth: `${(activeStepNumber / journeySteps.length) * PERCENT_SCALE}%`,
  }
}

const renderHero = () => `
  <header class="hero">
    <p class="eyebrow">Standalone guide for Xarticle.co only</p>
    <h1>Xarticle.co system guide</h1>
    <p class="hero-copy">
      This page explains how Xarticle.co works from the first pasted link to the final preview and export.
      It uses plain language, real app parts, and a smaller starter version you can build on your own.
    </p>
  </header>
`

const renderDiagramSection = ({ activeNodeId, activeStep, activeStepNumber, progressWidth }) => `
  <section class="panel">
    <p class="section-tag">Big picture</p>
    <h2>The whole system from A to Z</h2>
    <p class="section-copy">
      Read this like a story: the browser starts the request, the worker fetches source data, parsers clean it,
      and the frontend shows one trusted article result.
    </p>
    <div class="diagram-topline">
      <article class="legend-card">
        <h3 data-panel="legend-title">How to read this map</h3>
        <p>Bright boxes are active in the current step. Click any box to jump to the plain-English explanation below.</p>
        <div class="legend-row">
          <span class="legend-dot legend-dot-active"></span>
          <span>Active right now</span>
        </div>
        <div class="legend-row">
          <span class="legend-dot"></span>
          <span>Still part of the system, just not the current step</span>
        </div>
      </article>
      <article class="progress-card">
        <p class="progress-label">Story progress</p>
        <h3 data-panel="progress-copy">Step ${activeStepNumber} of ${journeySteps.length}: ${escapeHtml(activeStep.title.replace(/^Step \d+:\s*/, ''))}</h3>
        <div class="progress-track" aria-hidden="true">
          <span class="progress-fill" style="width: ${progressWidth}"></span>
        </div>
      </article>
    </div>
    <div class="diagram">${renderDiagram(activeStep, activeNodeId)}</div>
  </section>
`

const renderJourneySection = (activeStep) => `
  <section class="panel">
    <p class="section-tag">Journey</p>
    <h2>Follow one request step by step</h2>
    <div class="chip-row">${renderButtons(journeySteps, activeStep.id, 'step-button')}</div>
    <article class="story-card" id="journey-panel" aria-live="polite">
      <h3 data-panel="journey-title">${escapeHtml(activeStep.title)}</h3>
      <p data-panel="journey-copy">${escapeHtml(activeStep.copy)}</p>
    </article>
  </section>
`

const renderComponentSection = (activeComponent) => `
  <section class="panel">
    <p class="section-tag">Deep dive</p>
    <h2>Click a system part to learn what it does</h2>
    <div class="chip-row">${renderButtons(componentExplainers, activeComponent.id, 'component-button')}</div>
    <article class="story-card" id="component-panel" aria-live="polite">
      <h3 data-panel="component-title">${escapeHtml(activeComponent.title)}</h3>
      <p data-panel="component-copy">${escapeHtml(activeComponent.copy)}</p>
      <p class="why-line"><strong>Why it exists:</strong> ${escapeHtml(activeComponent.why)}</p>
    </article>
  </section>
`

const renderCompareSection = (activeView) => `
  <section class="panel">
    <p class="section-tag">Build your own</p>
    <h2>Real app versus starter version</h2>
    <div class="chip-row">${renderButtons(compareOrder.map((id) => compareViews[id]), activeView.id, 'view-button')}</div>
    <article class="story-card" id="compare-panel" aria-live="polite">
      <h3 data-panel="compare-title">${escapeHtml(activeView.title)}</h3>
      <p data-panel="compare-copy">${escapeHtml(activeView.copy)}</p>
      <ul class="stack-list">${renderList(activeView.layers)}</ul>
    </article>
  </section>
`

const renderReferenceSection = () => `
  <section class="panel split-panel">
    <div>
      <p class="section-tag">Fundamentals</p>
      <h2>System design rules that matter here</h2>
      <div class="facts">${renderFactCards()}</div>
    </div>
    <div>
      <p class="section-tag">Glossary</p>
      <h2>Words you should know</h2>
      <div class="glossary-grid">${renderGlossary()}</div>
    </div>
  </section>
`

const renderChecklistSection = () => `
  <section class="panel">
    <p class="section-tag">Starter checklist</p>
    <h2>How to build your own smaller version</h2>
    <ol class="checklist">${renderList(buildChecklist)}</ol>
  </section>
`

export const createGuideMarkup = (state) => {
  const viewModel = getViewModel(state)
  return `
    <div class="guide-shell">
      ${renderHero()}
      <main class="layout">
        ${renderDiagramSection(viewModel)}
        ${renderJourneySection(viewModel.activeStep)}
        ${renderComponentSection(viewModel.activeComponent)}
        ${renderCompareSection(viewModel.activeView)}
        ${renderReferenceSection()}
        ${renderChecklistSection()}
      </main>
    </div>
  `
}
