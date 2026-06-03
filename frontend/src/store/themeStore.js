import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', newTheme === 'light');
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('light', theme === 'light');
    set({ theme });
  },
}));

export default useThemeStore;
