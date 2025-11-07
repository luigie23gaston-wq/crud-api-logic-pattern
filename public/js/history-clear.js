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
});
