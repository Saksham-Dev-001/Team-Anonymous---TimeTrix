// File: /js/ui/system-notifications.js
// Native OS Notifications, Floating System Banners & Full-Screen Replacement Popup

import { auth } from '../core/auth.js';
import { api } from '../core/api.js';
import { router } from '../core/router.js';
import { openModal, closeModal } from './modal.js';
import { MOCK_DATABASE } from '../core/mock-data.js';

let notifContainer = null;
let currentPopupOverlay = null;

// Period Timings Map
export function getPeriodTime(periodNumber) {
  const times = {
    1: '9:35 AM – 10:30 AM',
    2: '10:30 AM – 11:25 AM',
    3: '11:25 AM – 12:20 PM',
    4: '12:20 PM – 1:10 PM',
    5: '1:45 PM – 2:35 PM',
    6: '2:35 PM – 3:25 PM'
  };
  return times[periodNumber] || 'Academic Lecture Slot';
}

// Gentle Harmonic Web Audio Chime & Mobile Vibration (Apple / WhatsApp Marimba Style Glass Ping)
export function playNotificationChime() {
  // 1. Mobile phone haptic vibration
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 140]);
    } catch (e) {}
  }

  // 2. Multi-tone glass notification ping via Web Audio API
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Harmonic 1 (830.6 Hz - G#5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(830.6, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Harmonic 2 (1244.5 Hz - D#6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1244.5, now + 0.05);
    gain2.gain.setValueAtTime(0.18, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.45);

    // Harmonic 3 sparkle ping (1661.2 Hz - G#6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1661.2, now + 0.09);
    gain3.gain.setValueAtTime(0.12, now + 0.09);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.09);
    osc3.stop(now + 0.55);
  } catch (e) {
    // Graceful fallback
  }
}

// Request Browser Web Notification Permission
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission();
    } catch (e) {
      return Notification.permission;
    }
  }
  return Notification.permission;
}

// Show Native OS / Browser System Notification
export function showNativeSystemNotification(title, body, tag = null, data = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: tag || 'timetrix-notif-' + Date.now(),
          vibrate: [150, 80, 150],
          data
        });
      }).catch(() => {
        new Notification(title, { body, icon: '/favicon.ico' });
      });
    } else {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  } catch (e) {
    console.warn('Native notification fallback:', e);
  }
}

// Ensure In-App System Notification Container
function ensureNotifContainer() {
  if (!notifContainer || !document.body.contains(notifContainer)) {
    notifContainer = document.querySelector('.system-notif-container');
    if (!notifContainer) {
      notifContainer = document.createElement('div');
      notifContainer.className = 'system-notif-container';
      document.body.appendChild(notifContainer);
    }
  }
  return notifContainer;
}

