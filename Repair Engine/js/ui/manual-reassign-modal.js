// File: /js/ui/manual-reassign-modal.js
// World-Class HOD Manual Timetable Substitution & Override Modal (Best UI & UX)

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal } from './modal.js';
import { MOCK_DATABASE } from '../core/mock-data.js';
import { calculateBestSubstitutes } from '../core/smart-repair-engine.js';

/**
 * Opens an interactive, high-tier manual reassignment modal for HOD / Admin.
 * @param {Object} options - { entryId, date, onSaved }
 */
export async function openManualReassignModal({ entryId, date, onSaved }) {
  const currentUser = auth.getCurrentUser() || { fullName: 'Department HOD', role: 'hod' };
  const session = MOCK_DATABASE.baseTimetable.find(s => s.entryId === entryId);
  if (!session) {
    showToast('Lecture session not found', 'conflict');
    return;
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetWeekday = new Date(targetDate).getDay() || 7;

  // Find existing override if any
  const existingOverride = MOCK_DATABASE.sessionOverrides.find(
    ov => ov.entryId === entryId && ov.sessionDate === targetDate
  );

  // Find repair case if any
  const repairCase = MOCK_DATABASE.repairCases.find(c => c.targetDate === targetDate);
  const caseId = repairCase ? repairCase.id : ('case-' + Date.now());

  // Candidates ranked via smart repair engine
  const candidates = calculateBestSubstitutes(session, targetDate, targetWeekday);
  const assignedFacultyId = existingOverride?.substituteFacultyId;
  const currentSubTeacher = assignedFacultyId ? MOCK_DATABASE.users.find(u => u.id === assignedFacultyId) : null;

  const modalBody = el('div', {
    style: 'display: flex; flex-direction: column; gap: 1.25rem; max-height: 72vh; overflow-y: auto; padding-right: 0.25rem;'
  });

  // 1. Header Information Banner
  const headerCard = el('div', {
    style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 14px; padding: 1.15rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
  },
    el('div', {},
      el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;' },
        el('span', { className: 'badge badge-substitute', style: 'font-weight: 800;' }, `PERIOD ${session.period}`),
        el('strong', { style: 'font-size: 1.15rem; color: var(--text-main); font-weight: 800;' }, `${session.subjectCode} — ${session.subjectName}`)
      ),
      el('div', { style: 'font-size: 0.825rem; color: var(--text-muted); display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;' },
        el('span', {}, `📍 Classroom: ${session.roomCode}`),
        el('span', {}, `📅 Date: ${targetDate}`),
        el('span', { style: 'color: #DC2626; font-weight: 700;' }, `⚠️ Scheduled Teacher: ${session.facultyName} (Absent)`)
      )
    ),
    el('span', {
      className: existingOverride ? 'badge badge-approved' : 'badge badge-conflict',
      style: 'font-weight: 700; font-size: 0.8rem; padding: 0.35rem 0.75rem; border-radius: 9999px;'
    }, existingOverride ? '● ACTIVE COVERAGE' : '⚠️ UNCOVERED')
  );
  modalBody.appendChild(headerCard);

  // 2. Current Assignment Status Box
  const statusBox = el('div', {
    style: 'background: #ffffff; border: 1.5px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
  });

  if (existingOverride) {
    const isSub = existingOverride.kind === 'substitute';
    statusBox.appendChild(
      el('div', {},
        el('div', { style: 'font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em;' },
          'CURRENT ASSIGNED TIMETABLE COVERAGE'
        ),
        el('div', { style: 'font-size: 1rem; font-weight: 800; color: #0891B2; margin-top: 0.25rem;' },
          isSub ? `👤 ${currentSubTeacher?.fullName || 'Assigned Substitute Faculty'}` : '📖 Self-Study / Library Period'
        ),
        el('div', { style: 'font-size: 0.785rem; color: #64748b; margin-top: 0.15rem;' },
          existingOverride.reason || 'Assigned by Timetable Repair Solver'
        )
      )
    );
    statusBox.appendChild(
      el('span', {
        className: 'badge badge-approved',
        style: 'font-weight: 700;'
      }, existingOverride.isManualOverride ? '✏️ HOD Manual Override' : '⚡ Auto-Assigned Best Match')
    );
  } else {
    statusBox.appendChild(
      el('div', {},
        el('div', { style: 'font-size: 0.75rem; color: #DC2626; text-transform: uppercase; font-weight: 700;' },
          'UNRESOLVED CLASSROOM RISK'
        ),
        el('div', { style: 'font-size: 0.95rem; font-weight: 700; color: #DC2626; margin-top: 0.2rem;' },
          'No teacher currently assigned for this period. Choose a faculty below to resolve.'
        )
      )
    );
  }
  modalBody.appendChild(statusBox);

  // 3. Candidate Faculty Selector Header
  const sectionTitle = el('div', {
    style: 'display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;'
  },
    el('div', {},
      el('h4', { style: 'font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin: 0;' },
        '🎯 Multi-Factor Candidate Faculty (Ranked by Best Match)'
      ),
      el('p', { style: 'font-size: 0.775rem; color: var(--text-muted); margin: 0.15rem 0 0 0;' },
        'Ranked by Slot Availability, Subject Specialization, Syllabus Deficit Catch-up & Workload Balance.'
      )
    ),
    el('span', {
      style: 'font-size: 0.75rem; color: #0891B2; font-family: var(--font-mono); font-weight: 700;'
    }, `${candidates.filter(c => c.isFree).length} Free Faculty`)
  );
  modalBody.appendChild(sectionTitle);

  // 4. Candidate List Container
  const candidateList = el('div', {
    style: 'display: flex; flex-direction: column; gap: 0.75rem;'
  });

  candidates.forEach((cand, idx) => {
    const isCurrentlyAssigned = cand.teacher.id === assignedFacultyId;
    const isTopCandidate = idx === 0 && cand.isFree;

    const candCard = el('div', {
      style: `border: 1.5px solid ${isCurrentlyAssigned ? '#10B981' : isTopCandidate ? '#22D3EE' : cand.isFree ? '#E2E8F0' : '#FECACA'}; background: ${isCurrentlyAssigned ? 'rgba(16, 185, 129, 0.04)' : isTopCandidate ? 'rgba(34, 211, 238, 0.03)' : cand.isFree ? '#FFFFFF' : '#FFF1F2'}; border-radius: 12px; padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; transition: all 180ms ease;`
    });

    // Top Row: Info + Score
    const topRow = el('div', {
      style: 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
          el('span', {
            style: `font-size: 0.68rem; font-weight: 800; font-family: var(--font-mono); padding: 2px 7px; border-radius: 6px; background: ${isCurrentlyAssigned ? '#10B981' : isTopCandidate ? '#22D3EE' : '#94A3B8'}; color: #0B1220;`
          }, isCurrentlyAssigned ? 'ACTIVE SUB' : isTopCandidate ? '#1 BEST MATCH' : `#${idx + 1}`),
          el('strong', { style: 'font-size: 0.975rem; color: var(--text-main);' }, cand.teacher.fullName),
          isCurrentlyAssigned ? el('span', { className: 'badge badge-approved', style: 'font-size: 0.65rem;' }, 'ASSIGNED') : null
        ),
        el('div', { style: 'font-size: 0.775rem; color: var(--text-muted); margin-top: 0.15rem;' },
          `${cand.teacher.designation || 'Faculty'} • ${cand.teacher.departmentName || 'Applied Sciences'}`
        )
      ),
      el('div', { style: 'text-align: right;' },
        el('div', {
          style: `font-size: 1.15rem; font-weight: 900; font-family: var(--font-brand); color: ${cand.isFree ? '#0891B2' : '#DC2626'};`
        }, `${cand.matchPercentage}%`),
        el('span', {
          style: `font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: ${cand.isFree ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${cand.isFree ? '#059669' : '#DC2626'};`
        }, cand.isFree ? 'FREE IN SLOT ✓' : 'CLASH / BUSY ✗')
      )
    );
    candCard.appendChild(topRow);

    // Badges Row
    const badgesWrap = el('div', { style: 'display: flex; flex-wrap: wrap; gap: 0.35rem;' });
    cand.badges.forEach(b => {
      badgesWrap.appendChild(el('span', {
        style: 'font-size: 0.7rem; font-weight: 700; background: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.2); color: #0891B2; padding: 2px 7px; border-radius: 9999px;'
      }, `${b.text} (${b.pts})`));
    });
    candCard.appendChild(badgesWrap);

    // Justification
    const justification = el('div', {
      style: 'font-size: 0.775rem; color: #475569; background: rgba(0, 0, 0, 0.02); padding: 0.35rem 0.6rem; border-radius: 6px; line-height: 1.35;'
    }, `💡 ${cand.justification}`);
    candCard.appendChild(justification);

    // Assign Button
    if (cand.isFree) {
      const assignBtn = el('button', {
        className: isCurrentlyAssigned ? 'btn btn-secondary btn-sm' : isTopCandidate ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm',
        style: 'align-self: flex-start; margin-top: 0.25rem; font-weight: 700;',
        disabled: isCurrentlyAssigned,
        onClick: async () => {
          try {
            assignBtn.disabled = true;
            assignBtn.textContent = 'Assigning...';

            await api.applyManualRepair(
              caseId,
              session.entryId,
              cand.teacher.id,
              'substitute',
              `Manual override by ${currentUser.fullName} (${currentUser.roleTitle || 'HOD'}). Match rating: ${cand.matchPercentage}%.`,
              currentUser
            );

            showToast(`✅ Successfully assigned ${cand.teacher.fullName} to Period ${session.period}! Both faculty notified.`, 'normal');
            closeModal();
            if (onSaved) onSaved();
          } catch (err) {
            console.error('Manual assign error:', err);
            showToast('Failed to assign substitute', 'conflict');
            assignBtn.disabled = false;
            assignBtn.textContent = '⚡ Assign This Faculty';
          }
        }
      }, isCurrentlyAssigned ? '✓ Currently Assigned to this Slot' : `⚡ Assign ${cand.teacher.fullName}`);

      candCard.appendChild(assignBtn);
    }

    candidateList.appendChild(candCard);
  });
  modalBody.appendChild(candidateList);

  // 5. Alternative Option: Convert to Self-Study
  const selfStudyBtn = el('button', {
    className: 'btn btn-secondary btn-sm',
    onClick: async () => {
      try {
        await api.applyManualRepair(
          caseId,
          session.entryId,
          null,
          'self_study',
          `HOD marked Period ${session.period} as supervised self-study block.`,
          currentUser
        );
        showToast(`📖 Period ${session.period} converted to Monitored Self-Study block.`, 'normal');
        closeModal();
        if (onSaved) onSaved();
      } catch (err) {
        showToast('Failed to designate self-study', 'conflict');
      }
    }
  }, '📖 Designate as Monitored Self-Study Block');

  const closeBtn = el('button', {
    className: 'btn btn-secondary',
    onClick: closeModal
  }, 'Close');

  openModal(`⚡ Edit Substitution — Period ${session.period} (${session.subjectCode})`, modalBody, [selfStudyBtn, closeBtn]);
}

