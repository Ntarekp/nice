import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      pendingUserId: null,
      pendingOtpPurpose: 'login',

      setLoginPending: (userId, purpose = 'login') =>
        set({ pendingUserId: userId, pendingOtpPurpose: purpose }),

      loginSuccess: (user, accessToken, refreshToken) =>
        set({
          user,
          token: accessToken,
          refreshToken,
          pendingUserId: null,
          pendingOtpPurpose: 'login',
        }),

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          pendingUserId: null,
          pendingOtpPurpose: 'login',
        })
        localStorage.removeItem('auth-storage')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
        pendingUserId: s.pendingUserId,
        pendingOtpPurpose: s.pendingOtpPurpose,
      }),
    }
  )
)
