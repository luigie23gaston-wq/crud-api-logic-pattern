document.addEventListener('DOMContentLoaded', function () {
  const itemsContainer = document.getElementById('history-items');
  const paginationContainer = document.getElementById('history-pagination');
  const metaContainer = document.getElementById('history-meta');

  if (!itemsContainer || !paginationContainer) return;

  // Delegate click handler for pagination links
  paginationContainer.addEventListener('click', async function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    e.preventDefault();

    try {
      const res = await fetch(href, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!res.ok) {
        // fallback to full navigation on error
        window.location.href = href;
        return;
      }

      const data = await res.json();
      if (!data || !data.ok) {
        window.location.href = href;
        return;
      }

      // replace items and pagination HTML
      if (data.items_html !== undefined) itemsContainer.innerHTML = data.items_html;
      if (data.pagination_html !== undefined) paginationContainer.innerHTML = data.pagination_html;

      // update meta line if provided by server (we included pagination partial but meta is inside it)
      if (data.meta) {
        const first = data.meta.current_page && data.meta.per_page ? ((data.meta.current_page - 1) * data.meta.per_page) + 1 : null;
        const last = data.meta.current_page && data.meta.per_page ? Math.min(data.meta.current_page * data.meta.per_page, data.meta.total) : null;
        if (first !== null && last !== null && metaContainer) {
          metaContainer.textContent = `Showing ${first} to ${last} of ${data.meta.total}`;
        }
      }

      // update browser URL (push state)
      try {
        const url = new URL(href, window.location.origin);
        window.history.pushState({}, '', url);
      } catch (err) {
        // ignore
      }

      // scroll to top of items (small UX nicety)
      itemsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('AJAX pagination failed', err);
      window.location.href = href; // fallback
    }
  });

  // Support back/forward navigation
  window.addEventListener('popstate', function () {
    // when user navigates via back/forward, re-fetch current URL via AJAX
    const href = window.location.href;
    fetch(href, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
      credentials: 'same-origin'
    }).then(res => res.json()).then(data => {
      if (data && data.ok) {
        if (data.items_html !== undefined) itemsContainer.innerHTML = data.items_html;
        if (data.pagination_html !== undefined) paginationContainer.innerHTML = data.pagination_html;
        if (data.meta && metaContainer) {
          const first = data.meta.current_page && data.meta.per_page ? ((data.meta.current_page - 1) * data.meta.per_page) + 1 : null;
          const last = data.meta.current_page && data.meta.per_page ? Math.min(data.meta.current_page * data.meta.per_page, data.meta.total) : null;
          if (first !== null && last !== null) metaContainer.textContent = `Showing ${first} to ${last} of ${data.meta.total}`;
        }
      }
    }).catch(() => {
      // ignore
    });
  });

});
