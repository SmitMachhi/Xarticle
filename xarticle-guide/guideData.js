import { chartGroups, chartSummary, runtimePaths, systemNodes } from './chartData.js'
import { frontendComponents } from './frontendComponents.js'
import { pipelineComponents } from './pipelineComponents.js'
import { fundamentals, glossary } from './referenceData.js'
import { workerComponents } from './workerComponents.js'

export { chartGroups, chartSummary, fundamentals, glossary, runtimePaths, systemNodes }

export const runtimeComponents = [
  ...frontendComponents,
  ...workerComponents,
  ...pipelineComponents,
]
