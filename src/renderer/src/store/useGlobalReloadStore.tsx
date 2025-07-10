// useGlobalReloadStore.ts
import { create } from 'zustand'

interface GlobalReloadStore {
    reloadMap: Record<string, number>  // key对应的数字刷新计数
    triggerReload: (key: string) => void
}

export const useGlobalReloadStore = create<GlobalReloadStore>((set) => ({
    reloadMap: {},
    triggerReload: (key: string) =>
        set(state => {
            const current = state.reloadMap[key] || 0
            return { reloadMap: { ...state.reloadMap, [key]: current + 1 } }
        }),
}))
