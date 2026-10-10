// File: /js/pages/page-repair.js
// Autonomous & Manual Timetable Repair Console with Multi-Factor Best Recommended Engine
// Organized Case Triage, HOD Deletion/Dismissal Authority, and Systematic Slot Oversight

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { showToast } from '../ui/toast.js';
import { router } from '../core/router.js';
import { MOCK_DATABASE } from '../core/mock-data.js';
import { calculateBestSubstitutes } from '../core/smart-repair-engine.js';
import { openModal, closeModal } from '../ui/modal.js';
import { openManualReassignModal } from '../ui/manual-reassign-modal.js';

export const pageRepair = {
  async render() {
    const currentUser = auth.getCurrentUser() || { fullName: 'Faculty Member', role: 'teacher', id: 'f-1' };
    const isHOD = currentUser.role === 'hod' || currentUser.role === 'super_admin';

    const container = el('div', { style: 'display: flex; flex-direction: column; gap: 1.75rem;' });

    // 1. Top Header Banner
    const banner = el('div', {
      className: 'card',
      style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.08) 50%, #ffffff 100%); border-top: 3px solid #22D3EE; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; border-radius: 20px;'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; flex-wrap: wrap;' },
          el('span', { className: 'badge badge-approved' }, '● MULTI-FACTOR MATCH ENGINE'),
          el('span', { className: 'brand-team-badge' }, '⚡ TimeTrix • Team Anonymous'),
          el('span', { style: 'font-size: 0.75rem; color: #0891B2; font-family: var(--font-mono); font-weight: 700;' }, 'v2.5 SMART SOLVER')
        ),
        el('h2', { style: 'font-size: 1.85rem; font-weight: 800; letter-spacing: -0.025em; color: var(--text-main); margin: 0;' },
          'Autonomous & Manual Timetable Repair Console'
        ),
        el('p', { style: 'color: var(--text-muted); font-size: 0.9rem; margin-top: 0.35rem;' },
          'Resolve broken lecture slots with multi-factor academic matching: slot availability, subject specialty, syllabus catch-up, and workload fairness.'
        )
      ),
      el('div', { style: 'display: flex; gap: 0.75rem; flex-wrap: wrap;' },
        el('button', {
          className: 'btn btn-primary',
          style: 'border-radius: 9999px;',
          onClick: () => router.navigate('/timetable')
        }, '📅 View Live Timetable'),
        el('button', {
          className: 'btn btn-secondary',
          style: 'border-radius: 9999px;',
          onClick: () => router.navigate('/leaves')
        }, '🚨 Log Faculty Absence')
      )
    );
    container.appendChild(banner);

    // 2. Split Workspace: Left = Active Repair Cases, Right = Interactive Slot Repair Controls
    const workspace = el('div', {
      style: 'display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem; align-items: start;'
    });

    const leftPanel = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });
    const rightPanel = el('div', { className: 'card', style: 'padding: 1.75rem; min-height: 480px;' });

    workspace.appendChild(leftPanel);
    workspace.appendChild(rightPanel);
    container.appendChild(workspace);

    let activeFilter = 'all'; // 'action_needed' | 'resolved' | 'all'
    let searchQuery = '';
    let selectedCaseId = null;

    // Modal: Confirmation to Delete / Clear Repair Case
    const confirmDeleteModal = (rCase) => {
      const content = el('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' },
        el('div', { style: 'background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1rem;' },
          el('h4', { style: 'color: #dc2626; margin: 0 0 0.35rem 0; font-weight: 800;' }, '⚠️ Delete / Clear Repair Case'),
          el('p', { style: 'font-size: 0.85rem; color: var(--text-muted); margin: 0;' },
            `Are you sure you want to delete the repair case for ` +
            `<strong>${rCase.facultyName}</strong> for date <strong>${rCase.targetDate}</strong>?`
          )
        ),
        el('div', { style: 'font-size: 0.85rem; color: var(--text-main); font-weight: 700;' }, 'Choose Deletion Scope:'),
        el('div', { style: 'display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-subtle, #f8fafc); padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0);' },
          el('label', { style: 'display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.825rem; cursor: pointer;' },
            el('input', { type: 'radio', name: 'del_scope', value: 'revert', checked: true }),
            el('div', {},
              el('strong', { style: 'color: var(--text-main);' }, '🗑️ Delete Case & Revert Schedule to Original'),
              el('div', { style: 'color: var(--text-muted); font-size: 0.775rem; margin-top: 0.15rem;' },
                'Cancels assigned substitute duties, resets teacher attendance to Present, and restores original schedule slots.'
              )
            )
          ),
          el('label', { style: 'display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.825rem; cursor: pointer;' },
            el('input', { type: 'radio', name: 'del_scope', value: 'dismiss_only' }),
            el('div', {},
              el('strong', { style: 'color: var(--text-main);' }, '📁 Dismiss Case Only (Keep Timetable Substitutions)'),
              el('div', { style: 'color: var(--text-muted); font-size: 0.775rem; margin-top: 0.15rem;' },
                'Removes case from this active triage console, but leaves current substitute teacher assignments intact in the timetable.'
              )
            )
          )
        )
      );

      const cancelBtn = el('button', { className: 'btn btn-secondary btn-sm', onClick: closeModal }, 'Cancel');
      const confirmBtn = el('button', {
        className: 'btn btn-danger btn-sm',
        onClick: async () => {
          try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Deleting...';
            const revert = content.querySelector('input[value="revert"]').checked;
            await api.deleteRepairCase(rCase.id, { revertOverrides: revert, editorUser: currentUser });
            showToast(`Repair case for ${rCase.facultyName} deleted successfully.`, 'success');
            closeModal();
            selectedCaseId = null;
            await renderWorkspace();
          } catch (err) {
            showToast(err.message, 'error');
            confirmBtn.disabled = false;
            confirmBtn.textContent = '🗑️ Delete Case';
          }
        }
      }, '🗑️ Delete Case');

      openModal('Delete Repair Case', content, [cancelBtn, confirmBtn]);
    };

    // Render Workspace
    const renderWorkspace = async () => {
      leftPanel.innerHTML = '';
      rightPanel.innerHTML = '';

      const allCases = await api.getRepairCases();

      if (!allCases || allCases.length === 0) {
        leftPanel.appendChild(el('div', {
          className: 'card',
          style: 'text-align: center; padding: 2rem;'
        },
          el('div', { style: 'font-size: 2.2rem; margin-bottom: 0.5rem;' }, '✨'),
          el('h4', { style: 'color: var(--text-main); margin-bottom: 0.35rem; font-weight: 800;' }, 'Zero Repair Cases'),
          el('p', { style: 'font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;' },
            'All faculty are present and classes are running normally. No broken sessions detected.'
          ),
          el('button', {
            className: 'btn btn-danger btn-sm',
            style: 'border-radius: 9999px;',
            onClick: () => router.navigate('/leaves')
          }, '🚨 Report Faculty Absence')
        ));

        rightPanel.innerHTML = `
          <div style="text-align: center; padding: 3.5rem 1.5rem; color: var(--text-muted);">
            <span style="font-size: 2.5rem;">⚡</span>
            <h3 style="color: var(--text-main); margin: 0.65rem 0 0.35rem 0; font-weight: 800;">Zero Broken Lecture Slots</h3>
            <p style="font-size: 0.875rem; max-width: 480px; margin: 0 auto;">When a faculty member is marked absent, their broken sessions will automatically appear here with multi-factor Best Recommended replacements.</p>
          </div>
        `;
        return;
      }

      // Filter and Search Cases
      let filteredCases = [...allCases];

      if (activeFilter === 'action_needed') {
        filteredCases = filteredCases.filter(c => c.status !== 'applied' && (c.totalAffectedSessions || 0) > 0);
      } else if (activeFilter === 'resolved') {
        filteredCases = filteredCases.filter(c => c.status === 'applied');
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filteredCases = filteredCases.filter(c => 
          (c.facultyName && c.facultyName.toLowerCase().includes(q)) ||
          (c.targetDate && c.targetDate.includes(q))
        );
      }

      // ------------------------------------------
      // LEFT PANEL: CASE TRIAGE FILTERS & LIST
      // ------------------------------------------
      const filterTabsContainer = el('div', {
        style: 'display: flex; gap: 0.35rem; background: var(--bg-subtle, #f1f5f9); padding: 0.25rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0);'
      });

      const tabs = [
        { id: 'all', label: `All (${allCases.length})` },
        { id: 'action_needed', label: 'Action Needed' },
        { id: 'resolved', label: 'Resolved' }
      ];

      tabs.forEach(t => {
        const btn = el('button', {
          className: `btn btn-sm ${activeFilter === t.id ? 'btn-primary' : 'btn-secondary'}`,
          style: 'flex: 1; padding: 0.35rem 0.5rem; font-size: 0.75rem; font-weight: 700;'
        }, t.label);
        btn.onclick = () => {
          activeFilter = t.id;
          renderWorkspace();
        };
        filterTabsContainer.appendChild(btn);
      });
      leftPanel.appendChild(filterTabsContainer);

      // Search Bar
      const searchInput = el('input', {
        type: 'text',
        className: 'form-control',
        placeholder: '🔍 Search faculty or date...',
        value: searchQuery,
        style: 'font-size: 0.8rem; padding: 0.45rem 0.75rem;'
      });
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        renderWorkspace();
      };
      leftPanel.appendChild(searchInput);

      // Cases Cards List
      const caseCardsList = el('div', { style: 'display: flex; flex-direction: column; gap: 0.65rem;' });

      if (filteredCases.length === 0) {
        caseCardsList.appendChild(
          el('div', { style: 'text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.825rem;' },
            'No repair cases match this filter.'
          )
        );
      } else {
        // Ensure selected case exists in filtered cases
        let selectedCase = filteredCases.find(c => c.id === selectedCaseId);
        if (!selectedCase) {
          selectedCase = filteredCases[0];
          selectedCaseId = selectedCase?.id;
        }

        filteredCases.forEach((c) => {
          const isSelected = c.id === selectedCase?.id;
          const isResolved = c.status === 'applied';
          const isZeroBroken = (c.totalAffectedSessions || 0) === 0;

          const card = el('div', {
            className: 'card',
            style: `cursor: pointer; padding: 0.95rem 1.15rem; border: 1.5px solid ${isSelected ? '#22D3EE' : 'var(--border-glass, #e2e8f0)'}; background: ${isSelected ? 'rgba(34, 211, 238, 0.06)' : '#ffffff'}; box-shadow: ${isSelected ? '0 8px 20px -4px rgba(34, 211, 238, 0.25)' : 'var(--shadow-sm)'}; transition: all 180ms ease; display: flex; flex-direction: column; gap: 0.45rem;`
          });

          const topRow = el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
            el('strong', { style: 'font-size: 0.95rem; color: var(--text-main);' }, c.facultyName || 'Faculty'),
            el('div', { style: 'display: flex; align-items: center; gap: 0.4rem;' },
              el('span', {
                className: `badge ${isZeroBroken ? 'badge-primary' : (isResolved ? 'badge-approved' : 'badge-conflict')}`,
                style: 'font-size: 0.65rem; border-radius: 9999px;'
              },
                isZeroBroken ? '0 SLOTS' : (isResolved ? 'RESOLVED' : 'BROKEN')
              ),
              isHOD ? el('button', {
                style: 'background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 0.85rem; padding: 2px 4px; border-radius: 4px; transition: color 150ms;',
                title: 'Delete / Dismiss Case',
                onClick: (e) => {
                  e.stopPropagation();
                  confirmDeleteModal(c);
                }
              }, '🗑️') : null
            )
          );

          const bottomRow = el('div', { style: 'font-size: 0.775rem; color: var(--text-muted); display: flex; justify-content: space-between;' },
            el('span', { style: 'font-family: var(--font-mono);' }, `📅 ${c.targetDate}`),
            el('span', {}, isZeroBroken ? 'No Disrupted Slots' : `Broken Slots: ${c.totalAffectedSessions}`)
          );

          card.appendChild(topRow);
          card.appendChild(bottomRow);

          card.onclick = () => {
            selectedCaseId = c.id;
            renderWorkspace();
          };

          caseCardsList.appendChild(card);
        });
      }

      leftPanel.appendChild(caseCardsList);

      // ------------------------------------------
      // RIGHT PANEL: CASE DETAIL & SLOT RESOLUTIONS
      // ------------------------------------------
      const activeCase = allCases.find(c => c.id === selectedCaseId) || filteredCases[0];

      if (!activeCase) {
        rightPanel.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);">Select a case to inspect details.</div>';
        return;
      }

      const targetDate = activeCase.targetDate;
      const targetWeekday = new Date(targetDate).getDay() || 7;
      const isCaseResolved = activeCase.status === 'applied';

      // Find absent teacher and their scheduled sessions on that weekday
      const targetAbsence = MOCK_DATABASE.absences.find(a => a.id === activeCase.absenceId);
      const absentFacultyId = targetAbsence?.facultyId || MOCK_DATABASE.users.find(u => u.fullName === activeCase.facultyName)?.id;

      const brokenSessions = MOCK_DATABASE.baseTimetable.filter(
        s => s.facultyId === absentFacultyId && s.weekday === targetWeekday
      );

      // Top Control Bar in Right Panel
      const controlBar = el('div', {
        style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-glass, #e2e8f0); padding-bottom: 1.25rem; margin-bottom: 1.5rem;'
      },
        el('div', {},
          el('div', { style: 'display: flex; align-items: center; gap: 0.6rem;' },
            el('h3', { style: 'font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 0;' },
              `Repair Case: ${activeCase.facultyName}`
            ),
            el('span', {
              className: `badge ${brokenSessions.length === 0 ? 'badge-primary' : (isCaseResolved ? 'badge-approved' : 'badge-conflict')}`,
              style: 'border-radius: 9999px;'
            },
              brokenSessions.length === 0 ? '0 SLOTS DISRUPTED' : (isCaseResolved ? '✓ ALL SLOTS REPAIRED' : 'ACTION REQUIRED')
            )
          ),
          el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin: 0.25rem 0 0 0;' },
            `Target Date: ${activeCase.targetDate} | Department: ${activeCase.departmentName || 'Engineering'} | Broken Lectures: ${brokenSessions.length}`
          )
        ),
        el('div', { style: 'display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;' },
          // 1-Click Smart Repair (if unresolved and broken sessions exist)
          !isCaseResolved && brokenSessions.length > 0 ? el('button', {
            className: 'btn btn-primary btn-sm',
            style: 'border-radius: 9999px; font-weight: 700;',
            onClick: async () => {
              try {
                await api.applyAllRepairs(activeCase.id);
                showToast(`1-Click Smart Repair executed! All broken slots assigned to top qualified teachers.`, 'success');
                await renderWorkspace();
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          }, '⚡ 1-Click Smart Repair') : null,

          // View in Timetable Button
          el('button', {
            className: 'btn btn-primary btn-sm',
            style: 'border-radius: 9999px;',
            onClick: () => router.navigate('/timetable')
          }, '📅 View Timetable'),

          // Delete Case Button (HOD / Admin)
          isHOD ? el('button', {
            className: 'btn btn-secondary btn-sm',
            style: 'border-radius: 9999px; color: #dc2626; border-color: rgba(239, 68, 68, 0.4);',
            title: 'Delete or Dismiss this Case',
            onClick: () => confirmDeleteModal(activeCase)
          }, '🗑️ Delete Case') : null
        )
      );
      rightPanel.appendChild(controlBar);

      // CASE SCENARIO 1: ZERO BROKEN LECTURES (Teacher has off-day)
      if (brokenSessions.length === 0) {
        rightPanel.appendChild(
          el('div', {
            style: 'background: rgba(34, 211, 238, 0.05); border: 1.5px dashed rgba(34, 211, 238, 0.35); border-radius: 16px; padding: 2.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;'
          },
            el('span', { style: 'font-size: 2.25rem;' }, '✨'),
            el('h4', { style: 'font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0;' },
              'No Scheduled Teaching Lectures Disrupted'
            ),
            el('p', { style: 'font-size: 0.85rem; color: var(--text-muted); max-width: 520px; line-height: 1.5; margin: 0;' },
              `${activeCase.facultyName} has 0 teaching lectures scheduled on ${activeCase.targetDate} (Off-Duty / Weekend / Free Day). Their absence is safely recorded in institutional records, and no timetable substitution is needed.`
            ),
            isHOD ? el('div', { style: 'margin-top: 0.5rem;' },
              el('button', {
                className: 'btn btn-secondary btn-sm',
                style: 'border-radius: 9999px; color: #dc2626;',
                onClick: () => confirmDeleteModal(activeCase)
              }, '🗑️ Clear / Dismiss This Case')
            ) : null
          )
        );
        return;
      }

      // CASE SCENARIO 2: BROKEN LECTURES EXIST (Inspect each period)
      const slotsContainer = el('div', { style: 'display: flex; flex-direction: column; gap: 1.25rem;' });

      brokenSessions.forEach((session) => {
        // Find existing override if already repaired
        const existingOverride = MOCK_DATABASE.sessionOverrides.find(
          ov => ov.entryId === session.entryId && ov.sessionDate === activeCase.targetDate
        );

        const isSlotRepaired = !!existingOverride;

        // Calculate Best Ranked Candidates using Multi-Factor Engine
        const candidates = calculateBestSubstitutes(session, activeCase.targetDate, targetWeekday);
        const topCandidate = candidates.find(c => c.isFree);

        const slotCard = el('div', {
          className: 'card',
          style: `border: 1.5px solid ${isSlotRepaired ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.35)'}; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; border-top: 3.5px solid ${isSlotRepaired ? '#10B981' : '#EF4444'}; background: #ffffff;`
        });

        // Slot Header Info
        const slotHeader = el('div', { style: 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;' },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.6rem;' },
              el('span', {
                style: 'font-size: 1.15rem; font-weight: 800; font-family: var(--font-mono); color: #0891b2;'
              }, `Period ${session.period}`),
              el('span', { className: `badge ${isSlotRepaired ? 'badge-approved' : 'badge-conflict'}`, style: 'font-size: 0.7rem; border-radius: 9999px;' },
                isSlotRepaired ? (existingOverride.kind === 'substitute' ? '✓ REPLACED' : '✓ SELF-STUDY') : '⚠️ BROKEN SLOT'
              )
            ),
            el('h4', { style: 'font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0.25rem 0 0 0;' },
              `${session.subjectCode} — ${session.subjectName}`
            ),
            el('p', { style: 'font-size: 0.775rem; color: var(--text-muted); margin: 0.15rem 0 0 0;' },
              `Room: ${session.roomCode} | Batch: ${session.batchName || 'B.Tech I Year'} | Scheduled Faculty: ${session.facultyName}`
            )
          ),
          el('div', { style: 'display: flex; gap: 0.5rem;' },
            // Reassign / Edit Button (HOD & Admin)
            isHOD ? el('button', {
              className: 'btn btn-secondary btn-sm',
              style: 'border-radius: 9999px; font-weight: 700; font-size: 0.75rem;',
              onClick: () => {
                openManualReassignModal({
                  entryId: session.entryId,
                  date: activeCase.targetDate,
                  onSaved: () => renderWorkspace()
                });
              }
            }, isSlotRepaired ? '✏️ Re-Assign Faculty' : '👤 Manual Assign') : null
          )
        );
        slotCard.appendChild(slotHeader);

        // Substituted Status Details or Multi-Factor Recommendation Box
        if (isSlotRepaired) {
          const subDetailsBox = el('div', {
            style: 'background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;'
          },
            el('div', {},
              el('div', { style: 'font-size: 0.85rem; font-weight: 700; color: #059669;' },
                existingOverride.kind === 'substitute'
                  ? `👤 Covered by: ${existingOverride.substituteFacultyName}`
                  : `📖 Monitored Self-Study Block Designated`
              ),
              el('div', { style: 'font-size: 0.775rem; color: var(--text-muted); margin-top: 0.2rem;' },
                `Reason: "${existingOverride.reason || 'Auto-Assigned Best Match'}"`
              )
            ),
            el('span', {
              style: 'font-size: 0.725rem; font-family: var(--font-mono); color: #059669; font-weight: 700;'
            }, `Applied: ${new Date(existingOverride.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
          );
          slotCard.appendChild(subDetailsBox);
        } else {
          // Candidate Match Recommendation Box
          if (topCandidate) {
            const matchBox = el('div', {
              style: 'background: rgba(34, 211, 238, 0.06); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 10px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;'
            },
              el('div', {},
                el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
                  el('span', { className: 'badge badge-approved', style: 'font-size: 0.65rem;' }, `${topCandidate.matchPercentage}% BEST MATCH`),
                  el('strong', { style: 'font-size: 0.95rem; color: var(--text-main);' }, topCandidate.teacher.fullName),
                  el('span', { style: 'font-size: 0.75rem; color: var(--text-muted);' }, `(${topCandidate.teacher.designation || 'Faculty'})`)
                ),
                el('div', { style: 'font-size: 0.775rem; color: #0891b2; margin-top: 0.25rem;' },
                  `Multi-Factor Analysis: ${topCandidate.justification}`
                )
              ),
              isHOD ? el('button', {
                className: 'btn btn-primary btn-sm',
                style: 'border-radius: 9999px; font-weight: 700; font-size: 0.775rem;',
                onClick: async () => {
                  try {
                    await api.applyManualRepair(
                      activeCase.id,
                      session.entryId,
                      topCandidate.teacher.id,
                      'substitute',
                      `Auto-Assigned Top Candidate (${topCandidate.matchPercentage}% Match)`,
                      currentUser
                    );
                    showToast(`Assigned ${topCandidate.teacher.fullName} to Period ${session.period}`, 'success');
                    await renderWorkspace();
                  } catch (err) {
                    showToast(err.message, 'error');
                  }
                }
              }, `✓ Assign ${topCandidate.teacher.fullName.split(' ')[0]}`) : null
            );
            slotCard.appendChild(matchBox);
          }
        }

        slotsContainer.appendChild(slotCard);
      });

      rightPanel.appendChild(slotsContainer);
    };

    await renderWorkspace();
    return container;
  }
};
