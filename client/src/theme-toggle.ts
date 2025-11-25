/**
 * Theme Toggle Manager
 * Handles dark/light mode switching with localStorage persistence
 */

const THEME_KEY = 'theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

export class ThemeToggle {
  private buttons: HTMLButtonElement[];
  private currentTheme: string;

  constructor() {
    // Get all theme toggle buttons (header and landing page)
    this.buttons = [
      document.getElementById('theme-toggle') as HTMLButtonElement,
      document.getElementById('theme-toggle-landing') as HTMLButtonElement
    ].filter(btn => btn !== null);
    
    this.currentTheme = this.getStoredTheme() || this.getSystemPreference();
    
    this.applyTheme(this.currentTheme);
    this.updateButtonIcons();
    this.setupEventListeners();
  }

  /**
   * Get theme from localStorage
   */
  private getStoredTheme(): string | null {
    return localStorage.getItem(THEME_KEY);
  }

  /**
   * Get system color scheme preference
   */
  private getSystemPreference(): string {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK_THEME;
    }
    return LIGHT_THEME;
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: string): void {
    if (theme === DARK_THEME) {
      document.documentElement.setAttribute('data-theme', DARK_THEME);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveTheme(theme: string): void {
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Update all button icons based on current theme
   */
  private updateButtonIcons(): void {
    const icon = this.currentTheme === DARK_THEME ? '☀️' : '🌙';
    const label = this.currentTheme === DARK_THEME ? 'Switch to light mode' : 'Switch to dark mode';
    
    this.buttons.forEach(button => {
      button.textContent = icon;
      button.setAttribute('aria-label', label);
    });
  }

  /**
   * Toggle between light and dark themes
   */
  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    this.applyTheme(this.currentTheme);
    this.saveTheme(this.currentTheme);
    this.updateButtonIcons();
    
    // Dispatch custom event so game board can re-render with new colors
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: this.currentTheme } }));
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.toggleTheme();
      });
    });

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't set a preference
        if (!this.getStoredTheme()) {
          this.currentTheme = e.matches ? DARK_THEME : LIGHT_THEME;
          this.applyTheme(this.currentTheme);
          this.updateButtonIcons();
        }
      });
    }
  }
}

/**
 * Initialize theme on page load (before other scripts)
 * This prevents flash of wrong theme
 */
export function initializeTheme(): void {
  const storedTheme = localStorage.getItem(THEME_KEY);
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = storedTheme || (systemDark ? DARK_THEME : LIGHT_THEME);
  
  if (theme === DARK_THEME) {
    document.documentElement.setAttribute('data-theme', DARK_THEME);
  }
}
