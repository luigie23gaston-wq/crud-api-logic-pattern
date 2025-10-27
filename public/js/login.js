// Login + auth Alpine component and helpers
// Exposes authForm() for use with x-data in Blade templates

function showToast(type, message) {
  // Ensure toast container exists
  let container = document.getElementById('crud-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'crud-toast-container';
    container.className = 'crud-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `crud-toast crud-toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // trigger entrance animation
  requestAnimationFrame(() => toast.classList.add('show'));

  // keep visible a moment longer for animation
  setTimeout(() => {
    toast.classList.remove('show');
    // remove after exit animation
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Modal helpers (used on login page). They are safe to call elsewhere — they noop if modal not present.
function openAuthModal(title, message, options = {}) {
  const backdrop = document.getElementById('auth-modal-backdrop');
  const modal = document.getElementById('auth-modal');
  const msg = document.getElementById('auth-modal-message');
  const dots = document.getElementById('auth-modal-dots');
  if (!backdrop || !modal || !msg) return null;

  msg.textContent = message || '';
  if (dots) dots.textContent = '';
  // make visible
  backdrop.style.display = 'flex';
  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden', 'false');

  // apply typed message class (success/error) if provided
  if (options.type) {
    msg.classList.remove('auth-success', 'auth-error');
    if (options.type === 'success') msg.classList.add('auth-success');
    if (options.type === 'error') msg.classList.add('auth-error');
  } else {
    msg.classList.remove('auth-success', 'auth-error');
  }

  // return an object to control dots animation and close
  // store interval reference on backdrop so global close handlers can stop it
  const startDots = () => {
    if (!dots || !backdrop) return;
    let count = 0;
    // clear previous if any
    if (backdrop._dotInterval) clearInterval(backdrop._dotInterval);
    backdrop._dotInterval = setInterval(() => {
      count = (count + 1) % 4; // 0..3
      dots.innerHTML = '<h1>.</h1>'.repeat(count);
    }, 500);
  };
  const stopDots = () => { if (backdrop && backdrop._dotInterval) { clearInterval(backdrop._dotInterval); backdrop._dotInterval = null; } if (dots) dots.textContent = ''; };

  const startSpinner = () => {
    const loading = document.getElementById('auth-modal-loading');
    if (!loading || !backdrop) return;
    loading.classList.remove('hidden');
    loading.setAttribute('aria-hidden', 'false');
    backdrop._spinnerActive = true;
  };

  const stopSpinner = () => {
    const loading = document.getElementById('auth-modal-loading');
    if (loading) { loading.classList.add('hidden'); loading.setAttribute('aria-hidden', 'true'); }
    if (backdrop) backdrop._spinnerActive = false;
  };

  if (options.animateDots) startDots();
  if (options.showSpinner) startSpinner();

  // wire close buttons (will be additional to global handlers but safe)
  const closeButtons = backdrop.querySelectorAll('[data-modal-close]');
  closeButtons.forEach(btn => btn.addEventListener('click', () => {
    stopDots();
    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden', 'true');
    // hide via inline style as well to prevent flashes
    backdrop.style.display = 'none';
  }));

  return { startDots, stopDots, backdrop, modal };
}


// Initialize modal behavior on page load: ensure hidden state and wire global handlers
function initAuthModal() {
  const backdrop = document.getElementById('auth-modal-backdrop');
  const modal = document.getElementById('auth-modal');
  const msg = document.getElementById('auth-modal-message');
  const dots = document.getElementById('auth-modal-dots');
  if (!backdrop || !modal) return;

  // Ensure it's hidden by default (avoid stuck state when navigating)
  backdrop.classList.add('hidden');
  backdrop.setAttribute('aria-hidden', 'true');
  // also set inline style to prevent flashes before CSS fully applies
  backdrop.style.display = 'none';
  if (dots) dots.textContent = '';

  // Close handler shared for buttons, ESC, and backdrop click
  const closeHandler = () => {
    if (backdrop._dotInterval) { clearInterval(backdrop._dotInterval); backdrop._dotInterval = null; }
    if (dots) dots.textContent = '';
    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.style.display = 'none';
  };

  // Wire any existing close buttons
  const closeButtons = backdrop.querySelectorAll('[data-modal-close]');
  closeButtons.forEach(btn => btn.addEventListener('click', closeHandler));

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeHandler();
    }
  });

  // Close when clicking on backdrop outside the modal
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeHandler();
    }
  });
}

// initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthModal);
} else {
  initAuthModal();
}