// Show In-App Top-Down Mobile WhatsApp / iOS Heads-Up Push Banner
export function showInAppSystemBanner(notif) {
  const container = ensureNotifContainer();
  const isDuty = notif.type === 'substitution_assigned' || notif.type === 'substitution_updated';

  const banner = document.createElement('div');
  banner.className = `system-notif-banner ${isDuty ? 'banner-duty' : ''}`;
  banner.setAttribute('role', 'alert');

  const icon = isDuty ? '⚡' : (notif.type === 'absence_logged' ? '📋' : '🔔');

  banner.innerHTML = `
    <div class="system-notif-row">
      <div class="system-notif-avatar ${isDuty ? 'avatar-duty' : ''}">
        ${icon}
      </div>
      <div class="system-notif-content">
        <div class="system-notif-head">
          <div class="system-notif-app">
            <span>TimeTrix</span>
            <span style="opacity: 0.5;">•</span>
            <span style="color: #22D3EE;">Now</span>
          </div>
          <div class="system-notif-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <button class="system-notif-close" title="Dismiss" aria-label="Dismiss">✕</button>
        </div>
        <div class="system-notif-title">${notif.title || 'Campus Notification'}</div>
        <div class="system-notif-body">${notif.body || ''}</div>
        <div class="system-notif-bottom-bar">
          <div class="system-notif-hint">
            <span>👆 Swipe up to dismiss</span>
          </div>
          ${isDuty ? '<button class="system-notif-btn action-duty">View Duty ➔</button>' : ''}
        </div>
      </div>
    </div>
  `;

  let isDismissed = false;
  const dismiss = () => {
    if (isDismissed) return;
    isDismissed = true;
    banner.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease';
    banner.style.transform = 'translateY(-140%) scale(0.92)';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 290);
  };

  // Close button click
  banner.querySelector('.system-notif-close').onclick = (e) => {
    e.stopPropagation();
    dismiss();
  };

  // Action button click
  const dutyBtn = banner.querySelector('.action-duty');
  if (dutyBtn) {
    dutyBtn.onclick = (e) => {
      e.stopPropagation();
      dismiss();
      showFullscreenReplacementPopup(notif.data || notif);
    };
  }

  // Click on the banner itself to open duty or timetable
  banner.onclick = () => {
    dismiss();
    if (isDuty) {
      showFullscreenReplacementPopup(notif.data || notif);
    } else {
      router.navigate('/timetable');
    }
  };

  // Mobile Touch Swipe-Up Detection (Native Mobile Feeling)
  let startY = 0;
  banner.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  banner.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 25) {
      dismiss();
    }
  }, { passive: true });

  container.appendChild(banner);

  // Auto-dismiss after 6.5 seconds
  setTimeout(() => {
    if (document.body.contains(banner)) dismiss();
  }, 6500);
}

// Quick Test Notification Trigger
export function triggerTestNotification() {
  const currentUser = auth.getCurrentUser();
  const testNotif = {
    id: 'test-' + Date.now(),
    userId: currentUser?.id || 'all',
    type: 'substitution_assigned',
    title: '⚡ Substitution Duty: Period 2 (CH101)',
    body: 'You are assigned to cover Engg. Chemistry in Room SL-4 today for Dr. Aastha Pareek (Syllabus Continuity).',
    data: {
      period: 2,
      roomCode: 'SL-4',
      subjectCode: 'CH101',
      subjectName: 'Engg. Chemistry',
      batchName: 'Section B (AI & DS - 1st Year)',
      originalFacultyName: 'Dr. Aastha Pareek',
      date: new Date().toISOString().split('T')[0]
    }
  };

  // 1. Play sound chime & vibrate
  playNotificationChime();

  // 2. Show native OS notification (Windows/Mac/Android push banner)
  showNativeSystemNotification(testNotif.title, testNotif.body, testNotif.id, { url: '/#/timetable' });

  // 3. Show top-down mobile heads-up banner
  showInAppSystemBanner(testNotif);
}

