// Theme preference: "light" | "dark" | "system" (default). Applied as data-theme on <html>.
const KEY = "whisperly-theme";

export const getThemePreference = () => {
    try {
        return localStorage.getItem(KEY) || "system";
    } catch {
        return "system";
    }
};

export const resolveTheme = (pref = getThemePreference()) => {
    if (pref !== "system") return pref;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export const applyTheme = (pref = getThemePreference()) => {
    const root = document.documentElement;
    if (pref === "system") {
        root.removeAttribute("data-theme");
    } else {
        root.setAttribute("data-theme", pref);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolveTheme(pref) === "light" ? "#f4f4f9" : "#07070b");
};

export const setThemePreference = (pref) => {
    try {
        localStorage.setItem(KEY, pref);
    } catch {
        // storage unavailable (private mode): theme still applies for this session
    }
    applyTheme(pref);
};

// Flips between light and dark, starting from whatever is showing now.
export const toggleTheme = () => {
    const next = resolveTheme() === "light" ? "dark" : "light";
    setThemePreference(next);
    return next;
};
