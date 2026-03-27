import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { AnySlotValue, Project, SectionInstance } from '../types'
import { createDefaultSlotValues } from '../utils/sectionDefaults'
import { cloneSectionsWithNewUids } from '../utils/cloneSections'

const INITIAL_PROJECT: Project = {
  name: 'Untitled Project',
  rootClass: 'ic-page',
  productName: '',
  sections: [],
  cssVars: {},
  placeholderSource: 'remote',
  includeProductJsonLd: false,
  includeSrcsetInExport: false,
  previewThemeStylesheetUrls: [],
  includeThemeStylesheetUrlsInExport: false,
  maxContentWidth: 1200,
}

/**
 * Create first project id + map for initial / migration.
 * 初始化或迁移用的首个工程 ID 与映射表。
 */
function seedProjects(): { activeProjectId: string; projects: Record<string, Project> } {
  const id = nanoid(10)
  return {
    activeProjectId: id,
    projects: { [id]: { ...INITIAL_PROJECT } },
  }
}

const SEED = seedProjects()

/**
 * Active project snapshot from editor state.
 * 从 store 读取当前激活的工程。
 */
export function getActiveProject(s: EditorState): Project {
  const p = s.projects[s.activeProjectId]
  if (p) return p
  const first = Object.keys(s.projects)[0]
  if (first) return s.projects[first]
  return { ...INITIAL_PROJECT }
}

/** React selector: subscribe to the active `Project` object. */
export function selectActiveProject(s: EditorState): Project {
  return getActiveProject(s)
}

interface EditorState {
  /** Which SKU project is being edited */
  activeProjectId: string
  /** All locally persisted SKU projects */
  projects: Record<string, Project>

  selectedUid: string | null

  addSection: (componentId: string) => void
  removeSection: (uid: string) => void
  moveSection: (fromIndex: number, toIndex: number) => void
  duplicateSection: (uid: string) => void
  updateSlot: (uid: string, slotId: string, value: AnySlotValue) => void
  selectSection: (uid: string | null) => void
  updateProject: (
    patch: Partial<
      Pick<
        Project,
        | 'name'
        | 'rootClass'
        | 'productName'
        | 'placeholderSource'
        | 'includeProductJsonLd'
        | 'includeSrcsetInExport'
        | 'previewThemeStylesheetUrls'
        | 'includeThemeStylesheetUrlsInExport'
        | 'maxContentWidth'
      >
    >,
  ) => void
  updateCssVar: (key: string, value: string) => void
  replaceProject: (project: Project) => void
  /** Clear sections + metadata of the active project only */
  resetActiveProject: () => void
  /** New empty SKU with its own slot */
  createBlankProject: () => void
  /** Deep-copy active project into a new slot and switch to it */
  duplicateActiveProject: () => void
  switchToProject: (id: string) => void
  deleteProject: (id: string) => void
  /**
   * Copy section sequence from another SKU into the active one (F-21 light).
   * 从另一 SKU 复制区块序列到当前 SKU（替换或追加）。
   */
  copySequenceFromProject: (sourceProjectId: string, mode: 'replace' | 'append') => void
}

type PersistedV0 = { project?: Project }
type PersistedV1 = { activeProjectId: string; projects: Record<string, Project> }

/**
 * Migrate legacy single-project storage to multi-project shape.
 * 将旧版仅 `project` 字段迁移为多工程结构。
 */
