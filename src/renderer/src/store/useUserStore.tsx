import { create } from 'zustand'

interface LoginUser {
  id: number
  userName: string
  userAvatar: string
  userEmail: string
  userProfile: string
  userRole: 'user' | 'admin' | 'ban'
  createTime: string
  updateTime: string
  userSex: 0 | 1 | 2
  lastLoginTime: string
  lastLogoutTime: string
  areaName: string
  areaCode: string
  session: string
}

interface UserState {
  user: LoginUser | null
  setUser: (user: LoginUser) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null })
}))
