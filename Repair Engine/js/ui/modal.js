// File: /js/ui/modal.js
// Accessible and Safe Modal UI Component (Single-Instance Guaranteed)

import { el, clearChildren } from '../core/dom.js';

let modalOverlay = null;
let modalInner = null;

function ensureModal() {
  // Check if an overlay already exists in DOM (e.g. from any module instance or prior render)
  if (!modalOverlay || !document.body.contains(modalOverlay)) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) {
      modalOverlay = existing;
      modalInner = existing.querySelector('.modal-content') || existing.querySelector('#modal-inner');
    } else {
      modalInner = el('div', { className: 'modal-content', id: 'modal-inner' });
      modalOverlay = el('div', { className: 'modal-overlay' }, modalInner);
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
      document.body.appendChild(modalOverlay);
    }
  }

  // Ensure modalInner reference is valid and inside modalOverlay
  if (!modalInner || !modalOverlay.contains(modalInner)) {
    modalInner = modalOverlay.querySelector('.modal-content') || modalOverlay.querySelector('#modal-inner');
    if (!modalInner) {
      modalInner = el('div', { className: 'modal-content', id: 'modal-inner' });
      modalOverlay.appendChild(modalInner);
    }
  }

  return { overlay: modalOverlay, inner: modalInner };
}

export function openModal(title, contentElement, actions = []) {
  const { overlay, inner } = ensureModal();
  clearChildren(inner);

  const titleEl = (title instanceof Node)
    ? title
    : el('h3', { className: 'card-title', style: 'font-size: 1.25rem; font-weight: 800; margin: 0;' }, title);

  const header = el('div', { className: 'card-header', style: 'margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;' },
    titleEl,
    el('button', {
      className: 'btn-close-circle',
      title: 'Close',
      onClick: closeModal
    }, '✕')
  );

  const body = el('div', { style: 'margin: 1rem 0;' }, contentElement);

  // Style actions as elegant Gmail pills
  actions.forEach(btn => {
    if (btn && btn.style) btn.style.borderRadius = '9999px';
  });

  const footer = el('div', { style: 'display: flex; justify-content: flex-end; align-items: center; gap: 0.65rem; margin-top: 1.25rem; width: 100%;' },
    ...actions
  );

  inner.appendChild(header);
  inner.appendChild(body);
  if (actions.length > 0) inner.appendChild(footer);

  // Cleanly close and remove any stray duplicate overlays if any existed in DOM
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    if (ov !== overlay) ov.remove();
  });

  overlay.classList.add('open');
  if (typeof document !== 'undefined') {
    document.body.classList.add('modal-open-locked');
    document.documentElement.classList.add('modal-open-locked');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}

export function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.classList.remove('open');
  });
  if (typeof document !== 'undefined') {
    document.body.classList.remove('modal-open-locked');
    document.documentElement.classList.remove('modal-open-locked');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

// Global safety cleanup: Escape key closes modal
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Guard observer: unlock background scroll if modal was closed via any direct DOM manipulation
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const scrollGuardObserver = new MutationObserver(() => {
      const hasOpenModal = document.querySelector('.modal-overlay.open') || document.querySelector('.duty-popup-overlay');
      if (!hasOpenModal && document.body.classList.contains('modal-open-locked')) {
        document.body.classList.remove('modal-open-locked');
        document.documentElement.classList.remove('modal-open-locked');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    });
    scrollGuardObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
}
