import { create } from 'zustand'
import { persist, PersistOptions, StorageValue } from 'zustand/middleware'

interface UserState {
  user: API.LoginUserVO | null
  setUser: (user: API.LoginUserVO) => void
  clearUser: () => void
}

// 自定义 sessionStorage 适配器，符合 PersistStorage<UserState> 类型
const sessionStorageStorage: PersistOptions<UserState, UserState>['storage'] = {
  getItem: (
    name: string
  ): StorageValue<UserState> | Promise<StorageValue<UserState> | null> | null => {
    const value = sessionStorage.getItem(name)
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: StorageValue<UserState>) => {
    sessionStorage.setItem(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    sessionStorage.removeItem(name)
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'kkline-user-session-storage',
      storage: sessionStorageStorage
    }
  )
)
