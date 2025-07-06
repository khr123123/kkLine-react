import { create } from 'zustand'

interface UserState {
  user: API.LoginUserVO | null
  setUser: (user: API.LoginUserVO) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null })
}))