// Fullscreen Replacement Duty Popup
export function showFullscreenReplacementPopup(dutyData, onAcknowledge = null) {
  if (currentPopupOverlay && document.body.contains(currentPopupOverlay)) {
    currentPopupOverlay.remove();
  }

  const currentUser = auth.getCurrentUser();
  const roomCode = dutyData.roomCode || 'SL-4';
  const period = dutyData.period || 1;
  const timeStr = getPeriodTime(period);
  const subjectCode = dutyData.subjectCode || 'N/A';
  const subjectName = dutyData.subjectName || 'Course Lecture';
  const batchName = dutyData.batchName || 'Section B (AI & DS - 1st Year)';
  const originalFaculty = dutyData.originalFacultyName || 'Faculty Member';
  const dutyDate = dutyData.date || dutyData.sessionDate || new Date().toISOString().split('T')[0];
  const dutyKey = `duty_${dutyData.entryId || period}_${dutyDate}`;

  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-duty-overlay';
  currentPopupOverlay = overlay;

  // 🔒 Lock background page scrolling completely until popup is closed
  document.body.classList.add('modal-open-locked');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  overlay.innerHTML = `
    <div class="fullscreen-duty-card" role="dialog" aria-modal="true" aria-labelledby="duty-heading">
      <div class="fullscreen-duty-top">
        <div class="fullscreen-duty-badge">
          <span>⚡</span>
          <span>URGENT REPLACEMENT ASSIGNED</span>
        </div>
        <button class="fullscreen-duty-close" id="duty-close-btn" title="Close" aria-label="Close duty alert">✕</button>
      </div>

      <h2 class="fullscreen-duty-title" id="duty-heading">
        Attention: ${currentUser?.fullName || 'Faculty Member'}
      </h2>
      <p class="fullscreen-duty-subtitle">
        You have been assigned as a <strong>Substitute Faculty Member</strong> for today. Another colleague is absent, and this slot has been allotted to you. Please report to the classroom on time.
      </p>

      <!-- Short Summary of Location & Slot Details -->
      <div class="duty-grid">
        <div class="duty-slot-box highlight-room">
          <div class="duty-slot-label">
            <span>📍</span>
            <span>Where To Go (Classroom)</span>
          </div>
          <div class="duty-slot-val" style="color: var(--primary-accent, #22D3EE);">Room ${roomCode}</div>
          <div class="duty-slot-sub">Main Academic Block • Smart Classroom</div>
        </div>

        <div class="duty-slot-box highlight-period">
          <div class="duty-slot-label">
            <span>⏰</span>
            <span>Period & Bell Time</span>
          </div>
          <div class="duty-slot-val" style="color: #FBBF24;">Period ${period}</div>
          <div class="duty-slot-sub">${timeStr}</div>
        </div>

        <div class="duty-slot-box">
          <div class="duty-slot-label">
            <span>👥</span>
            <span>Class & Branch</span>
          </div>
          <div class="duty-slot-val" style="font-size: 0.95rem;">${batchName}</div>
          <div class="duty-slot-sub">Applied Science & Engineering</div>
        </div>

        <div class="duty-slot-box">
          <div class="duty-slot-label">
            <span>📚</span>
            <span>Subject To Conduct</span>
          </div>
          <div class="duty-slot-val" style="font-size: 0.95rem;">${subjectCode}</div>
          <div class="duty-slot-sub">${subjectName}</div>
        </div>

        <div class="duty-slot-box">
          <div class="duty-slot-label">
            <span>👤</span>
            <span>Covering For</span>
          </div>
          <div class="duty-slot-val" style="font-size: 0.95rem; color: #F87171;">${originalFaculty}</div>
          <div class="duty-slot-sub">Colleague On Approved Leave</div>
        </div>

        <div class="duty-slot-box">
          <div class="duty-slot-label">
            <span>📅</span>
            <span>Scheduled Date</span>
          </div>
          <div class="duty-slot-val" style="font-size: 0.95rem;">${dutyDate}</div>
          <div class="duty-slot-sub">Today's Academic Timetable</div>
        </div>
      </div>

      <!-- Actions: Close & Check Full Details -->
      <div class="duty-actions">
        <button class="btn btn-secondary" id="duty-dismiss-btn" style="border-radius: 9999px; padding: 0.65rem 1.35rem;">
          ✕ Close
        </button>
        <button class="btn btn-primary" id="duty-details-btn" style="border-radius: 9999px; padding: 0.65rem 1.65rem; font-weight: 800;">
          🔍 Check Full Duty Details & Timetable ➔
        </button>
      </div>
    </div>
  `;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeDutyPopup();
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // Prevent background wheel and touch scrolling on overlay backdrop
  const preventScroll = (e) => {
    if (e.target === overlay) {
      e.preventDefault();
    }
  };
  overlay.addEventListener('wheel', preventScroll, { passive: false });
  overlay.addEventListener('touchmove', preventScroll, { passive: false });

  const closeDutyPopup = () => {
    // 🔓 Restore background page scrolling cleanly
    window.removeEventListener('keydown', handleKeyDown);
    document.body.classList.remove('modal-open-locked');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    sessionStorage.setItem('timetrix_dismissed_duty_' + dutyKey, 'true');
    overlay.style.transition = 'opacity 0.22s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      if (currentPopupOverlay === overlay) currentPopupOverlay = null;
    }, 230);
    if (onAcknowledge) onAcknowledge();
  };

  overlay.querySelector('#duty-close-btn').onclick = closeDutyPopup;
  overlay.querySelector('#duty-dismiss-btn').onclick = closeDutyPopup;

  overlay.querySelector('#duty-details-btn').onclick = () => {
    closeDutyPopup();

    // Open Comprehensive Duty Details Modal
    const detailBox = document.createElement('div');
    detailBox.style.cssText = 'display: flex; flex-direction: column; gap: 1.15rem;';
    detailBox.innerHTML = `
      <div style="background: var(--bg-subtle); border-radius: 20px; padding: 1.25rem; border: 1px solid var(--border-color);">
        <div style="font-size: 0.75rem; font-weight: 800; color: #0891B2; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">OFFICIAL ALLOTMENT PARTICULARS</div>
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${subjectName} (${subjectCode})</div>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
          Assigned to <strong>${currentUser?.fullName}</strong> in place of <strong>${originalFaculty}</strong>. This lecture slot has been automatically updated across the campus timetable matrix.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Room & Wing</div>
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-top: 2px;">Room ${roomCode}</div>
          <div style="font-size: 0.75rem; color: #64748B;">Floor 2, Applied Science Block</div>
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Timing</div>
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-top: 2px;">Period ${period}</div>
          <div style="font-size: 0.75rem; color: #64748B;">${timeStr}</div>
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Student Group</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin-top: 2px;">${batchName}</div>
          <div style="font-size: 0.75rem; color: #64748B;">Approx. 60 Students</div>
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Duty Status</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #10B981; margin-top: 2px;">Confirmed Active</div>
          <div style="font-size: 0.75rem; color: #64748B;">Clash-free verified</div>
        </div>
      </div>

      <div style="background: rgba(34, 211, 238, 0.06); border: 1.5px dashed rgba(34, 211, 238, 0.4); border-radius: 16px; padding: 1rem; font-size: 0.825rem; color: var(--text-main);">
        💡 <strong>Syllabus Continuity Guidelines:</strong> Proceed with standard curriculum syllabus or problem-solving tutorial in <strong>Room ${roomCode}</strong>. Attendance register will be available in the department office.
      </div>
    `;

    const openTimetableBtn = document.createElement('button');
    openTimetableBtn.className = 'btn btn-primary';
    openTimetableBtn.style.borderRadius = '9999px';
    openTimetableBtn.textContent = '📅 Open My Full Timetable';
    openTimetableBtn.onclick = () => {
      closeModal();
      router.navigate('/timetable');
    };

    openModal('⚡ Replacement Duty Master Record', detailBox, [openTimetableBtn]);
  };

  document.body.appendChild(overlay);
}

