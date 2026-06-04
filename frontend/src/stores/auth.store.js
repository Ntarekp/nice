import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      pendingUserId: null,

      setLoginPending: (userId) => set({ pendingUserId: userId }),

      loginSuccess: (user, accessToken, refreshToken) =>
        set({ user, token: accessToken, refreshToken, pendingUserId: null }),

      updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),

      logout: () => {
        set({ user: null, token: null, refreshToken: null, pendingUserId: null })
        localStorage.removeItem('auth-storage')
      }
    }),
    { name: 'auth-storage', partialize: s => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }) }
  )
)
