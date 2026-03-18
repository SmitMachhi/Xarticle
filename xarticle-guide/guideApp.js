/* global document, HTMLElement */

import { componentExplainers, journeySteps, systemNodes } from './guideData.js'
import { createGuideMarkup } from './guideRender.js'

const createState = () => ({
  componentId: componentExplainers[0].id,
  selectedNodeId: null,
  stepId: journeySteps[0].id,
  viewId: 'real',
})

const readClickAction = (target) => ({
  componentId: target.closest('[data-component-button]')?.dataset.componentButton,
  nodeId: target.closest('[data-node-button]')?.dataset.nodeButton,
  stepId: target.closest('[data-step-button]')?.dataset.stepButton,
  viewId: target.closest('[data-view-button]')?.dataset.viewButton,
})

const selectorByAction = (action) => {
  if (action.stepId) return `[data-step-button="${action.stepId}"]`
  if (action.componentId) return `[data-component-button="${action.componentId}"]`
  if (action.viewId) return `[data-view-button="${action.viewId}"]`
  if (!action.nodeId) return null
  return `[data-node-button="${action.nodeId}"]`
}

const syncNodeSelection = (state, nodeId) => {
  const node = systemNodes.find((item) => item.id === nodeId)
  if (node?.componentId) {
    state.componentId = node.componentId
  }
}

const hasAction = (action) => Boolean(action.stepId || action.componentId || action.viewId || action.nodeId)

const createAnnouncer = () => {
  const announcer = document.createElement('div')
  announcer.className = 'sr-only'
  announcer.dataset.liveAnnouncer = 'true'
  announcer.setAttribute('aria-live', 'polite')
  announcer.setAttribute('aria-atomic', 'true')
  return announcer
}

const toAnnouncement = (state, action) => {
  if (action.stepId) {
    const step = journeySteps.find((item) => item.id === state.stepId) ?? journeySteps[0]
    return step.title
  }
  if (action.nodeId || action.componentId) {
    const component = componentExplainers.find((item) => item.id === state.componentId) ?? componentExplainers[0]
    return component.title
  }
  return state.viewId === 'starter' ? 'Starter version view' : 'Real app view'
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
    if (action.stepId) {
      state.stepId = action.stepId
      state.selectedNodeId = null
    }
    if (action.componentId) {
      state.componentId = action.componentId
      state.selectedNodeId = null
    }
    if (action.viewId) {
      state.viewId = action.viewId
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
  announcer.textContent = journeySteps[0].title
}