// Check and show replacement modal when teacher opens app or switches account
export async function checkAndShowReplacementModal(currentUser) {
  if (!currentUser) return;

  // 1. Look for active session override where substituteFacultyId is current user
  const overrides = MOCK_DATABASE.sessionOverrides || [];
  const activeDuty = overrides.find(ov => 
    ov.substituteFacultyId === currentUser.id && 
    ov.status !== 'cancelled' &&
    ov.kind === 'substitute'
  );

  if (activeDuty) {
    const dutyKey = `duty_${activeDuty.entryId || activeDuty.period}_${activeDuty.sessionDate || 'today'}`;
    const dismissed = sessionStorage.getItem('timetrix_dismissed_duty_' + dutyKey);
    if (!dismissed) {
      showFullscreenReplacementPopup({
        entryId: activeDuty.entryId,
        roomCode: activeDuty.roomCode,
        period: activeDuty.period,
        subjectCode: activeDuty.subjectCode,
        subjectName: activeDuty.subjectName,
        batchName: activeDuty.batchName || 'Section B (AI & DS - 1st Year)',
        originalFacultyName: activeDuty.originalFacultyName,
        date: activeDuty.sessionDate
      });
      return;
    }
  }

  // 2. Also check if there's an unread substitution assignment notification
  const notifs = MOCK_DATABASE.notifications || [];
  const subNotif = notifs.find(n => 
    n.userId === currentUser.id && 
    n.type === 'substitution_assigned' && 
    !n.readAt
  );

  if (subNotif) {
    const data = subNotif.data || {};
    const dutyKey = `duty_${data.entryId || subNotif.id}_${data.date || 'today'}`;
    const dismissed = sessionStorage.getItem('timetrix_dismissed_duty_' + dutyKey);
    if (!dismissed) {
      showFullscreenReplacementPopup({
        entryId: data.entryId,
        roomCode: data.roomCode,
        period: data.period,
        subjectCode: data.subjectCode,
        subjectName: data.subjectName,
        batchName: data.batchName || 'Section B (AI & DS - 1st Year)',
        originalFacultyName: data.originalFacultyName,
        date: data.date
      });
    }
  }
}

