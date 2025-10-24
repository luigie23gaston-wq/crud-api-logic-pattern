// public/js/upload.js
// Simple controller for the upload progress component. No inline JS usage required.

(function () {
  function findEl(selector) {
    return document.querySelector(selector);
  }

  function showUploadComponent() {
    const el = findEl('#upload-progress-component');
    if (!el) return;
    el.classList.remove('hidden');
  }

  function hideUploadComponent() {
    const el = findEl('#upload-progress-component');
    if (!el) return;
    el.classList.add('hidden');
  }

  function setProgress(percent) {
    const el = findEl('#upload-progress-component');
    if (!el) return;
    const fill = el.querySelector('.progress-bar-fill');
    const pct = Math.max(0, Math.min(100, Math.round(percent)));
    if (fill) fill.style.width = pct + '%';
    const pctLabel = el.querySelector('.progress-percent');
    if (pctLabel) pctLabel.textContent = pct + '%';
    const track = el.querySelector('[role="progressbar"]');
    if (track) track.setAttribute('aria-valuenow', String(pct));
    if (pct >= 100) {
      // small delay then hide
      setTimeout(() => hideUploadComponent(), 900);
    }
  }

  // Expose a simple API
  // internal cancel token
  let currentXhr = null;

  function uploadFile(file, url, fieldName = 'file', extraFields = {}, onProgress) {
    const el = findEl('#upload-progress-component');
    if (!el) throw new Error('Upload component not found');

    showUploadComponent();
    setProgress(0);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      currentXhr = xhr;

      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          setProgress(pct);
          if (typeof onProgress === 'function') onProgress(pct);
        }
      });

      xhr.addEventListener('load', function () {
        currentXhr = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          resolve({ status: xhr.status, response: xhr.responseText });
        } else {
          reject({ status: xhr.status, response: xhr.responseText });
        }
      });

      xhr.addEventListener('error', function () {
        currentXhr = null;
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('abort', function () {
        currentXhr = null;
        reject(new Error('Upload aborted'));
      });

      const form = new FormData();
      form.append(fieldName, file);
      Object.keys(extraFields || {}).forEach(k => form.append(k, extraFields[k]));

      xhr.open('POST', url, true);
      // CSRF token header if available (Laravel)
      const tokenMeta = document.querySelector('meta[name="csrf-token"]');
      if (tokenMeta) {
        xhr.setRequestHeader('X-CSRF-TOKEN', tokenMeta.getAttribute('content'));
      }

      xhr.send(form);
    });
  }

  function cancelUpload() {
    if (currentXhr) {
      currentXhr.abort();
      currentXhr = null;
    }
  }

  window.uploadProgress = {
    show: showUploadComponent,
    hide: hideUploadComponent,
    set: setProgress,
    upload: uploadFile,
    cancel: cancelUpload
  };

  // Auto-initialize if the component exists and has data-autoshow attribute
  document.addEventListener('DOMContentLoaded', function () {
    const el = findEl('#upload-progress-component');
    if (el && el.dataset && el.dataset.autoshow === 'true') {
      showUploadComponent();
    }
    // attach cancel button handler
    const cancelBtn = document.querySelector('[data-upload-cancel]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        cancelUpload();
        hideUploadComponent();
      });
    }
  });
})();
