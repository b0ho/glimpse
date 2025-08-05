// Polyfill for import.meta
if (typeof globalThis !== 'undefined' && !globalThis.import) {
  globalThis.import = {
    meta: {
      url: '',
      env: process.env
    }
  };
}

// Additional web platform polyfills
if (typeof window !== 'undefined') {
  window.import = window.import || {
    meta: {
      url: window.location.href,
      env: process.env
    }
  };
}