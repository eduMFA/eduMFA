declare global {
  interface Window {
    /** Set by the legacy template; the JSON page config replaces it. */
    browserLanguage?: string;
  }
}

export {};
