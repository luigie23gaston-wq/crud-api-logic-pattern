document.addEventListener('DOMContentLoaded', function () {
  const openBtn = document.getElementById('clear-history-btn');
  const modal = document.getElementById('clear-history-modal');
  const cancelBtn = document.getElementById('clear-history-cancel');

  if (!openBtn || !modal) return;

  function showModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function hideModal() {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showModal();
  });

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal();
  });

  // Close when clicking backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  // Intercept the form submit to perform AJAX clear
  const form = document.getElementById('clear-history-form');
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const action = form.getAttribute('action') || window.location.pathname;
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      try {
        const res = await fetch(action, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to clear history.' }));
          window.showToast(err.message || 'Failed to clear history.');
          return;
        }

        const json = await res.json().catch(() => null);

        // Success: hide modal, show toast, clear list and pagination
        hideModal();
        const message = (json && json.message) ? json.message : 'All history cleared.';
        if (window.showToast) window.showToast(message);

        const items = document.getElementById('history-items');
        const pagination = document.getElementById('history-pagination');
        if (items) items.innerHTML = '<div class="p-6 text-center text-slate-500">No history found.</div>';
        if (pagination) pagination.innerHTML = '';
      } catch (e) {
        console.error(e);
        window.showToast && window.showToast('Failed to clear history.');
      }
    });
  }
});
