// Single clean weather UI script — updates existing DOM nodes instead of replacing whole blocks.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('weather-form');
  const input = document.getElementById('city-input');
  const result = document.getElementById('result');
  const errorBox = document.getElementById('error');
  const historyList = document.getElementById('history-list');
  const detailsEl = document.getElementById('details');
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrf = csrfMeta ? csrfMeta.getAttribute('content') : '';
  // Prevent duplicate concurrent searches
  let isSearching = false;

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
    setTimeout(() => errorBox.classList.add('hidden'), 4000);
  }

  function renderHistory(items) {
    historyList.innerHTML = '';
    if (!items || items.length === 0) {
      historyList.innerHTML = '<div class="text-xs text-slate-400">No searches yet.</div>';
      return;
    }

    items.forEach(it => {
      const label = `${it.city}${it.country ? ', ' + it.country : ''}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'history-chip';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        if (input) input.value = it.city;
        submitSearch(it.city);
      });
      const wrapper = document.createElement('div');
      wrapper.appendChild(btn);
      historyList.appendChild(wrapper);
    });
  }

  async function loadHistory() {
    try {
      const res = await fetch('/admin/history-data', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return;
      const json = await res.json();
      renderHistory(json.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }

  function updateResult(data) {
    try {
      const cityEl = result.querySelector('.city-name');
      const descEl = result.querySelector('.weather-desc');
      const tempEl = result.querySelector('.temp-display');
      const iconImg = result.querySelector('.weather-icon');

      if (cityEl) cityEl.textContent = `${data.city}${data.country ? ', ' + data.country : ''}`;
      if (descEl) descEl.textContent = data.condition || '';
      if (tempEl) tempEl.textContent = (data.temp !== undefined && data.temp !== null) ? Math.round(data.temp) + '°C' : '--';
      if (iconImg && data.icon) iconImg.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

      const cards = detailsEl.querySelectorAll('.detail-card');
      if (cards[0]) {
        cards[0].innerHTML = `
          <div class="text-xs text-slate-500">Feels like</div>
          <div class="text-3xl font-bold text-emerald-600">${data.feels_like !== undefined && data.feels_like !== null ? Math.round(data.feels_like) + '°C' : '--'}</div>
        `;
      }
      if (cards[1]) {
        cards[1].innerHTML = `
          <div class="text-xs text-slate-500">Humidity</div>
          <div class="text-3xl font-bold text-purple-600">${data.humidity !== undefined && data.humidity !== null ? data.humidity + '%' : '--'}</div>
        `;
      }
      if (cards[2]) {
        cards[2].innerHTML = `
          <div class="text-xs text-slate-500">Wind</div>
          <div class="text-3xl font-bold text-indigo-600">${data.wind !== undefined && data.wind !== null ? data.wind + ' m/s' : '--'}</div>
        `;
      }
    } catch (err) {
      console.error('updateResult error', err);
    }
  }

  async function submitSearch(city) {
    const payloadCity = (city || (input && input.value.trim())) || '';
    if (!payloadCity) { showError('Please enter a city name'); return; }

    // Prevent duplicate submissions while a search is in progress
    if (isSearching) return;
    isSearching = true;

    const cityEl = result.querySelector('.city-name');
    const tempEl = result.querySelector('.temp-display');
    if (cityEl) cityEl.textContent = payloadCity;
    if (tempEl) tempEl.textContent = '...';

    const fd = new FormData();
    fd.append('city', payloadCity);

    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const originalText = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) { submitBtn.innerHTML = 'Searching...'; submitBtn.disabled = true; }

    try {
      const res = await fetch('/weather/fetch', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
        body: fd
      });

      let json = null;
      try { json = await res.json(); } catch (parseErr) { /* ignore */ }

      if (!res.ok) {
        showError(json?.message || `Server returned ${res.status}`);
        return;
      }

      if (!json || !json.ok) {
        showError(json?.message || 'City not found or API error');
        return;
      }

      updateResult(json.data || {});
      await loadHistory();
    } catch (err) {
      console.error('submitSearch error', err);
      showError('Network error while fetching weather');
    } finally {
      if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
      isSearching = false;
    }
  }

  // Disable form's native submit behavior — searches should only be triggered by the search button click
  if (form) {
    form.addEventListener('submit', (e) => { e.preventDefault(); });
    // Prevent Enter key from submitting the form in all cases
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  // Wire the search button to trigger the AJAX search. Enter key will not submit the form.
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitSearch();
    });
  }

  // Also prevent Enter on the input itself to be 100% sure browsers won't submit the form
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });
  }

  loadHistory();
});
