document.addEventListener('DOMContentLoaded', function () {
  try {
    const server = document.getElementById('server-toast');
    if (!server) return;
    const msg = server.getAttribute('data-message');
    if (!msg) return;

    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;

    // allow click to dismiss immediately
    toast.addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 320);
    });

    container.appendChild(toast);

    // auto dismiss after 2.5s
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 320);
    }, 2500);
  } catch (e) {
    // fail silently
    console.error(e);
  }
});

// Expose a global showToast function for other scripts to call programmatically
window.showToast = function (message, duration = 2500) {
  try {
    if (!message) return;
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toast.addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 320);
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 320);
    }, duration);
  } catch (e) {
    // ignore
    console.error(e);
  }
};
