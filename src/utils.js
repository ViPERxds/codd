// Simple API utilities for public pages (global namespace, no modules)
(function(){
  function getApiBase() {
    try {
      return (window && window.API_BASE) ? window.API_BASE : '';
    } catch (_) {
      return '';
    }
  }

  async function fetchNoCacheJSON(url) {
    const ts = Date.now();
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}ts=${ts}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function safeGet(obj, path, fallback = undefined) {
    try {
      return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function buildFileUrl(input) {
    if (!input) return '';
    const isAbs = /^(https?:)?\/\//i.test(input);
    const base = getApiBase();
    if (isAbs) return input;
    // ensure single slash join
    if (base && input.startsWith('/')) return `${base}${input}`;
    if (base && !input.startsWith('/')) return `${base}/${input}`;
    return input;
  }

  function resolveMediaUrl(value) {
    if (!value) return '';
    // if it's already a string
    if (typeof value === 'string') return buildFileUrl(value);
    // if it's an array: take first resolvable
    if (Array.isArray(value)) {
      for (const v of value) {
        const u = resolveMediaUrl(v);
        if (u) return u;
      }
      return '';
    }
    // object with possible keys
    const candidates = [
      value.url,
      value.path,
      value.filePath,
      value.cover,
      value.src,
      value.href
    ].filter(Boolean);
    if (candidates.length) return buildFileUrl(String(candidates[0]));
    return '';
  }

  window.apiUtils = { getApiBase, fetchNoCacheJSON, safeGet, buildFileUrl, resolveMediaUrl };
})();


