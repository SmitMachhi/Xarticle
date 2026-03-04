import type { ComponentType } from 'react'
import RequestResponseFlow from './RequestResponseFlow.tsx'
import StatusCodeGrid from './StatusCodeGrid.tsx'
import JsonExplorer from './JsonExplorer.tsx'
import ClientServerSplit from './ClientServerSplit.tsx'
import TraditionalVsServerless from './TraditionalVsServerless.tsx'
import UrlAnatomy from './UrlAnatomy.tsx'
import RouteMatcher from './RouteMatcher.tsx'
import TokenTimeline from './TokenTimeline.tsx'
import CorsBlockedVsProxied from './CorsBlockedVsProxied.tsx'
import CacheSimulator from './CacheSimulator.tsx'
import FallbackChainDiagram from './FallbackChainDiagram.tsx'
import TimeoutBar from './TimeoutBar.tsx'
import DiscriminatedUnionExplorer from './DiscriminatedUnionExplorer.tsx'
import TypeContractFlow from './TypeContractFlow.tsx'

const VISUALS: Record<string, ComponentType> = {
  RequestResponseFlow,
  StatusCodeGrid,
  JsonExplorer,
  ClientServerSplit,
  TraditionalVsServerless,
  UrlAnatomy,
  RouteMatcher,
  TokenTimeline,
  CorsBlockedVsProxied,
  CacheSimulator,
  FallbackChainDiagram,
  TimeoutBar,
  DiscriminatedUnionExplorer,
  TypeContractFlow,
}

export function getVisual(key: string): ComponentType | null {
  return VISUALS[key] ?? null
}