// Initialize System Notifications
export function initSystemNotifications() {
  // Request OS permission on first user click anywhere if default
  const handleUserGesture = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      requestNotificationPermission();
    }
    window.removeEventListener('click', handleUserGesture);
    window.removeEventListener('keydown', handleUserGesture);
  };
  window.addEventListener('click', handleUserGesture, { once: true });
  window.addEventListener('keydown', handleUserGesture, { once: true });

  // Listen to application events
  window.addEventListener('timetrix:notification', (event) => {
    const notif = event.detail;
    if (!notif || notif.all) return;

    // 🛑 Never show alerts or sound on read updates or already-read notifications
    if (notif.isReadUpdate || notif.readAt || !notif.isNew) return;

    const currentUser = auth.getCurrentUser();
    const isForUser = !currentUser || notif.userId === currentUser.id || notif.userId === 'all';
    if (!isForUser) return;

    // 1. Play gentle audio chime & mobile vibration
    playNotificationChime();

    // 2. Show native OS notification (Windows/Mac/Android system notification banner)
    showNativeSystemNotification(
      notif.title || 'TimeTrix Notification',
      notif.body || 'New campus alert received.',
      notif.id,
      { url: notif.type === 'substitution_assigned' ? '/#/timetable' : '/#/dashboard' }
    );

    // 3. Show in-app top-down WhatsApp / mobile heads-up banner
    showInAppSystemBanner(notif);

    // 4. If substitution assigned to current teacher, immediately pop full-screen duty card!
    if (notif.type === 'substitution_assigned') {
      showFullscreenReplacementPopup(notif.data || notif);
    }
  });

  // Cross-Tab Real-Time Sync (storage event)
  window.addEventListener('storage', (e) => {
    if (e.key === 'timetrix_custom_notifications') {
      try {
        const list = JSON.parse(e.newValue);
        if (Array.isArray(list) && list.length > 0) {
          const newest = list[0];
          const ageMs = Date.now() - new Date(newest.createdAt).getTime();
          if (ageMs < 15000 && !newest.readAt) {
            const currentUser = auth.getCurrentUser();
            const isForUser = !currentUser || newest.userId === currentUser.id || newest.userId === 'all';
            if (isForUser) {
              playNotificationChime();
              showNativeSystemNotification(
                newest.title || 'TimeTrix Notification',
                newest.body || 'New campus alert received.',
                newest.id,
                { url: newest.type === 'substitution_assigned' ? '/#/timetable' : '/#/dashboard' }
              );
              showInAppSystemBanner(newest);
              if (newest.type === 'substitution_assigned') {
                showFullscreenReplacementPopup(newest.data || newest);
              }
            }
          }
        }
      } catch (err) {}
    }
  });

  // Check immediately for current user on app launch
  const initialUser = auth.getCurrentUser();
  if (initialUser) {
    // Slight delay to allow DOM to finish rendering
    setTimeout(() => {
      checkAndShowReplacementModal(initialUser);
    }, 450);
  }
}

