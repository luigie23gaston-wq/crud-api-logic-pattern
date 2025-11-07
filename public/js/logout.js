document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  const modal = document.getElementById('modal-logout');
  const confirmBtn = document.getElementById('confirmLogoutBtn');
  const closeBtns = modal ? modal.querySelectorAll('[data-modal-close]') : [];
  const confirmText = modal ? modal.querySelector('#logout-confirm-text') : null;

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    // ensure the confirm text is visible when opening
    if (confirmText) confirmText.style.display = '';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    // restore confirm text display when closing
    if (confirmText) confirmText.style.display = '';
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
      // Show the same auth-style spinner/modal used by login (if available).
      // If not available, show the local spinner inside the logout modal as fallback.
      let ctrl = null;
      const localLoading = document.getElementById('logout-modal-loading');
      try {
        if (typeof openAuthModal === 'function') {
          ctrl = openAuthModal('Logging out', 'Logging out - Redirecting', { showSpinner: true });
          // close the small logout confirm modal if global auth modal is used
          if (modal) closeModal();
        } else {
          // show local loading inside the logout modal and hide the confirm text
          if (localLoading) {
            localLoading.classList.remove('hidden');
            localLoading.setAttribute('aria-hidden', 'false');
          }
          if (confirmText) confirmText.style.display = 'none';
        }

        // disable confirm button to avoid double clicks
        confirmBtn.disabled = true;

        const res = await fetch('/logout', {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            'Accept': 'application/json'
          }
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          // Allow the spinner to show briefly, then redirect to login and replace history
          setTimeout(() => {
            window.location.replace('/login');
          }, 350);
        } else {
          // hide auth modal/spinner if shown
          if (ctrl && ctrl.backdrop) {
            ctrl.backdrop.classList.add('hidden');
            ctrl.backdrop.setAttribute('aria-hidden', 'true');
            ctrl.backdrop.style.display = 'none';
          }
          // hide local loading fallback and restore confirm text
          if (localLoading) { localLoading.classList.add('hidden'); localLoading.setAttribute('aria-hidden', 'true'); }
          if (confirmText) confirmText.style.display = '';
          confirmBtn.disabled = false;
          alert(data.message || 'Logout failed');
        }
      } catch (err) {
        console.error('Logout failed', err);
        if (ctrl && ctrl.backdrop) {
          ctrl.backdrop.classList.add('hidden');
          ctrl.backdrop.setAttribute('aria-hidden', 'true');
          ctrl.backdrop.style.display = 'none';
        }
  // hide local loading fallback and restore confirm text
  if (localLoading) { localLoading.classList.add('hidden'); localLoading.setAttribute('aria-hidden', 'true'); }
  if (confirmText) confirmText.style.display = '';
  confirmBtn.disabled = false;
        alert('Logout failed');
      }
    });
  }
});
