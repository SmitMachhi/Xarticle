import {
  chartGroups,
  chartSummary,
  fundamentals,
  glossary,
  runtimeComponents,
  runtimePaths,
  systemNodes,
} from './guideData.js'

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const panelIdByKey = {
  'component-button': 'component-panel',
  'path-button': 'path-panel',
}

const byId = (items, id) => items.find((item) => item.id === id) ?? items[0]

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

const renderComponentButtons = (activeId) =>
  runtimeComponents
    .map(
      (item) => `
        <button class="chip chip-compact" data-component-button="${item.id}" aria-controls="${panelIdByKey['component-button']}" aria-pressed="${item.id === activeId}">
          ${escapeHtml(item.label)}
        </button>
      `,
    )
    .join('')

const renderList = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

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

const renderNode = (node, activeNodeIds, selectedNodeId) => {
  const active = activeNodeIds.includes(node.id) ? ' is-active' : ''
  const selected = selectedNodeId === node.id ? ' is-selected' : ''
  return `
    <button class="node${active}${selected}" data-node-button="${node.id}" data-node-id="${node.id}" aria-controls="component-panel" aria-pressed="${selected !== ''}">
      <h3>${escapeHtml(node.label)}</h3>
      <p>${escapeHtml(node.note)}</p>
    </button>
  `
}

const renderChartGroup = (group, activeNodeIds, selectedNodeId) => `
  <section class="chart-group">
    <p class="chart-group-label">${escapeHtml(group.title)}</p>
    <div class="diagram">
      ${group.nodeIds.map((nodeId) => renderNode(byId(systemNodes, nodeId), activeNodeIds, selectedNodeId)).join('')}
    </div>
  </section>
`

const renderHero = () => `
  <header class="hero">
    <p class="eyebrow">Standalone guide for Xarticle.co only</p>
    <h1>Xarticle.co system guide</h1>
    <p class="hero-copy">
      This page explains the real runtime system from the first pasted URL to the final preview and export.
      It explicitly shows the GraphQL status path, the raw HTML article path, and the shared clean article model in the middle.
    </p>
  </header>
`

const renderChartSection = (activePath, selectedNodeId) => `
  <section class="panel">
    <p class="section-tag">Master chart</p>
    <h2 data-panel="chart-title">${escapeHtml(chartSummary.title)}</h2>
    <p class="section-copy" data-panel="chart-copy">${escapeHtml(chartSummary.copy)}</p>
    <div class="diagram-topline">
      <article class="legend-card">
        <h3 data-panel="legend-title">How to read this map</h3>
        <p>Bright boxes belong to the selected extraction path. The darker outline shows the box you clicked, and the detail panel explains the runtime module behind that box.</p>
        <div class="legend-row">
          <span class="legend-dot legend-dot-active"></span>
          <span>Part of the selected path</span>
        </div>
        <div class="legend-row">
          <span class="legend-dot legend-dot-selected"></span>
          <span>The exact component you are inspecting</span>
        </div>
      </article>
      <article class="progress-card">
        <p class="progress-label">Big truth</p>
        <h3>One app, two extraction paths</h3>
        <p>Status URLs go through GraphQL. Article URLs go through raw HTML. Both paths end in the same clean article model.</p>
      </article>
    </div>
    <div class="chart-stack">
      ${chartGroups.map((group) => renderChartGroup(group, activePath.focusNodeIds, selectedNodeId)).join('')}
    </div>
  </section>
`

const renderPathSection = (activePath) => `
  <section class="panel">
    <p class="section-tag">Runtime paths</p>
    <h2>Pick the extraction path you want to study</h2>
    <div class="chip-row">${renderButtons(runtimePaths, activePath.id, 'path-button')}</div>
    <article class="story-card" id="path-panel">
      <h3 data-panel="path-title">${escapeHtml(activePath.title)}</h3>
      <p data-panel="path-copy">${escapeHtml(activePath.copy)}</p>
      <ol class="stack-list path-steps">${renderList(activePath.steps)}</ol>
    </article>
  </section>
`

const renderComponentSection = (activeComponent) => `
  <section class="panel">
    <p class="section-tag">Component encyclopedia</p>
    <h2>Every important runtime component and what it does</h2>
    <div class="chip-row chip-grid">${renderComponentButtons(activeComponent.id)}</div>
    <article class="story-card" id="component-panel">
      <h3 data-panel="component-title">${escapeHtml(activeComponent.title)}</h3>
      <p class="detail-line"><strong>File:</strong> <span data-panel="component-path">${escapeHtml(activeComponent.path)}</span></p>
      <p data-panel="component-what"><strong>What it does:</strong> ${escapeHtml(activeComponent.what)}</p>
      <p data-panel="component-how"><strong>How it works:</strong> ${escapeHtml(activeComponent.how)}</p>
      <p data-panel="component-why"><strong>Why it exists:</strong> ${escapeHtml(activeComponent.why)}</p>
      <p><strong>Input:</strong> ${escapeHtml(activeComponent.input)}</p>
      <p><strong>Output:</strong> ${escapeHtml(activeComponent.output)}</p>
      <p><strong>Depends on:</strong> ${escapeHtml(activeComponent.dependsOn)}</p>
      <p><strong>Used by:</strong> ${escapeHtml(activeComponent.usedBy)}</p>
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

const getViewModel = (state) => ({
  activeComponent: byId(runtimeComponents, state.componentId),
  activePath: byId(runtimePaths, state.pathId),
  selectedNodeId: state.selectedNodeId,
})

export const createGuideMarkup = (state) => {
  const viewModel = getViewModel(state)
  return `
    <div class="guide-shell">
      ${renderHero()}
      <main class="layout">
        ${renderChartSection(viewModel.activePath, viewModel.selectedNodeId)}
        ${renderPathSection(viewModel.activePath)}
        ${renderComponentSection(viewModel.activeComponent)}
        ${renderReferenceSection()}
      </main>
    </div>
  `
}
