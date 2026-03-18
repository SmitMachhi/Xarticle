/* global document, HTMLElement */

import { runtimeComponents, runtimePaths, systemNodes } from './guideData.js'
import { createGuideMarkup } from './guideRender.js'

const createState = () => ({
  componentId: runtimeComponents[0].id,
  pathId: runtimePaths[0].id,
  selectedNodeId: null,
})

const readClickAction = (target) => ({
  componentId: target.closest('[data-component-button]')?.dataset.componentButton,
  nodeId: target.closest('[data-node-button]')?.dataset.nodeButton,
  pathId: target.closest('[data-path-button]')?.dataset.pathButton,
})

const selectorByAction = (action) => {
  if (action.pathId) return `[data-path-button="${action.pathId}"]`
  if (action.componentId) return `[data-component-button="${action.componentId}"]`
  if (!action.nodeId) return null
  return `[data-node-button="${action.nodeId}"]`
}

const syncNodeSelection = (state, nodeId) => {
  const node = systemNodes.find((item) => item.id === nodeId)
  const matchingPaths = runtimePaths.filter((item) => item.focusNodeIds.includes(nodeId))
  if (node?.componentId) {
    state.componentId = node.componentId
  }
  if (matchingPaths.length === 1) {
    state.pathId = matchingPaths[0].id
  }
}

const hasAction = (action) => Boolean(action.pathId || action.componentId || action.nodeId)

const createAnnouncer = () => {
  const announcer = document.createElement('div')
  announcer.className = 'sr-only'
  announcer.dataset.liveAnnouncer = 'true'
  announcer.setAttribute('aria-live', 'polite')
  announcer.setAttribute('aria-atomic', 'true')
  return announcer
}

const toAnnouncement = (state, action) => {
  if (action.pathId) {
    const path = runtimePaths.find((item) => item.id === state.pathId) ?? runtimePaths[0]
    return `${path.title}: ${path.copy}`
  }
  if (action.nodeId || action.componentId) {
    const component = runtimeComponents.find((item) => item.id === state.componentId) ?? runtimeComponents[0]
    return `${component.title}: ${component.how}`
  }
  return 'Xarticle runtime guide'
}

export const mountGuide = (root) => {
  if (!root) throw new Error('Guide root element is required.')
  const state = createState()
  const content = document.createElement('div')
  const announcer = createAnnouncer()
  root.replaceChildren(content, announcer)
  const render = (focusSelector = null) => {
    content.innerHTML = createGuideMarkup(state)
    root.querySelector(focusSelector)?.focus()
  }
  root.onclick = (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const action = readClickAction(target)
    if (!hasAction(action)) return
    if (action.pathId) {
      state.pathId = action.pathId
      state.selectedNodeId = null
    }
    if (action.componentId) {
      state.componentId = action.componentId
      state.selectedNodeId = null
    }
    if (action.nodeId) {
      state.selectedNodeId = action.nodeId
      syncNodeSelection(state, action.nodeId)
    }
    render(selectorByAction(action))
    announcer.textContent = toAnnouncement(state, action)
  }
  render()
  announcer.textContent = runtimePaths[0].title
}
