import "@testing-library/jest-dom/vitest";

// Provide a basic matchMedia mock for components that rely on it (e.g., motion tokens)
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => void 0,
    removeListener: () => void 0,
    addEventListener: () => void 0,
    removeEventListener: () => void 0,
    dispatchEvent: () => false,
  });
}
