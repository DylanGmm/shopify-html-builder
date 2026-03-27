import type { ComponentDef } from '../types'
import { icHeader } from './components/ic-header'
import { icHero } from './components/ic-hero'
import { icSplitLeft } from './components/ic-split-left'
import { icSplitRight } from './components/ic-split-right'
import { icGrid3col } from './components/ic-grid-3col'
import { icCenterCopy } from './components/ic-center-copy'
import { icGridMixed } from './components/ic-grid-mixed'
import { icOptionsRow } from './components/ic-options-row'
import { icBlueprint } from './components/ic-blueprint'

const COMPONENTS: ComponentDef[] = [
  icHeader,
  icHero,
  icGridMixed,
  icSplitLeft,
  icSplitRight,
  icGrid3col,
  icCenterCopy,
  icOptionsRow,
  icBlueprint,
]

const COMPONENT_MAP = new Map(COMPONENTS.map((c) => [c.id, c]))

/** Get all registered component definitions */
export function getAllComponents(): ComponentDef[] {
  return COMPONENTS
}

/** Look up a component definition by ID */
export function getComponent(id: string): ComponentDef | undefined {
  return COMPONENT_MAP.get(id)
}
