// File: /js/ui/toast.js
// Modern Toast Notification UI Component

import { el } from '../core/dom.js';

let container = null;

function ensureContainer() {
  if (!container) {
    container = el('div', { className: 'toast-container' });
    document.body.appendChild(container);
  }
}

export function showToast(message, type = 'info', duration = 3800) {
  ensureContainer();

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toastEl = el('div', {
    className: `toast toast-${type}`,
    title: 'Click to dismiss'
  },
    el('span', { className: 'toast-icon' }, iconMap[type] || 'ℹ'),
    el('span', { className: 'toast-message' }, message)
  );

  const dismiss = () => {
    toastEl.style.transition = 'opacity 220ms, transform 220ms';
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(12px) scale(0.96)';
    setTimeout(() => toastEl.remove(), 220);
  };

  toastEl.onclick = dismiss;
  container.appendChild(toastEl);

  setTimeout(dismiss, duration);
}

