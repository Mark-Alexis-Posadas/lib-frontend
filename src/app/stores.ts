import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
    token: string | null;
    user?: unknown;
    setAuth: (token: string, user: unknown) => void;
    clearAuth: () => void;
}

interface UiState {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist<AuthState, [], [], Pick<AuthState, "token">>(
        (set) => ({
            token: null,
            setAuth: (token, user) => set({ token, user }),
            clearAuth: () => set({ token: null, user: undefined }),
        }),
        {
            name: "library-auth",
            storage: createJSONStorage(() => sessionStorage),
            partialize: ({ token }) => ({ token }),
        },
    ),
);

export const useUiStore = create<UiState>()(
    persist<UiState, [], [], Pick<UiState, "darkMode">>(
        (set) => ({
            darkMode: false,
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        }),
        {
            name: "library-ui",
            partialize: ({ darkMode }) => ({ darkMode }),
        },
    ),
);
