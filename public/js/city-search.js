(function(){
  // Debounced autosuggest for city/region search input (#city-input)
  const INPUT_ID = 'city-input';
  const API = '/api/search-city';
  const DEBOUNCE_MS = 280;

  const input = document.getElementById(INPUT_ID);
  if (!input) return; // nothing to do

  // create dropdown container (positioned below input, appended to body to avoid clipping)
  const container = document.createElement('div');
  container.className = 'city-suggestions rounded-xl bg-white shadow-lg overflow-auto';
  container.style.display = 'none';
  container.style.maxHeight = '260px';
  container.style.boxSizing = 'border-box';
  container.style.position = 'absolute';
  container.style.zIndex = '99999';
  container.setAttribute('role', 'listbox');
  container.setAttribute('aria-hidden', 'true');

  // append to body so it won't be clipped by parent stacking contexts
  document.body.appendChild(container);
  const parent = input.parentNode;

  let timer = null;
  let items = [];
  let activeIndex = -1;

  function escapeHtml(s){ return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

  function clearSuggestions(){ items = []; activeIndex = -1; container.innerHTML = ''; container.style.display = 'none'; container.setAttribute('aria-hidden','true'); }

  function renderSuggestions(list){
    container.innerHTML = '';
    items = list || [];
    if (!items.length) { clearSuggestions(); return; }

    // dedupe by city|province to avoid duplicate rows
    const seen = new Map();
    items = items.filter(it => {
      const key = `${(it.city||'').toString().toLowerCase()}|${(it.province||'').toString().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
    items.forEach((it, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-full text-left px-4 py-2 hover:bg-slate-100';
      btn.setAttribute('role','option');
      btn.dataset.index = idx;
      btn.innerHTML = `<div class="text-sm font-medium">${escapeHtml(it.city)}</div><div class="text-xs text-slate-500">${escapeHtml(it.region || it.province || '')}</div>`;
      btn.addEventListener('click', () => selectSuggestion(idx));
      container.appendChild(btn);
    });
    // position dropdown below the input using viewport coordinates (append-to-body case)
    try {
      const rect = input.getBoundingClientRect();
      const left = rect.left + window.scrollX;
      const top = rect.bottom + window.scrollY + 6; // small gap
      container.style.left = `${Math.max(left, 8)}px`;
      container.style.top = `${top}px`;
      container.style.width = `${rect.width}px`;
    } catch (e) {
      container.style.left = '8px';
      container.style.top = '100px';
      container.style.width = '300px';
    }

    container.style.display = 'block';
    container.setAttribute('aria-hidden','false');

    // reposition on scroll/resize to keep dropdown aligned
    const reposition = () => {
      try {
        const rect = input.getBoundingClientRect();
        const left = rect.left + window.scrollX;
        const top = rect.bottom + window.scrollY + 6;
        container.style.left = `${Math.max(left, 8)}px`;
        container.style.top = `${top}px`;
        container.style.width = `${rect.width}px`;
      } catch (e) { /* ignore */ }
    };
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition);
  }

  function selectSuggestion(idx){
    if (!items[idx]) return;
    const choice = items[idx];
    input.value = choice.city;
    clearSuggestions();
    // submit existing weather form (it will handle POST)
    const form = document.getElementById('weather-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  async function fetchSuggestions(q){
    try{
      const res = await fetch(`${API}?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json && json.ok && Array.isArray(json.data)) ? json.data : [];
    }catch(e){
      console.warn('city-search fetch error', e);
      return [];
    }
  }

  input.addEventListener('input', (e) => {
    const q = input.value.trim();
    clearTimeout(timer);
    if (!q) { clearSuggestions(); return; }
    timer = setTimeout(async () => {
      const results = await fetchSuggestions(q);
      renderSuggestions(results);
    }, DEBOUNCE_MS);
  });

  input.addEventListener('keydown', (e) => {
    if (container.style.display === 'none') return;
    const opts = container.querySelectorAll('[role="option"]');
    if (!opts.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, opts.length - 1);
      opts.forEach((o,i)=> o.classList.toggle('bg-slate-100', i===activeIndex));
      opts[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      opts.forEach((o,i)=> o.classList.toggle('bg-slate-100', i===activeIndex));
      opts[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectSuggestion(activeIndex);
      else {
        // submit current value
        const form = document.getElementById('weather-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    } else if (e.key === 'Escape') {
      clearSuggestions();
    }
  });

  // hide on outside click
  document.addEventListener('click', (ev) => {
    if (!container.contains(ev.target) && ev.target !== input) clearSuggestions();
  });

})();
