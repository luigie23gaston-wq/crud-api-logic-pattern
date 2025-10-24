document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  const modal = document.getElementById('modal-logout');
  const confirmBtn = document.getElementById('confirmLogoutBtn');
  const closeBtns = modal ? modal.querySelectorAll('[data-modal-close]') : [];

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/logout', {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            'Accept': 'application/json'
          }
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          // On success redirect to login and replace history so Back doesn't go back inside app
          window.location.replace('/login');
        } else {
          alert(data.message || 'Logout failed');
        }
      } catch (err) {
        console.error('Logout failed', err);
        alert('Logout failed');
      }
    });
  }
});
