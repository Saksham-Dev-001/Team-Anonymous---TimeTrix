// File: /js/pages/page-timetable.js
// Futuristic Live Academic Schedule & Class Conduction Registry (% Class Conducted)
// Redesigned with Streamlined Filter Toolbar, Organized Scopes, and Rich Interactive Dossiers

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { renderTimetableGrid } from '../ui/timetable-grid.js';
import { openModal, closeModal } from '../ui/modal.js';
import { router } from '../core/router.js';
import { openManualReassignModal } from '../ui/manual-reassign-modal.js';
import { MOCK_DATABASE } from '../core/mock-data.js';
import { getTodayIST } from '../core/format.js';

export const pageTimetable = {
  async render() {
    const container = el('div', { style: 'display: flex; flex-direction: column; gap: 1.5rem;' });

    const currentUser = auth.getCurrentUser() || { fullName: 'Dr. A. H. Khan', role: 'teacher', id: 'f-khan' };
    const isTeacher = currentUser.role === 'teacher';
    const isHOD = currentUser.role === 'hod' || currentUser.role === 'super_admin';

    let activeTab = 'weekly'; // Default to Weekly Master Grid as requested by user
    let selectedDate = getTodayIST();
    let selectedBatchId = 'b-sec-a'; // 'b-sec-a', 'b-sec-b'
    let viewScope = isTeacher ? 'faculty' : 'branch'; // 'branch' | 'faculty'
    let selectedFacultyId = currentUser.id;

    // Helper to format date display (e.g. "10 Oct 2026, Saturday")
    const getFormattedDateString = (dStr) => {
      try {
        const d = new Date(dStr);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        return dStr;
      }
    };

    // Helper to adjust date by delta days
    const shiftDate = (deltaDays) => {
      const cur = new Date(selectedDate);
      cur.setDate(cur.getDate() + deltaDays);
      selectedDate = cur.toISOString().split('T')[0];
      dateInput.value = selectedDate;
      renderActiveView();
    };

    // 1. Top Header Banner with Mode Tabs
    const headerBanner = el('div', {
      className: 'card',
      style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.08) 50%, #ffffff 100%); border-top: 3px solid #22D3EE; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; border-radius: 20px;'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;' },
          el('span', { className: 'badge badge-approved' }, 'OFFICIAL SCHEDULE'),
          el('span', { className: 'brand-team-badge' }, '⚡ TimeTrix • Team Anonymous'),
          el('span', { style: 'font-size: 0.75rem; color: #0891B2; font-family: var(--font-mono); font-weight: 700;' }, 'SEMESTER I • 2026-27')
        ),
        el('h2', { style: 'font-size: 1.85rem; font-weight: 800; letter-spacing: -0.025em; color: var(--text-main); margin: 0;' },
          'College Timetable & Academic Scheduler'
        ),
        el('p', { style: 'color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;' },
          'Real-time lecture bell tracker, classroom occupancies, autonomous substitutions, and master weekly matrices.'
        )
      )
    );

    // Mode Switcher Tabs
    const tabsContainer = el('div', {
      style: 'display: flex; gap: 0.45rem; background: var(--bg-subtle, #f1f5f9); padding: 0.35rem; border-radius: 14px; border: 1px solid var(--border-glass, #e2e8f0); flex-wrap: wrap;'
    });

    const tabConfigs = [
      { id: 'weekly', label: '📅 Weekly Master Grid' },
      { id: 'live', label: "🕒 Today's Live Schedule" },
      { id: 'conduction', label: '📊 % Classes Conducted' }
    ];

    const tabButtons = [];
    tabConfigs.forEach(t => {
      const btn = el('button', {
        type: 'button',
        className: `btn btn-sm ${t.id === activeTab ? 'btn-primary' : 'btn-secondary'}`,
        style: 'font-weight: 700; font-size: 0.825rem; border-radius: 10px; padding: 0.5rem 0.95rem;'
      }, t.label);

      btn.onclick = () => {
        tabButtons.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        activeTab = t.id;
        renderActiveView();
      };

      tabButtons.push(btn);
      tabsContainer.appendChild(btn);
    });

    headerBanner.appendChild(tabsContainer);
    container.appendChild(headerBanner);

    // 2. Streamlined Multi-Filter Toolbar Card
    const toolbarCard = el('div', {
      className: 'card',
      style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: 1.15rem 1.45rem; border-radius: 16px; background: #ffffff; box-shadow: var(--shadow-sm);'
    });

    // Left Filter Group: View Scope & Contextual Dropdowns
    const leftFilterGroup = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;' });

    // Scope Toggle: [ 🏫 Branch / Section ] vs [ 👨‍🏫 Faculty Schedule ]
    const scopeToggle = el('div', {
      style: 'display: flex; gap: 0.3rem; background: var(--bg-subtle, #f1f5f9); padding: 0.25rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0);'
    });

    const branchBtn = el('button', {
      type: 'button',
      className: `btn btn-sm ${viewScope === 'branch' ? 'btn-primary' : 'btn-secondary'}`,
      style: 'font-weight: 700; font-size: 0.8rem; border-radius: 8px;'
    }, '🏫 Branch / Section');

    const facultyBtn = el('button', {
      type: 'button',
      className: `btn btn-sm ${viewScope === 'faculty' ? 'btn-primary' : 'btn-secondary'}`,
      style: 'font-weight: 700; font-size: 0.8rem; border-radius: 8px;'
    }, isTeacher ? '👤 My Lectures' : '👨‍🏫 Faculty-Wise');

    scopeToggle.appendChild(branchBtn);
    scopeToggle.appendChild(facultyBtn);
    leftFilterGroup.appendChild(scopeToggle);

    // Batch / Section Selector Dropdown
    const batchSelect = el('select', {
      className: 'form-control',
      style: `width: auto; min-width: 250px; font-weight: 700; font-size: 0.85rem; display: ${viewScope === 'branch' ? 'inline-block' : 'none'};`
    },
      el('option', { value: 'b-sec-a' }, 'Section A (CSE & CS) — Room SL1'),
      el('option', { value: 'b-sec-b' }, 'Section B (AI & DS) — Room SL-4')
    );

    batchSelect.value = selectedBatchId;
    batchSelect.onchange = () => {
      selectedBatchId = batchSelect.value;
      renderActiveView();
    };
    leftFilterGroup.appendChild(batchSelect);

    // Faculty Selector Dropdown (For HOD & Admin) or Personal Label (For Teacher)
    let facultySelectorWrapper = el('div', {
      style: `display: ${viewScope === 'faculty' ? 'inline-flex' : 'none'}; align-items: center; gap: 0.5rem;`
    });

    if (isTeacher) {
      facultySelectorWrapper.appendChild(el('span', {
        className: 'badge badge-approved',
        style: 'font-size: 0.8rem; padding: 0.45rem 0.85rem; font-weight: 700;'
      }, `👤 ${currentUser.fullName} (${currentUser.academicId || 'Faculty'})`));
    } else {
      const allTeachers = MOCK_DATABASE.users.filter(u => u.role === 'teacher');
      const facultySelect = el('select', {
        className: 'form-control',
        style: 'width: auto; min-width: 260px; font-weight: 700; font-size: 0.85rem;'
      });

      allTeachers.forEach(t => {
        facultySelect.appendChild(el('option', {
          value: t.id,
          selected: t.id === selectedFacultyId
        }, `${t.fullName} (${t.designation || 'Faculty'})`));
      });

      facultySelect.onchange = () => {
        selectedFacultyId = facultySelect.value;
        renderActiveView();
      };

      facultySelectorWrapper.appendChild(facultySelect);
    }
    leftFilterGroup.appendChild(facultySelectorWrapper);

    // Scope Toggle Click Handlers
    branchBtn.onclick = () => {
      viewScope = 'branch';
      branchBtn.className = 'btn btn-sm btn-primary';
      facultyBtn.className = 'btn btn-sm btn-secondary';
      batchSelect.style.display = 'inline-block';
      facultySelectorWrapper.style.display = 'none';
      renderActiveView();
    };

    facultyBtn.onclick = () => {
      viewScope = 'faculty';
      facultyBtn.className = 'btn btn-sm btn-primary';
      branchBtn.className = 'btn btn-sm btn-secondary';
      batchSelect.style.display = 'none';
      facultySelectorWrapper.style.display = 'inline-flex';
      renderActiveView();
    };

    // Right Filter Group: Date Quick Jumps, Calendar Picker & Action Buttons
    const dateInput = el('input', {
      type: 'date',
      className: 'form-control',
      style: 'width: auto; min-width: 145px; font-weight: 700; font-size: 0.85rem;',
      value: selectedDate
    });

    dateInput.onchange = () => {
      selectedDate = dateInput.value;
      renderActiveView();
    };

    const prevDayBtn = el('button', {
      className: 'btn btn-secondary btn-sm',
      title: 'Previous Day',
      style: 'font-weight: 800; padding: 0.45rem 0.75rem;',
      onClick: () => shiftDate(-1)
    }, '◀');

    const todayBtn = el('button', {
      className: 'btn btn-secondary btn-sm',
      style: 'font-weight: 700; font-size: 0.8rem; padding: 0.45rem 0.85rem;',
      onClick: () => {
        selectedDate = getTodayIST();
        dateInput.value = selectedDate;
        renderActiveView();
      }
    }, 'Today');

    const nextDayBtn = el('button', {
      className: 'btn btn-secondary btn-sm',
      title: 'Next Day',
      style: 'font-weight: 800; padding: 0.45rem 0.75rem;',
      onClick: () => shiftDate(1)
    }, '▶');

    const dateNavContainer = el('div', {
      style: 'display: flex; align-items: center; gap: 0.35rem; background: var(--bg-subtle, #f8fafc); padding: 0.25rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0);'
    },
      prevDayBtn,
      dateInput,
      todayBtn,
      nextDayBtn
    );

    const reportAbsenceBtn = el('button', {
      className: 'btn btn-danger btn-sm',
      style: 'border-radius: 9999px; font-weight: 700; font-size: 0.8rem; padding: 0.5rem 1rem;',
      onClick: () => router.navigate('/leaves')
    }, '🚨 Report Absence');

    const rightFilterGroup = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;' },
      dateNavContainer,
      reportAbsenceBtn
    );

    toolbarCard.appendChild(leftFilterGroup);
    toolbarCard.appendChild(rightFilterGroup);
    container.appendChild(toolbarCard);

    // 3. Dynamic Content View Container
    const viewContainer = el('div', { id: 'timetable-view-container' });
    container.appendChild(viewContainer);

    // Master Render Method
    const renderActiveView = async () => {
      viewContainer.innerHTML = '';
      const isPersonal = viewScope === 'faculty';
      const targetFaculty = MOCK_DATABASE.users.find(u => u.id === selectedFacultyId) || currentUser;
      const batchName = selectedBatchId === 'b-sec-a'
        ? 'Section A (CSE & CS) • Classroom SL1'
        : 'Section B (AI & DS) • Classroom SL-4';

      // ==========================================
      // VIEW 1: WEEKLY MASTER GRID MATRIX (Mon - Sat)
      // ==========================================
      if (activeTab === 'weekly') {
        const filterPayload = isPersonal ? { facultyId: targetFaculty.id } : { batchId: selectedBatchId };
        const sessions = await api.getWeeklyEffectiveTimetable(filterPayload, selectedDate) || [];

        const grid = renderTimetableGrid(sessions, (session) => {
          // Comprehensive Lecture Slot Dossier Modal
          const modalBody = el('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' },
            // Header Badge Card
            el('div', {
              style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1.5px solid rgba(34, 211, 238, 0.35); border-radius: 14px; padding: 1.15rem;'
            },
              el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;' },
                el('span', { className: 'badge badge-approved', style: 'font-weight: 800; font-family: var(--font-mono);' }, session.subject_code),
                session.is_sub_duty
                  ? el('span', { className: 'badge badge-substitute', style: 'font-weight: 800;' }, '⚡ SUBSTITUTION DUTY')
                  : session.override_kind === 'substitute'
                  ? el('span', { className: 'badge badge-substitute', style: 'font-weight: 800;' }, '⚡ SUBSTITUTED LECTURE')
                  : session.override_kind === 'affected'
                  ? el('span', { className: 'badge badge-affected', style: 'font-weight: 800;' }, '⚠️ ABSENT FACULTY')
                  : el('span', { className: 'badge badge-approved' }, 'REGULAR CLASS')
              ),
              el('h3', { style: 'margin: 0; color: var(--text-main); font-size: 1.25rem; font-weight: 800;' }, session.subject_name)
            ),

            // Two-column detail matrix
            el('div', {
              style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; background: var(--bg-subtle, #f8fafc); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-glass, #e2e8f0);'
            },
              el('div', {},
                el('div', { style: 'font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;' }, 'Faculty in Charge'),
                el('div', { style: 'font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin-top: 0.15rem;' }, session.faculty_name || 'Unassigned')
              ),
              el('div', {},
                el('div', { style: 'font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;' }, 'Classroom / Lab'),
                el('div', { style: 'font-size: 0.95rem; font-weight: 800; color: #0891b2; margin-top: 0.15rem; font-family: var(--font-mono);' }, session.room_code || 'TBA')
              ),
              el('div', {},
                el('div', { style: 'font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;' }, 'Section & Batch'),
                el('div', { style: 'font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-top: 0.15rem;' }, session.batch_name || 'B.Tech I Year')
              ),
              el('div', {},
                el('div', { style: 'font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;' }, 'Period & Timing'),
                el('div', { style: 'font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-top: 0.15rem;' }, `Period ${session.start_period}`)
              )
            ),

            // Override Justification note if any
            session.override_reason ? el('div', {
              style: 'background: rgba(34, 211, 238, 0.08); border-left: 3px solid #0891b2; padding: 0.75rem; border-radius: 6px; font-size: 0.825rem; color: var(--text-main);'
            },
              el('strong', { style: 'color: #0891b2;' }, 'Resolution Note: '),
              session.override_reason
            ) : null
          );

          const actionButtons = [];
          if (isHOD) {
            actionButtons.push(el('button', {
              className: 'btn btn-primary btn-sm',
              style: 'border-radius: 9999px; font-weight: 700;',
              onClick: () => {
                closeModal();
                openManualReassignModal({
                  entryId: session.entry_id,
                  date: selectedDate,
                  onSaved: () => renderActiveView()
                });
              }
            }, '✏️ Reassign / Override Faculty'));
          }

          actionButtons.push(el('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => {
              closeModal();
            }
          }, 'Close'));

          openModal('Lecture Slot Dossier', modalBody, actionButtons);
        }, selectedDate);

        viewContainer.appendChild(grid);
      }

      // ==========================================
      // VIEW 2: TODAY'S LIVE BELL TIMELINE SCHEDULE
      // ==========================================
      else if (activeTab === 'live') {
        const liveWrapper = el('div', { style: 'display: flex; flex-direction: column; gap: 1.25rem;' });

        // Live Header Banner with Real-time IST Clock
        const liveHeader = el('div', {
          className: 'card',
          style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1.5px solid rgba(34, 211, 238, 0.35); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-radius: 16px;'
        },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;' },
              el('span', { className: 'badge badge-approved' }, '🟢 SRI BALAJI LIVE BELLS'),
              el('span', { style: 'font-size: 0.8rem; color: #0891b2; font-family: var(--font-mono); font-weight: 700;' },
                isPersonal ? `PERSONAL • ${targetFaculty.fullName.toUpperCase()}` : batchName.toUpperCase()
              )
            ),
            el('h3', { style: 'font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0;' },
              isPersonal 
                ? `My Daily Lecture Schedule — ${getFormattedDateString(selectedDate)}` 
                : `Today's Daily Lecture Schedule — ${getFormattedDateString(selectedDate)}`
            ),
            el('p', { style: 'font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;' },
              isPersonal
                ? `Showing active lectures and assigned substitute duties for ${targetFaculty.fullName}.`
                : 'Real-time bell periods, active classroom sessions & substitutions tracked live.'
            )
          ),
          el('div', {
            style: 'background: #ffffff; padding: 0.65rem 1.15rem; border-radius: 12px; border: 1px solid var(--border-glass, #e2e8f0); box-shadow: var(--shadow-sm); text-align: right;'
          },
            el('div', { style: 'font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;' }, 'Campus Clock (IST)'),
            el('div', { id: 'live-ist-clock', style: 'font-size: 1.35rem; font-weight: 800; font-family: var(--font-mono); color: #0891b2;' },
              new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            )
          )
        );
        liveWrapper.appendChild(liveHeader);

        const filterPayload = isPersonal ? { facultyId: targetFaculty.id } : { batchId: selectedBatchId };
        const periods = await api.getLiveDaySchedule(selectedDate, filterPayload);

        // Periods Timeline Grid
        const timelineList = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });

        periods.forEach(p => {
          let cardBorder = 'var(--border-glass, #e2e8f0)';
          let statusBadge = 'badge-normal';
          let statusText = 'SCHEDULED';
          let bg = '#ffffff';

          if (p.isSubDuty) {
            cardBorder = 'rgba(139, 92, 246, 0.6)';
            bg = 'rgba(139, 92, 246, 0.06)';
            statusBadge = 'badge-substitute';
            statusText = '⚡ SUBSTITUTION DUTY ASSIGNED';
          } else if (p.isOngoing) {
            cardBorder = '#22D3EE';
            bg = 'rgba(34, 211, 238, 0.08)';
            statusBadge = 'badge-cyan';
            statusText = '🟢 LIVE NOW (ONGOING)';
          } else if (p.status === 'broken') {
            cardBorder = 'rgba(239, 68, 68, 0.5)';
            bg = 'rgba(239, 68, 68, 0.08)';
            statusBadge = 'badge-affected';
            statusText = '🚨 FACULTY ABSENT — AT RISK';
          } else if (p.status === 'substituted' || p.status === 'covered_by_sub') {
            cardBorder = 'rgba(139, 92, 246, 0.45)';
            bg = 'rgba(139, 92, 246, 0.06)';
            statusBadge = 'badge-substitute';
            statusText = '⚡ SUBSTITUTED CLASS';
          } else if (p.status === 'self_study') {
            cardBorder = 'rgba(6, 182, 212, 0.4)';
            bg = 'rgba(6, 182, 212, 0.06)';
            statusBadge = 'badge-cyan';
            statusText = '📖 SUPERVISED SELF-STUDY';
          } else if (p.status === 'free') {
            statusBadge = 'badge-secondary';
            statusText = 'FREE PERIOD';
            bg = 'rgba(0, 0, 0, 0.01)';
          }

          const item = el('div', {
            className: 'card',
            style: `border: 1.5px solid ${cardBorder}; background: ${bg}; padding: 1.15rem 1.35rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-radius: 14px; transition: all 180ms ease;`
          },
            // Left: Period & Time
            el('div', { style: 'display: flex; align-items: center; gap: 1.25rem;' },
              el('div', {
                style: 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 80px; background: var(--bg-subtle, #f8fafc); padding: 0.55rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0);'
              },
                el('span', { style: 'font-size: 1.2rem; font-weight: 800; color: #0891b2; font-family: var(--font-mono);' }, `P${p.period}`),
                el('span', { style: 'font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;' }, 'Period')
              ),
              el('div', {},
                el('div', { style: 'display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;' },
                  el('span', { style: 'font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--text-muted);' }, p.timeSlot),
                  el('span', { className: `badge ${statusBadge}`, style: 'font-size: 0.68rem; font-weight: 800;' }, statusText)
                ),
                el('h4', { style: 'font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0.25rem 0 0.15rem 0;' },
                  `${p.subjectCode} — ${p.subjectName}`
                ),
                el('div', { style: 'font-size: 0.825rem; color: var(--text-muted); display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;' },
                  el('span', {}, `📍 Location: ${p.roomCode} ${p.batchName && p.batchName !== 'N/A' ? `(${p.batchName})` : ''}`),
                  p.isSubDuty
                    ? el('span', { style: 'color: #7c3aed; font-weight: 700;' }, `⚡ Covering duty for ${p.originalFacultyName}`)
                    : p.isSubstituted 
                    ? el('span', { style: 'color: #7c3aed; font-weight: 700;' }, `👤 Substitute: ${p.facultyName} (Covering for ${p.originalFacultyName})`)
                    : p.isBroken
                    ? el('span', { style: 'color: #EF4444; font-weight: 700;' }, `⚠️ Absent: ${p.facultyName}`)
                    : el('span', {}, `👤 Faculty: ${p.facultyName}`)
                )
              )
            ),
            // Right: Action or Room indicator
            el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' },
              (isHOD && (p.isSubstituted || p.isSubDuty)) ? el('button', {
                className: 'btn btn-secondary btn-sm',
                style: 'font-weight: 700; border-radius: 9999px; font-size: 0.775rem;',
                onClick: () => {
                  openManualReassignModal({
                    entryId: p.entryId,
                    date: selectedDate,
                    onSaved: () => renderActiveView()
                  });
                }
              }, '✏️ Edit Assignment') : null,
              (isHOD && p.status === 'broken') ? el('button', {
                className: 'btn btn-primary btn-sm',
                style: 'border-radius: 9999px; font-weight: 700;',
                onClick: () => {
                  openManualReassignModal({
                    entryId: p.entryId,
                    date: selectedDate,
                    onSaved: () => renderActiveView()
                  });
                }
              }, '⚡ Assign Substitute') : (!p.isSubstituted && !p.isSubDuty && p.status !== 'free' ? el('span', { className: 'badge badge-normal', style: 'font-size: 0.75rem;' }, 'Room Verified') : null)
            )
          );

          timelineList.appendChild(item);
        });

        liveWrapper.appendChild(timelineList);
        viewContainer.appendChild(liveWrapper);
      }

      // ==========================================
      // VIEW 3: CLASS DELIVERY & % CONDUCTED REGISTRY
      // ==========================================
      else if (activeTab === 'conduction') {
        const metrics = await api.getConductionMetrics();
        const condCard = el('div', { className: 'card', style: 'padding: 1.75rem; border-radius: 18px;' });

        condCard.appendChild(
          el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;' },
            el('div', {},
              el('h3', { className: 'card-title', style: 'margin: 0; font-size: 1.35rem; font-weight: 800;' }, '📊 Academic Delivery & % Class Conduction Registry'),
              el('p', { style: 'color: var(--text-muted); font-size: 0.85rem; margin: 0.25rem 0 0 0;' },
                'Tracks regular conduction, substitutions, and target fulfillment across institutional subjects.'
              )
            ),
            el('span', { className: 'badge badge-approved', style: 'font-size: 0.95rem; font-weight: 800; padding: 0.45rem 0.95rem;' },
              `Overall Delivery: ${metrics.overallPercent}%`
            )
          )
        );

        const table = el('table', { className: 'table', style: 'width: 100%; border-collapse: collapse;' });
        table.innerHTML = `
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid var(--border-color); background: var(--bg-subtle, #f8fafc);">
              <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Subject</th>
              <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Faculty</th>
              <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Scheduled</th>
              <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Conducted</th>
              <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Substituted</th>
              <th style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Delivery %</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.courses.map(c => `
              <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;">
                <td style="padding: 0.95rem 1rem;">
                  <strong style="color: var(--text-main); font-size: 0.95rem;">${c.subjectCode}</strong><br>
                  <small style="color: var(--text-muted); font-size: 0.8rem;">${c.subjectName}</small>
                </td>
                <td style="padding: 0.95rem 1rem; font-size: 0.875rem; font-weight: 600;">${c.facultyName}</td>
                <td style="padding: 0.95rem 1rem; font-size: 0.875rem; font-weight: 700;">${c.totalScheduled}</td>
                <td style="padding: 0.95rem 1rem; color: #059669; font-weight: 800; font-size: 0.875rem;">${c.regularConducted}</td>
                <td style="padding: 0.95rem 1rem; color: #0891B2; font-weight: 800; font-size: 0.875rem;">${c.substitutedConducted}</td>
                <td style="padding: 0.95rem 1rem;">
                  <span class="badge ${c.conductedPercent >= 95 ? 'badge-approved' : 'badge-pending'}" style="font-weight: 800; font-size: 0.8rem;">
                    ${c.conductedPercent}%
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        `;
        condCard.appendChild(table);
        viewContainer.appendChild(condCard);
      }
    };

    renderActiveView();
    return container;
  }
};