function migratePersisted(persisted: unknown): PersistedV1 {
  if (persisted && typeof persisted === 'object') {
    const o = persisted as Partial<PersistedV1> & PersistedV0
    if (o.projects && typeof o.projects === 'object' && typeof o.activeProjectId === 'string') {
      if (o.projects[o.activeProjectId]) return o as PersistedV1
      const keys = Object.keys(o.projects)
      if (keys.length > 0) {
        return { activeProjectId: keys[0], projects: o.projects as Record<string, Project> }
      }
    }
    if (o.project && typeof o.project === 'object') {
      const id = nanoid(10)
      return { activeProjectId: id, projects: { [id]: o.project as Project } }
    }
  }
  return { ...SEED }
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      activeProjectId: SEED.activeProjectId,
      projects: SEED.projects,

      selectedUid: null,

      addSection: (componentId) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          const section: SectionInstance = {
            uid: nanoid(8),
            componentId,
            values: createDefaultSlotValues(componentId),
          }
          return {
            projects: {
              ...state.projects,
              [id]: { ...proj, sections: [...proj.sections, section] },
            },
            selectedUid: section.uid,
          }
        }),

      removeSection: (uid) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          return {
            projects: {
              ...state.projects,
              [id]: {
                ...proj,
                sections: proj.sections.filter((s) => s.uid !== uid),
              },
            },
            selectedUid: state.selectedUid === uid ? null : state.selectedUid,
          }
        }),

      moveSection: (fromIndex, toIndex) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          const sections = [...proj.sections]
          const [moved] = sections.splice(fromIndex, 1)
          sections.splice(toIndex, 0, moved)
          return {
            projects: {
              ...state.projects,
              [id]: { ...proj, sections },
            },
          }
        }),

      duplicateSection: (uid) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          const idx = proj.sections.findIndex((s) => s.uid === uid)
          if (idx === -1) return state
          const original = proj.sections[idx]
          const clone: SectionInstance = {
            uid: nanoid(8),
            componentId: original.componentId,
            values: JSON.parse(JSON.stringify(original.values)),
          }
          const sections = [...proj.sections]
          sections.splice(idx + 1, 0, clone)
          return {
            projects: {
              ...state.projects,
              [id]: { ...proj, sections },
            },
            selectedUid: clone.uid,
          }
        }),

      updateSlot: (uid, slotId, value) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          return {
            projects: {
              ...state.projects,
              [id]: {
                ...proj,
                sections: proj.sections.map((s) =>
                  s.uid === uid ? { ...s, values: { ...s.values, [slotId]: value } } : s,
                ),
              },
            },
          }
        }),

      selectSection: (uid) => set({ selectedUid: uid }),

      updateProject: (patch) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          return {
            projects: {
              ...state.projects,
              [id]: { ...proj, ...patch },
            },
          }
        }),

      updateCssVar: (key, value) =>
        set((state) => {
          const id = state.activeProjectId
          const proj = state.projects[id]
          if (!proj) return state
          return {
            projects: {
              ...state.projects,
              [id]: {
                ...proj,
                cssVars: { ...proj.cssVars, [key]: value },
              },
            },
          }
        }),

      replaceProject: (project) =>
        set((state) => {
          const id = state.activeProjectId
          return {
            projects: {
              ...state.projects,
              [id]: project,
            },
            selectedUid: project.sections[0]?.uid ?? null,
          }
        }),

      resetActiveProject: () =>
        set((state) => {
          const id = state.activeProjectId
          return {
            projects: {
              ...state.projects,
              [id]: {
                ...INITIAL_PROJECT,
                cssVars: {},
                placeholderSource: 'remote',
                includeProductJsonLd: false,
                includeSrcsetInExport: false,
                previewThemeStylesheetUrls: [],
                includeThemeStylesheetUrlsInExport: false,
                maxContentWidth: 1200,
              },
            },
            selectedUid: null,
          }
        }),

      createBlankProject: () =>
        set((state) => {
          const newId = nanoid(10)
          return {
            activeProjectId: newId,
            projects: {
              ...state.projects,
              [newId]: { ...INITIAL_PROJECT, name: 'Untitled Project' },
            },
            selectedUid: null,
          }
        }),

      duplicateActiveProject: () =>
        set((state) => {
          const curId = state.activeProjectId
          const cur = state.projects[curId]
          if (!cur) return state
          const newId = nanoid(10)
          const clone = JSON.parse(JSON.stringify(cur)) as Project
          clone.name = `${clone.name || 'Project'} (copy)`.slice(0, 120)
          return {
            activeProjectId: newId,
            projects: { ...state.projects, [newId]: clone },
            selectedUid: clone.sections[0]?.uid ?? null,
          }
        }),

      switchToProject: (targetId) =>
        set((state) => {
          if (!state.projects[targetId] || targetId === state.activeProjectId) return state
          const p = state.projects[targetId]
          return {
            activeProjectId: targetId,
            selectedUid: p.sections[0]?.uid ?? null,
          }
        }),

      deleteProject: (removeId) =>
        set((state) => {
          const keys = Object.keys(state.projects)
          if (keys.length <= 1 || !state.projects[removeId]) return state
          const rest: Record<string, Project> = { ...state.projects }
          delete rest[removeId]
          let nextActive = state.activeProjectId
          if (nextActive === removeId) {
            nextActive = Object.keys(rest)[0]
          }
          const nextProj = rest[nextActive]
          return {
            projects: rest,
            activeProjectId: nextActive,
            selectedUid: nextProj?.sections[0]?.uid ?? null,
          }
        }),

      copySequenceFromProject: (sourceProjectId, mode) =>
        set((state) => {
          const activeId = state.activeProjectId
          if (!sourceProjectId || sourceProjectId === activeId) return state
          const source = state.projects[sourceProjectId]
          const target = state.projects[activeId]
          if (!source || !target) return state

          const cloned = cloneSectionsWithNewUids(source.sections)
          const nextSections =
            mode === 'replace' ? cloned : [...target.sections, ...cloned]

          return {
            projects: {
              ...state.projects,
              [activeId]: { ...target, sections: nextSections },
            },
            selectedUid: cloned[0]?.uid ?? state.selectedUid,
          }
        }),
    }),
    {
      name: 'shopify-html-builder-v1',
      version: 1,
      migrate: migratePersisted,
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        projects: state.projects,
      }),
    },
  ),
)
