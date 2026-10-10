// File: /js/pages/page-auth.js
// Modern, Production-Grade Academic Sign-In Screen (Rebuilt from Scratch)

import { el } from '../core/dom.js';
import { auth } from '../core/auth.js';
import { router } from '../core/router.js';
import { showToast } from '../ui/toast.js';
import { icons } from '../ui/icons.js';
import { openModal, closeModal } from '../ui/modal.js';
import { MOCK_DATABASE } from '../core/mock-data.js';

export const pageAuth = {
  render() {
    const wrapper = el('div', { className: 'auth-page-wrapper' });
    const container = el('div', { className: 'auth-main-container' });

    // 1. Institutional Header
    const header = el('div', { className: 'auth-brand-header' });
    const chip = el('div', { className: 'auth-badge-pill' },
      el('span', { className: 'auth-status-dot' }),
      el('span', {}, 'SRI BALAJI COLLEGE OF ENGG & TECHNOLOGY')
    );
    const logo = el('div', { className: 'auth-brand-logo', html: icons.logo || '' });
    const title = el('h1', { className: 'auth-brand-title' }, 'TimeTrix');
    const teamChip = el('div', { className: 'auth-team-chip' }, '⚡ Engineered by Team Anonymous');
    const subtitle = el('p', { className: 'auth-brand-subtitle' }, 'Autonomous Timetable Repair System • College Timetable Console');

    header.appendChild(chip);
    header.appendChild(logo);
    header.appendChild(title);
    header.appendChild(teamChip);
    header.appendChild(subtitle);
    container.appendChild(header);

    // 2. Focused Modern Sign-In Card
    const card = el('div', { className: 'auth-form-card' });

    // Field 1: Academic ID
    const idInput = el('input', {
      type: 'text',
      className: 'auth-text-input',
      placeholder: 'e.g. ADM-2026, HOD-FIROZ, FAC-105',
      value: 'ADM-2026',
      name: 'academic_id',
      autocomplete: 'username',
      autocapitalize: 'characters',
      spellcheck: 'false',
      required: true
    });

    const idGroup = el('div', { className: 'auth-field-group' },
      el('label', { className: 'auth-field-label' }, 'Academic ID or Official Email'),
      el('div', { className: 'auth-input-wrapper' },
        el('span', { className: 'auth-input-icon', html: icons.admin || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }),
        idInput
      )
    );
    card.appendChild(idGroup);

    // Field 2: Password
    const passInput = el('input', {
      type: 'password',
      className: 'auth-text-input',
      placeholder: 'Enter security password',
      value: 'college@2026',
      name: 'password',
      autocomplete: 'current-password',
      required: true
    });

    const toggleBtn = el('button', {
      type: 'button',
      className: 'auth-password-toggle',
      title: 'Show/Hide Password',
      html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
    });

    let passVisible = false;
    toggleBtn.onclick = () => {
      passVisible = !passVisible;
      passInput.type = passVisible ? 'text' : 'password';
      toggleBtn.style.color = passVisible ? '#0891B2' : '#94A3B8';
    };

    const passGroup = el('div', { className: 'auth-field-group' },
      el('label', { className: 'auth-field-label' }, 'Security Password'),
      el('div', { className: 'auth-input-wrapper' },
        el('span', { className: 'auth-input-icon', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' }),
        passInput,
        toggleBtn
      )
    );
    card.appendChild(passGroup);

    // Options Row: Remember Me & Forgot Password
    const rememberCheckbox = el('input', { type: 'checkbox', className: 'auth-remember-checkbox', checked: true });
    const forgotLink = el('a', {
      className: 'auth-help-link',
      href: 'javascript:void(0)',
      onClick: () => {
        showToast('Contact Central Administration (Dr. K. S. Mukherjee) for credential reset.', 'info', 5000);
      }
    }, 'Forgot Password?');

    const optionsRow = el('div', { className: 'auth-options-row' },
      el('label', { className: 'auth-remember-label' },
        rememberCheckbox,
        el('span', {}, 'Remember session')
      ),
      forgotLink
    );
    card.appendChild(optionsRow);

    // Primary Submit Button
    const submitBtn = el('button', {
      type: 'button',
      className: 'auth-login-submit-btn',
      html: '<span>Sign In to Academic Console</span> <span style="font-size: 1.1rem;">➔</span>'
    });

    const handleLogin = async () => {
      const code = idInput.value.trim();
      const pass = passInput.value.trim();

      if (!code) {
        showToast('Please enter your Academic ID.', 'warning');
        idInput.focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="auth-spinner"></span> <span>Authenticating...</span>';

        const user = await auth.login(code, pass);
        showToast(`Welcome, ${user.fullName} (${user.roleTitle || user.role.toUpperCase()})`, 'success');

        setTimeout(() => {
          router.navigate('/dashboard');
        }, 220);
      } catch (err) {
        showToast(err.message || 'Invalid credentials.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Academic Console</span> <span style="font-size: 1.1rem;">➔</span>';
      }
    };

    submitBtn.onclick = handleLogin;
    idInput.onkeydown = (e) => { if (e.key === 'Enter') handleLogin(); };
    passInput.onkeydown = (e) => { if (e.key === 'Enter') handleLogin(); };

    card.appendChild(submitBtn);

    // Subtle Credential Directory Modal Trigger
    const promptRow = el('div', { className: 'auth-directory-prompt' },
      el('span', {}, 'Need your official ID?'),
      el('button', {
        type: 'button',
        onClick: () => openDirectoryModal()
      }, 'View Academic ID Directory')
    );
    card.appendChild(promptRow);

    container.appendChild(card);

    // 3. Footer
    const footer = el('div', { className: 'auth-footer' },
      el('div', { className: 'auth-footer-team' },
        el('span', { style: 'color: #0891B2; font-weight: 800; font-family: var(--font-brand); letter-spacing: 0.05em;' }, 'TIMETRIX'),
        el('span', {}, '• Built with pride by'),
        el('span', { className: 'auth-team-highlight' }, 'Team Anonymous')
      ),
      el('div', { className: 'auth-footer-lock' },
        el('span', {}, '🔒'),
        el('span', {}, '256-Bit SSL Encrypted Session • Official Academic Portal')
      )
    );
    container.appendChild(footer);

    // Modal: Clean Reference Directory
    const openDirectoryModal = () => {
      const modalBody = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });

      const accounts = [
        { role: 'Central Admin', id: 'ADM-2026', name: 'Dr. K. S. Mukherjee', desc: 'Central Admin Office / Principal' },
        { role: 'HOD Applied Science', id: 'HOD-FIROZ', name: 'Dr. Syed Firoz Haider', desc: 'Applied Science & Humanities Department' },
        { role: 'HOD Civil', id: 'HOD-CIVIL', name: 'Dr. Rajeshwar Sharma', desc: 'Civil Engineering (2nd, 3rd, 4th Year)' },
        { role: 'HOD Mech', id: 'HOD-MECH', name: 'Dr. Ramesh Verma', desc: 'Mechanical Engineering (2nd, 3rd, 4th Year)' },
        { role: 'HOD EE', id: 'HOD-EE', name: 'Dr. Mahendra Soni', desc: 'Electrical Engineering (2nd, 3rd, 4th Year)' },
        { role: 'HOD CSE', id: 'HOD-CSE', name: 'Dr. Pankaj Meel', desc: 'Computer Science & Engg. (2nd, 3rd, 4th Year)' },
        { role: 'Faculty', id: 'FAC-102', name: 'Dr. Aastha Pareek', desc: 'Faculty — Chemistry & Lab' },
        { role: 'Faculty', id: 'FAC-103', name: 'Dr. A. H. Khan', desc: 'Faculty — Engineering Mathematics' }
      ];

      accounts.forEach(acc => {
        const item = el('div', {
          style: 'background: #F8FAFC; border: 1px solid var(--auth-border, #E2E8F0); border-radius: 12px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;'
        },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
              el('span', { style: 'font-weight: 800; font-family: monospace; color: #0891B2; background: rgba(34, 211, 238, 0.12); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;' }, acc.id),
              el('strong', { style: 'font-size: 0.95rem; color: #0F172A;' }, acc.name)
            ),
            el('div', { style: 'font-size: 0.775rem; color: #64748B; margin-top: 0.2rem;' }, `${acc.role} • ${acc.desc}`)
          ),
          el('button', {
            className: 'btn btn-secondary btn-sm',
            style: 'font-weight: 700; font-size: 0.75rem;',
            onClick: () => {
              idInput.value = acc.id;
              passInput.value = 'college@2026';
              closeModal();
              showToast(`Selected ${acc.id} (${acc.name})`, 'info');
              passInput.focus();
            }
          }, 'Use ID')
        );
        modalBody.appendChild(item);
      });

      const closeBtn = el('button', { className: 'btn btn-secondary', onClick: closeModal }, 'Close');
      openModal('🏛️ Official Academic Accounts Directory', modalBody, [closeBtn]);
    };

    wrapper.appendChild(container);
    return wrapper;
  }
};