window.authForm = function () {
  return {
    registerData: { username: '', password: '', passwordConfirm: '' },
    loginData: { username: '', password: '' },
    showRegPassword: false,
    showLoginPassword: false,
    passwordStrength: 0,
    passwordStrengthText: 'Very Weak',

    validatePassword() {
      const password = this.registerData.password || '';
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      this.passwordStrength = strength;
      const strengthTexts = ['', 'Very Weak', 'Weak', 'Fair', 'Strong'];
      this.passwordStrengthText = strengthTexts[strength] || '';
    },

    async register() {
      // Simple demo register flow (replace with real endpoint if available)
      // client-side confirm-password check
      if (this.registerData.password !== this.registerData.passwordConfirm) {
        showToast('warning', 'Passwords do not match');
        return;
      }

      try {
        const fd = new FormData();
        fd.append('username', this.registerData.username);
        fd.append('password', this.registerData.password);

        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content, 'Accept': 'application/json' },
          credentials: 'same-origin',
          body: fd,
        });

        const data = await res.json().catch(() => ({}));
        const hasAuthModal = !!document.getElementById('auth-modal-backdrop');
        if (res.ok) {
          if (hasAuthModal) {
            const ctrl = openAuthModal('Success', data.message || 'Registration successful - Redirecting', { animateDots: true, type: 'success' });
            if (data && data.redirect) {
              setTimeout(() => {
                if (ctrl && ctrl.stopDots) ctrl.stopDots();
                window.location.replace(data.redirect);
              }, 1200);
              return;
            }
            // reset form and stop dots after brief delay
            setTimeout(() => {
              if (ctrl && ctrl.stopDots) ctrl.stopDots();
              backdrop = document.getElementById('auth-modal-backdrop');
              if (backdrop) { backdrop.classList.add('hidden'); backdrop.setAttribute('aria-hidden', 'true'); }
            }, 1200);

            this.registerData = { username: '', password: '', passwordConfirm: '' };
            this.passwordStrength = 0;
            this.passwordStrengthText = 'Very Weak';
            return;
          }

          showToast('success', data.message || 'Registered');
          // If server supplied a redirect URL, navigate there and replace history
          if (data && data.redirect) {
            // replace so back doesn't go to login
            window.location.replace(data.redirect);
            return;
          }

          this.registerData = { username: '', password: '', passwordConfirm: '' };
          this.passwordStrength = 0;
          this.passwordStrengthText = 'Very Weak';
        } else {
          showToast('error', data.message || (data.errors ? Object.values(data.errors).flat().join('; ') : 'Registration failed'));
        }
      } catch (err) {
        console.error('Register failed', err);
        showToast('error', 'Registration failed');
      }
    },

    async login() {
      try {
        const fd = new FormData();
        fd.append('username', this.loginData.username);
        fd.append('password', this.loginData.password);

        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content, 'Accept': 'application/json' },
          credentials: 'same-origin',
          body: fd,
        });

        // If server redirected (set session and returned a redirect), follow it
        if (res.redirected) {
          // success — navigate to redirected URL
          window.location.replace(res.url);
          return;
        }

        const data = await res.json().catch(() => ({}));

        // Check if auth modal exists on the page
        const hasAuthModal = !!document.getElementById('auth-modal-backdrop');

        // Some servers return JSON { success: true } — treat that as success
        if (res.ok && (data.success === true)) {
          if (hasAuthModal) {
            // show spinner-style loading in auth modal for redirecting
            const ctrl = openAuthModal('Success', 'Login Success - Redirecting', { showSpinner: true, type: 'success' });
            // redirect after short delay (allow dots to animate briefly)
            setTimeout(() => {
              if (ctrl && ctrl.stopDots) ctrl.stopDots();
              if (data.redirect) window.location.replace(data.redirect);
              else window.location.replace('/');
            }, 1400);
            return;
          }

          showToast('success', data.message || 'Login successful');
          if (data.redirect) {
            window.location.replace(data.redirect);
            return;
          }
          setTimeout(() => { window.location.href = '/'; }, 700);
        } else if (res.ok && !data.success && Object.keys(data).length === 0) {
          // res.ok but no JSON payload (server may have set session without JSON) — reload to reflect auth
          window.location.reload();
        } else {
          // failure
          if (hasAuthModal) {
            openAuthModal('Error', 'Invalid Credentials!', { type: 'error' });
            return;
          }

          showToast('error', data.message || (data.errors ? Object.values(data.errors).flat().join('; ') : 'Invalid credentials'));
        }
      } catch (err) {
        console.error('Login failed', err);
        showToast('error', 'Login failed');
      }
    }
  };
};
