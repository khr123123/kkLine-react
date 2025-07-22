// src/store/useUnreadStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Contact {
    sessionId: string;
    noReadCount: number;
}

interface UnreadStore {
    unreadMap: Record<string, number>;
    noReadApplyCount: number;

    increase: (sessionId: string) => void;
    clear: (sessionId: string) => void;
    initFromContacts: (contacts: Contact[]) => void;

    setNoReadApplyCount: (count: number) => void;
    clearNoReadApplyCount: () => void;
}

export const useNoReadStore = create<UnreadStore>()(
    persist(
        (set) => ({
            unreadMap: {},
            noReadApplyCount: 0,

            increase: (sessionId) =>
                set((state) => ({
                    unreadMap: {
                        ...state.unreadMap,
                        [sessionId]: (state.unreadMap[sessionId] || 0) + 1,
                    },
                })),

            clear: (sessionId) =>
                set((state) => {
                    const newMap = { ...state.unreadMap };
                    delete newMap[sessionId];
                    return { unreadMap: newMap };
                }),

            initFromContacts: (contacts) =>
                set(() => {
                    const map: Record<string, number> = {};
                    contacts.forEach((c) => {
                        map[c.sessionId] = c.noReadCount || 0;
                    });
                    return { unreadMap: map };
                }),

            setNoReadApplyCount: (count) =>
                set(() => ({
                    noReadApplyCount: count,
                })),

            clearNoReadApplyCount: () =>
                set(() => ({
                    noReadApplyCount: 0,
                })),
        }),
        {
            name: 'no-read-storage',
            partialize: (state) => ({
                unreadMap: state.unreadMap,
                noReadApplyCount: state.noReadApplyCount,
            }),
        }
    )
);
