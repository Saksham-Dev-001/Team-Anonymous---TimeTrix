// File: /js/pages/page-leaves.js
// Multi-Role Academic Leave Management & Emergency Absence Portal
// Built with Exact Institutional Workflow: Planned Leaves, HOD Approvals, and Emergency Absence Handover

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { showToast } from '../ui/toast.js';
import { router } from '../core/router.js';
import { getTodayIST } from '../core/format.js';
import { MOCK_DATABASE } from '../core/mock-data.js';

export const pageLeaves = {
  async render() {
    const user = auth.getCurrentUser() || { fullName: 'Faculty Member', role: 'teacher', id: 'f-1', academicId: 'FAC-101' };
    const isTeacher = user.role === 'teacher';
    const isHOD = user.role === 'hod';
    const isAdmin = user.role === 'super_admin';
    const today = getTodayIST();

    const container = el('div', { style: 'max-width: 980px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem;' });

    // ==========================================
    // 1. TOP HEADER BANNER
    // ==========================================
    const roleBadgeClass = isTeacher ? 'badge-primary' : (isHOD ? 'badge-substitute' : 'badge-affected');
    const roleTitleText = isTeacher ? 'FACULTY PORTAL' : (isHOD ? 'HOD APPROVAL DESK' : 'ADMIN OFFICE');

    const banner = el('div', {
      className: 'card',
      style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(139, 92, 246, 0.08)); border: 1px solid var(--border-glass-active); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;' },
          el('span', { className: `badge ${roleBadgeClass}` }, roleTitleText),
          el('span', { style: 'font-size: 0.825rem; color: var(--primary-accent); font-family: var(--font-mono); font-weight: 700;' },
            `[${user.academicId || user.id}] ${user.fullName}`
          ),
          el('span', { style: 'font-size: 0.8rem; color: var(--text-muted);' }, `• ${user.departmentName || 'Engineering'}`)
        ),
        el('h2', { style: 'font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em;' },
          isTeacher ? 'Faculty Leave Management & Emergency Absence' : 'Department Faculty Leave Approvals & Absence Dispatch'
        ),
        el('p', { style: 'color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;' },
          isTeacher
            ? 'Apply for planned leave with live lecture impact analysis, handpick substitute colleagues, or log emergency sudden absence today.'
            : 'Review incoming teacher leave applications, inspect lecture impact, and approve with instant timetable reallocation.'
        )
      ),
      el('div', { style: 'display: flex; align-items: center; gap: 0.75rem;' },
        el('div', { style: 'background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 0.5rem 0.95rem; text-align: right; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);' },
          el('div', { style: 'font-size: 0.7rem; color: #64748B; font-weight: 700; text-transform: uppercase;' }, 'Today (IST)'),
          el('div', { style: 'font-family: var(--font-mono); font-weight: 800; color: #0284c7; font-size: 0.95rem;' }, today)
        )
      )
    );
    container.appendChild(banner);

    // ==========================================
    // 2. TEACHER VIEW
    // ==========================================
    if (isTeacher) {
      // Container for Emergency Card + Planned Leave Card
      const teacherGrid = el('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 1.5rem;' });

      // ------------------------------------------
      // CARD 1: EMERGENCY ABSENCE TODAY
      // ------------------------------------------
      const emergencyCard = el('div', {
        className: 'card',
        style: 'border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 25px -5px rgba(239, 68, 68, 0.15); display: flex; flex-direction: column; justify-content: space-between;'
      });

      const refreshEmergencyCard = async () => {
        emergencyCard.innerHTML = '';

        // Check if currently marked absent today
        const isAbsentToday = MOCK_DATABASE.absences.some(a => a.facultyId === user.id && a.absenceDate === today);
        const todayLectures = await api.getTeacherScheduleForDate(user.id, today);

        // Header
        emergencyCard.appendChild(
          el('div', { className: 'card-header', style: 'margin-bottom: 0.75rem;' },
            el('div', {},
              el('h3', { className: 'card-title', style: 'color: #f87171; display: flex; align-items: center; gap: 0.5rem;' },
                '🚨 Emergency Absence Today'
              ),
              el('p', { style: 'color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;' },
                'Sudden medical emergency or illness? Instantly notify department and reallocate schedule.'
              )
            ),
            el('span', { className: isAbsentToday ? 'badge badge-normal' : 'badge badge-affected' },
              isAbsentToday ? 'ABSENT REGISTERED' : 'TODAY: ' + today
            )
          )
        );

        // If ALREADY marked absent today:
        if (isAbsentToday) {
          const coveredCount = todayLectures.filter(l => l.override && l.override.kind === 'substitute').length;
          const selfStudyCount = todayLectures.filter(l => l.override && l.override.kind === 'self_study').length;

          const activeStatusBox = el('div', {
            style: 'background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;'
          },
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; color: var(--color-approved); font-weight: 700; font-size: 0.95rem;' },
              '✅ Emergency Absence is Active for Today'
            ),
            el('p', { style: 'color: var(--text-muted); font-size: 0.825rem; margin-top: 0.35rem;' },
              `Your timetable has been updated. ${todayLectures.length} scheduled lecture(s) covered (${coveredCount} substitute assigned, ${selfStudyCount} self-study).`
            ),
            el('div', { style: 'display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.85rem;' },
              ...todayLectures.map(l => {
                const subName = l.override?.substituteFacultyName || (l.override?.kind === 'self_study' ? 'Self-Study Monitored' : 'Pending');
                return el('div', {
                  style: 'background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.6rem 0.85rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);'
                },
                  el('div', {},
                    el('strong', { style: 'color: #0284c7; font-weight: 800;' }, `Period ${l.period}: `),
                    el('span', { style: 'color: #0F172A; font-weight: 700;' }, l.subjectCode),
                    el('span', { style: 'color: #64748B; font-weight: 500;' }, ` (${l.roomCode})`)
                  ),
                  el('span', { className: 'badge badge-substitute', style: 'font-size: 0.75rem; padding: 2px 8px;' }, `Covered by: ${subName}`)
                );
              })
            )
          );

          emergencyCard.appendChild(activeStatusBox);

          const viewTimetableBtn = el('button', {
            className: 'btn btn-primary',
            style: 'width: 100%; padding: 0.85rem;'
          }, '📅 View Updated Live Timetable');
          viewTimetableBtn.onclick = () => router.navigate('/timetable');
          emergencyCard.appendChild(viewTimetableBtn);
          return;
        }

        // If NOT yet marked absent today:
        // 1. Scheduled Lectures Preview
        const previewBox = el('div', {
          style: 'background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 0.95rem 1.15rem; margin-bottom: 1rem;'
        });

        if (todayLectures.length === 0) {
          previewBox.innerHTML = `
            <div style="font-size: 0.825rem; color: #059669; font-weight: 700;">✨ No Scheduled Lectures Today</div>
            <div style="font-size: 0.775rem; color: #64748B; margin-top: 0.2rem;">You have 0 teaching periods scheduled for today (Off-duty / Free Day).</div>
          `;
        } else {
          previewBox.appendChild(
            el('div', { style: 'font-size: 0.825rem; font-weight: 800; color: #DC2626; margin-bottom: 0.5rem;' },
              `⚠️ ${todayLectures.length} Lectures at Risk Today (${today}):`
            )
          );
          const slotsRow = el('div', { style: 'display: flex; flex-wrap: wrap; gap: 0.45rem;' });
          todayLectures.forEach(l => {
            slotsRow.appendChild(
              el('span', {
                style: 'background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.28); border-radius: 6px; padding: 0.3rem 0.6rem; font-size: 0.75rem; font-family: var(--font-mono); color: #B91C1C; font-weight: 700;'
              }, `P${l.period}: ${l.subjectCode} (${l.roomCode})`)
            );
          });
          previewBox.appendChild(slotsRow);
        }
        emergencyCard.appendChild(previewBox);

        // 2. Handover Mode Selector (Auto Best-Recommended vs Handpick Free Colleague)
        let selectedHandoverMode = 'auto'; // 'auto' | 'handpick'
        let chosenColleagueId = null;

        const btnGrid = el('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;' });
        const modeSelector = el('div', { style: 'margin-bottom: 1rem;' },
          el('label', { className: 'form-label', style: 'font-size: 0.8rem; margin-bottom: 0.4rem; display: block;' }, 'Substitute Assignment Method:'),
          btnGrid
        );

        const autoBtn = el('button', {
          type: 'button',
          className: 'btn btn-primary btn-sm',
          style: 'padding: 0.6rem; font-size: 0.8rem; text-align: center;'
        }, '⚡ Auto Best Match');

        const handpickBtn = el('button', {
          type: 'button',
          className: 'btn btn-secondary btn-sm',
          style: 'padding: 0.6rem; font-size: 0.8rem; text-align: center;'
        }, '👤 Handpick Colleague');

        btnGrid.appendChild(autoBtn);
        btnGrid.appendChild(handpickBtn);
        emergencyCard.appendChild(modeSelector);

        // Colleague Dropdown Container (toggled when Handpick is chosen)
        const colleagueContainer = el('div', { style: 'margin-bottom: 1rem; display: none;' });
        const colleagueSelect = el('select', { className: 'form-control', style: 'font-size: 0.825rem;' });
        colleagueContainer.appendChild(el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Select Free Department Colleague:'));
        colleagueContainer.appendChild(colleagueSelect);
        emergencyCard.appendChild(colleagueContainer);

        // Populate colleagues
        const loadColleagues = async () => {
          colleagueSelect.innerHTML = '';
          const colleagues = await api.getColleaguesForHandover(user.id, today);
          colleagues.forEach(c => {
            const statusLabel = c.isAbsent ? '⚠️ Absent Today' : `${c.freeCount} periods free`;
            const opt = el('option', { value: c.id, disabled: c.isAbsent }, `${c.fullName} (${c.designation}) — [${statusLabel}]`);
            colleagueSelect.appendChild(opt);
          });
          if (colleagues.length > 0) chosenColleagueId = colleagueSelect.value;
        };

        colleagueSelect.onchange = () => {
          chosenColleagueId = colleagueSelect.value;
        };

        autoBtn.onclick = () => {
          selectedHandoverMode = 'auto';
          autoBtn.className = 'btn btn-primary btn-sm';
          handpickBtn.className = 'btn btn-secondary btn-sm';
          colleagueContainer.style.display = 'none';
        };

        handpickBtn.onclick = async () => {
          selectedHandoverMode = 'handpick';
          handpickBtn.className = 'btn btn-primary btn-sm';
          autoBtn.className = 'btn btn-secondary btn-sm';
          colleagueContainer.style.display = 'block';
          await loadColleagues();
        };

        // Emergency Remarks Input
        const remarksInput = el('input', {
          type: 'text',
          className: 'form-control',
          placeholder: 'Emergency reason (e.g. High fever, urgent medical emergency)',
          value: 'Sudden illness / Medical emergency',
          style: 'margin-bottom: 1.25rem; font-size: 0.85rem;'
        });
        emergencyCard.appendChild(el('div', { className: 'form-group' },
          el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Emergency Reason / Remarks:'),
          remarksInput
        ));

        // Submit Action Button
        const markAbsenceBtn = el('button', {
          className: 'btn btn-danger',
          style: 'width: 100%; padding: 0.85rem; font-weight: 700; font-size: 0.925rem;'
        }, '🚨 Submit Emergency Absence & Update Timetable');

        markAbsenceBtn.onclick = async () => {
          try {
            markAbsenceBtn.disabled = true;
            markAbsenceBtn.textContent = 'Updating Timetable & Dispatching Alerts...';

            await api.markSuddenAbsence({
              faculty_id: user.id,
              absence_date: today,
              remarks: remarksInput.value.trim() || 'Sudden emergency absence',
              preferredSubstituteId: selectedHandoverMode === 'handpick' ? chosenColleagueId : null
            });

            showToast('⚡ Emergency absence logged! Timetable auto-updated & notifications sent.', 'success');
            await refreshEmergencyCard();
            if (refreshTeacherHistory) await refreshTeacherHistory();
          } catch (err) {
            showToast(err.message, 'error');
            markAbsenceBtn.disabled = false;
            markAbsenceBtn.textContent = '🚨 Submit Emergency Absence & Update Timetable';
          }
        };

        emergencyCard.appendChild(markAbsenceBtn);
      };

      await refreshEmergencyCard();
      teacherGrid.appendChild(emergencyCard);

      // ------------------------------------------
      // CARD 2: APPLY FOR PLANNED ACADEMIC LEAVE
      // ------------------------------------------
      const plannedCard = el('div', { className: 'card', style: 'display: flex; flex-direction: column; justify-content: space-between;' });

      plannedCard.appendChild(
        el('div', { className: 'card-header' },
          el('div', {},
            el('h3', { className: 'card-title' }, '📝 Apply for Planned Leave'),
            el('p', { style: 'color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;' },
              'Submit advance request to Department HOD with live lecture impact preview.'
            )
          ),
          el('span', { className: 'badge badge-substitute' }, 'HOD Approval')
        )
      );

      const plannedForm = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });

      // Leave Type
      const leaveTypeSelect = el('select', { className: 'form-control', style: 'font-size: 0.85rem;' },
        el('option', { value: 'Casual Leave (CL)' }, 'Casual Leave (CL)'),
        el('option', { value: 'Medical Leave (ML)' }, 'Medical Leave (ML)'),
        el('option', { value: 'On-Duty Academic Leave (OD)' }, 'On-Duty Academic Leave (OD) — Conference / University Duty'),
        el('option', { value: 'Earned Leave (EL)' }, 'Earned Leave (EL)'),
        el('option', { value: 'Special Casual Leave (SCL)' }, 'Special Casual Leave (SCL)')
      );
      plannedForm.appendChild(el('div', { className: 'form-group' },
        el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Leave Classification:'),
        leaveTypeSelect
      ));

      // Leave Date
      const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const leaveDateInput = el('input', {
        type: 'date',
        className: 'form-control',
        value: tomorrowDate,
        min: today,
        style: 'font-size: 0.85rem;'
      });
      plannedForm.appendChild(el('div', { className: 'form-group' },
        el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Date of Absence:'),
        leaveDateInput
      ));

      // Live Lecture Impact Preview Container
      const impactContainer = el('div', {
        style: 'background: rgba(34, 211, 238, 0.05); border: 1px solid rgba(34, 211, 238, 0.2); border-radius: var(--radius-sm); padding: 0.75rem 0.9rem;'
      });
      plannedForm.appendChild(impactContainer);

      let currentImpactSlots = [];

      const updateImpactPreview = async () => {
        const targetDate = leaveDateInput.value;
        impactContainer.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted);">Analyzing schedule on this date...</span>';

        currentImpactSlots = await api.getTeacherScheduleForDate(user.id, targetDate);

        impactContainer.innerHTML = '';
        if (currentImpactSlots.length === 0) {
          impactContainer.innerHTML = `
            <div style="font-size: 0.8rem; color: var(--color-approved); font-weight: 600;">✨ Zero Scheduled Lectures on ${targetDate}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">No lecture slots will be disrupted. Normal attendance recorded.</div>
          `;
        } else {
          const title = el('div', { style: 'font-size: 0.8rem; font-weight: 700; color: var(--primary-accent); margin-bottom: 0.4rem;' },
            `🎯 Lecture Impact Preview: ${currentImpactSlots.length} slot(s) on ${targetDate}`
          );
          const slotsDiv = el('div', { style: 'display: flex; flex-wrap: wrap; gap: 0.4rem;' });
          currentImpactSlots.forEach(s => {
            slotsDiv.appendChild(
              el('span', {
                style: 'background: rgba(34, 211, 238, 0.12); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: var(--radius-sm); padding: 0.2rem 0.5rem; font-size: 0.725rem; font-family: var(--font-mono); color: var(--primary-accent);'
              }, `P${s.period}: ${s.subjectCode} (${s.roomCode})`)
            );
          });
          impactContainer.appendChild(title);
          impactContainer.appendChild(slotsDiv);
        }

        // Also update suggested colleague dropdown for this date
        await updatePlannedColleagues();
      };

      // Substitute Suggestion for Planned Leave
      const prefContainer = el('div', { className: 'form-group' });
      const prefSelect = el('select', { className: 'form-control', style: 'font-size: 0.85rem;' });
      prefContainer.appendChild(el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Substitute Suggestion for HOD:'));
      prefContainer.appendChild(prefSelect);
      plannedForm.appendChild(prefContainer);

      const updatePlannedColleagues = async () => {
        prefSelect.innerHTML = '';
        prefSelect.appendChild(el('option', { value: '' }, '⚡ Autonomous Engine (Assign #1 Best Recommended Faculty)'));

        const colleagues = await api.getColleaguesForHandover(user.id, leaveDateInput.value);
        colleagues.forEach(c => {
          const opt = el('option', { value: c.id }, `👤 Pre-Coordinated: ${c.fullName} (${c.freeCount} periods free)`);
          prefSelect.appendChild(opt);
        });
      };

      leaveDateInput.onchange = updateImpactPreview;
      await updateImpactPreview();

      // Reason Textarea
      const reasonInput = el('textarea', {
        className: 'form-control',
        rows: 2,
        placeholder: 'Official reason for leave (e.g. Attending IEEE conference, Medical consultation)',
        style: 'font-size: 0.85rem;'
      });
      plannedForm.appendChild(el('div', { className: 'form-group' },
        el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Official Reason for HOD Review:'),
        reasonInput
      ));

      // Submit Leave Application
      const submitLeaveBtn = el('button', {
        className: 'btn btn-primary',
        style: 'width: 100%; padding: 0.85rem; font-weight: 700; font-size: 0.925rem; margin-top: 0.5rem;'
      }, '✉️ Submit Application for HOD Approval');

      submitLeaveBtn.onclick = async () => {
        if (!reasonInput.value.trim()) {
          showToast('Please provide an official reason for the leave.', 'warning');
          reasonInput.focus();
          return;
        }

        try {
          submitLeaveBtn.disabled = true;
          submitLeaveBtn.textContent = 'Submitting to HOD...';

          const chosenSubId = prefSelect.value || null;
          let chosenSubName = null;
          if (chosenSubId) {
            const subTeacher = MOCK_DATABASE.users.find(u => u.id === chosenSubId);
            if (subTeacher) chosenSubName = subTeacher.fullName;
          }

          const impactSummary = currentImpactSlots.map(s => `P${s.period}: ${s.subjectCode}`).join(', ');

          await api.applyLeave({
            teacherId: user.id,
            teacherName: user.fullName,
            departmentId: user.departmentId || 'dept-cse',
            departmentName: user.departmentName || 'Computer Science & Engineering',
            leaveDate: leaveDateInput.value,
            leaveType: leaveTypeSelect.value,
            reason: reasonInput.value.trim(),
            suggestedSubstituteId: chosenSubId,
            suggestedSubstituteName: chosenSubName,
            affectedLecturesCount: currentImpactSlots.length,
            affectedLecturesSummary: impactSummary
          });

          showToast('Leave application submitted! Department HOD has been notified.', 'success');
          reasonInput.value = '';
          if (refreshTeacherHistory) await refreshTeacherHistory();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          submitLeaveBtn.disabled = false;
          submitLeaveBtn.textContent = '✉️ Submit Application for HOD Approval';
        }
      };

      plannedForm.appendChild(submitLeaveBtn);
      plannedCard.appendChild(plannedForm);
      teacherGrid.appendChild(plannedCard);

      container.appendChild(teacherGrid);

      // ------------------------------------------
      // CARD 3: MY LEAVE APPLICATIONS STATUS (TRACKING BOARD)
      // ------------------------------------------
      const historyCard = el('div', { className: 'card' });
      const tabsContainer = el('div', { id: 'leave-status-tabs', style: 'display: flex; gap: 0.4rem;' });
      const histHeader = el('div', {
        className: 'card-header',
        style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
      },
        el('div', {},
          el('h3', { className: 'card-title' }, '📋 My Leave Applications Status & History'),
          el('p', { style: 'color: var(--text-muted); font-size: 0.8rem; margin-top: 0.15rem;' },
            'Date-wise history of your applied leaves with real-time approval & substitution status.'
          )
        ),
        tabsContainer
      );
      historyCard.appendChild(histHeader);

      const histList = el('div', { id: 'teacher-leave-history', style: 'display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem;' });
      historyCard.appendChild(histList);
      container.appendChild(historyCard);

      let currentHistoryFilter = 'all'; // 'all' | 'pending' | 'approved' | 'rejected'

      const tabDefs = [
        { id: 'all', label: 'All Leaves' },
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' }
      ];

      const renderTabs = () => {
        tabsContainer.innerHTML = '';
        tabDefs.forEach(t => {
          const tabBtn = el('button', {
            className: currentHistoryFilter === t.id ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm',
            style: 'padding: 0.35rem 0.75rem; font-size: 0.775rem;'
          }, t.label);
          tabBtn.onclick = () => {
            currentHistoryFilter = t.id;
            renderTabs();
            refreshTeacherHistory();
          };
          tabsContainer.appendChild(tabBtn);
        });
      };
      renderTabs();

      var refreshTeacherHistory = async () => {
        histList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Loading leave applications...</div>';

        const allLeaves = await api.getLeaves({ teacherId: user.id });
        let filtered = [...allLeaves];
        if (currentHistoryFilter !== 'all') {
          filtered = filtered.filter(l => l.status === currentHistoryFilter);
        }

        histList.innerHTML = '';

        if (filtered.length === 0) {
          histList.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border-glass); border-radius: var(--radius-md); padding: 2rem; text-align: center;">
              <span style="font-size: 1.5rem;">📄</span>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.5rem;">No leave applications found in this category.</p>
            </div>
          `;
          return;
        }

        filtered.reverse().forEach(l => {
          let statusBadgeClass = 'badge-substitute';
          let statusText = 'PENDING HOD REVIEW';
          let statusBorderColor = 'rgba(245, 158, 11, 0.3)';

          if (l.status === 'approved') {
            statusBadgeClass = 'badge-normal';
            statusText = 'APPROVED & REPAIRED';
            statusBorderColor = 'rgba(16, 185, 129, 0.3)';
          } else if (l.status === 'rejected') {
            statusBadgeClass = 'badge-affected';
            statusText = 'REJECTED';
            statusBorderColor = 'rgba(239, 68, 68, 0.3)';
          }

          const card = el('div', {
            style: `background: #FFFFFF; border: 1.5px solid ${statusBorderColor}; border-radius: 16px; padding: 1.2rem 1.35rem; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);`
          },
            el('div', { style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;' },
              el('div', { style: 'display: flex; align-items: center; gap: 0.65rem;' },
                el('span', { style: 'font-weight: 800; color: #0F172A; font-size: 1.05rem;' }, l.leaveType),
                el('span', { className: `badge ${statusBadgeClass}` }, statusText)
              ),
              el('div', { style: 'font-family: var(--font-mono); font-size: 0.825rem; color: #0284c7; font-weight: 700; background: rgba(6, 182, 212, 0.08); padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(6, 182, 212, 0.25);' },
                `📅 ${l.leaveDate}`
              )
            ),
            el('div', { style: 'font-size: 0.85rem; color: #475569; line-height: 1.5;' },
              el('strong', { style: 'color: #0F172A; font-weight: 700;' }, 'Reason: '),
              el('span', { style: 'color: #334155; font-style: italic; background: #F8FAFC; padding: 2px 8px; border-radius: 6px; border: 1px solid #E2E8F0; display: inline-block;' }, `"${l.reason}"`)
            ),
            el('div', { style: 'display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 0.65rem 0.85rem; border-radius: 10px;' },
              el('span', { style: 'color: #475569;' },
                `Disrupted Lectures: `,
                el('strong', { style: 'color: #0284c7; font-weight: 800;' }, l.affectedLecturesCount || 0)
              ),
              l.suggestedSubstituteName ? el('span', { style: 'color: #475569;' },
                `Suggested Handover: `,
                el('strong', { style: 'color: #7C3AED; font-weight: 800;' }, l.suggestedSubstituteName)
              ) : el('span', { style: 'color: #64748B;' }, 'Assigned via Best Recommendation Engine'),
              l.approvedBy ? el('span', { style: 'color: #059669; font-weight: 700;' },
                `✓ Approved by: ${l.approvedBy}`
              ) : null,
              l.rejectionReason ? el('span', { style: 'color: #DC2626; font-weight: 700;' },
                `✗ Note: ${l.rejectionReason}`
              ) : null
            )
          );
          histList.appendChild(card);
        });
      };

      await refreshTeacherHistory();
    }

    // ==========================================
    // 3. HOD & ADMIN VIEW (APPROVALS + AUDIT)
    // ==========================================
    if (isHOD || isAdmin) {
      // ------------------------------------------
      // CARD 1: PENDING LEAVE APPROVALS BOARD
      // ------------------------------------------
      const approvalsCard = el('div', { className: 'card' });
      const counterBadge = el('span', { id: 'pending-badge-counter', className: 'badge badge-substitute' }, 'Awaiting Review');
      const appHeader = el('div', { className: 'card-header' },
        el('div', {},
          el('h3', { className: 'card-title' }, '✍️ Department Faculty Leave Applications'),
          el('p', { style: 'color: var(--text-muted); font-size: 0.825rem; margin-top: 0.2rem;' },
            'Review teacher applications, check broken slot impact, and approve with automatic timetable repair.'
          )
        ),
        counterBadge
      );
      approvalsCard.appendChild(appHeader);

      const approvalsList = el('div', { id: 'hod-leave-approvals', style: 'display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;' });
      approvalsCard.appendChild(approvalsList);
      container.appendChild(approvalsCard);

      const refreshApprovals = async () => {
        approvalsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Loading pending applications...</div>';

        const filterDept = isHOD ? user.departmentId : null;
        const allLeaves = await api.getLeaves(filterDept ? { departmentId: filterDept } : {});
        const pendingLeaves = allLeaves.filter(l => l.status === 'pending');

        counterBadge.textContent = `${pendingLeaves.length} PENDING`;

        approvalsList.innerHTML = '';

        if (pendingLeaves.length === 0) {
          approvalsList.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 2rem; text-align: center;">
              <span style="font-size: 1.75rem;">✨</span>
              <p style="font-weight: 700; color: var(--text-main); margin-top: 0.4rem; font-size: 1.05rem;">Zero Pending Faculty Leave Requests</p>
              <p style="font-size: 0.825rem; color: var(--text-muted); margin-top: 0.25rem;">All teacher leave applications in this department have been addressed.</p>
            </div>
          `;
          return;
        }

        pendingLeaves.forEach(l => {
          const item = el('div', {
            style: 'background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 1.35rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.05);'
          });

          // Top Header
          const headerRow = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.65rem;' },
            el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;' },
              el('div', { style: 'width: 38px; height: 38px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); color: #4F46E5; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0;' }, '👨‍🏫'),
              el('span', { style: 'font-weight: 800; font-size: 1.15rem; color: #0F172A; letter-spacing: -0.01em;' }, l.teacherName),
              el('span', { className: 'badge badge-primary', style: 'font-size: 0.74rem; padding: 3px 10px; font-weight: 700; border-radius: 9999px;' }, l.leaveType),
              el('span', { style: 'font-size: 0.75rem; color: #475569; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 2px 8px; border-radius: 6px; font-weight: 600;' }, l.departmentName)
            ),
            el('div', { style: 'display: flex; align-items: center; gap: 0.45rem; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.28); color: #0284c7; font-weight: 700; font-size: 0.825rem; padding: 4px 12px; border-radius: 9999px;' },
              el('span', {}, '📅 Date of Leave:'),
              el('strong', { style: 'color: #0369a1; font-weight: 800;' }, l.leaveDate)
            )
          );
          item.appendChild(headerRow);

          // Details Body with High Contrast & Rich Styling
          const impactBadge = (l.affectedLecturesCount && l.affectedLecturesCount > 0)
            ? el('div', { style: 'display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.28); color: #B91C1C; font-weight: 700; font-size: 0.8rem; padding: 5px 12px; border-radius: 8px;' },
                el('span', {}, '⚠️'),
                el('span', {}, 'Broken Lectures Impact: '),
                el('strong', { style: 'color: #991B1B;' }, `${l.affectedLecturesCount} slots`),
                l.affectedLecturesSummary ? el('span', { style: 'color: #7F1D1D;' }, `(${l.affectedLecturesSummary})`) : null
              )
            : el('div', { style: 'display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.28); color: #047857; font-weight: 700; font-size: 0.8rem; padding: 5px 12px; border-radius: 8px;' },
                el('span', { style: 'font-weight: 800;' }, '✓'),
                el('span', {}, 'Broken Lectures Impact: '),
                el('strong', { style: 'color: #065F46;' }, '0 slots (Zero Conflict / Free Day)')
              );

          const engineBadge = el('div', { style: 'display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.28); color: #6D28D9; font-weight: 700; font-size: 0.8rem; padding: 5px 12px; border-radius: 8px;' },
            el('span', {}, '⚡'),
            el('span', {}, l.suggestedSubstituteName
              ? `Teacher Requested Handover: ${l.suggestedSubstituteName}`
              : 'Autonomous Engine: #1 Best Recommended Faculty')
          );

          const detailsBox = el('div', {
            style: 'background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1rem 1.15rem; display: flex; flex-direction: column; gap: 0.75rem;'
          },
            el('div', { style: 'font-size: 0.88rem; line-height: 1.5; color: #334155;' },
              el('strong', { style: 'color: #0F172A; font-weight: 800;' }, 'Official Reason: '),
              el('span', { style: 'color: #1E293B; font-style: italic; background: #FFFFFF; padding: 3px 10px; border-radius: 6px; border: 1px solid #CBD5E1; display: inline-block; margin-left: 4px; font-weight: 600;' }, `"${l.reason}"`)
            ),
            el('div', { style: 'display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.15rem;' },
              impactBadge,
              engineBadge
            )
          );
          item.appendChild(detailsBox);

          // Rejection note field (hidden initially)
          const rejectBox = el('div', { style: 'display: none; margin-top: 0.25rem;' },
            el('input', {
              type: 'text',
              className: 'form-control',
              placeholder: 'Enter official rejection reason (e.g. Exam duty / Syllabus deficit)',
              style: 'font-size: 0.825rem; margin-bottom: 0.5rem; background: #FFFFFF; border: 1.5px solid #CBD5E1; color: #0F172A;'
            })
          );
          item.appendChild(rejectBox);

          // Action Buttons Row
          const actionsRow = el('div', { style: 'display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem;' });

          const approveBtn = el('button', {
            className: 'btn btn-cyan',
            style: 'padding: 0.65rem 1.45rem; font-size: 0.84rem; font-weight: 800; border-radius: 9999px; box-shadow: 0 4px 14px -2px rgba(6, 182, 212, 0.45);'
          }, '✓ Approve & Update Timetable');

          approveBtn.onclick = async () => {
            try {
              approveBtn.disabled = true;
              approveBtn.textContent = 'Updating Timetable & Assigning Faculty...';

              await api.approveLeave(l.id, user.fullName);
              showToast(`Leave approved for ${l.teacherName}! Timetable reallocated & both teachers notified.`, 'success');
              await refreshApprovals();
            } catch (err) {
              showToast(err.message, 'error');
              approveBtn.disabled = false;
              approveBtn.textContent = '✓ Approve & Update Timetable';
            }
          };

          const rejectBtn = el('button', {
            className: 'btn btn-secondary',
            style: 'padding: 0.65rem 1.25rem; font-size: 0.84rem; font-weight: 700; border-radius: 9999px; border: 1px solid #CBD5E1; color: #475569; background: #FFFFFF;'
          }, '✗ Reject Application');

          rejectBtn.onclick = async () => {
            if (rejectBox.style.display === 'none') {
              rejectBox.style.display = 'block';
              rejectBox.querySelector('input').focus();
              rejectBtn.textContent = 'Confirm Rejection';
              rejectBtn.className = 'btn btn-danger';
              return;
            }

            const reason = rejectBox.querySelector('input').value.trim() || 'Departmental scheduling conflict';
            try {
              rejectBtn.disabled = true;
              rejectBtn.textContent = 'Rejecting...';
              await api.rejectLeave(l.id, reason);
              showToast(`Leave rejected for ${l.teacherName}`, 'info');
              await refreshApprovals();
            } catch (err) {
              showToast(err.message, 'error');
            }
          };

          actionsRow.appendChild(rejectBtn);
          actionsRow.appendChild(approveBtn);
          item.appendChild(actionsRow);

          approvalsList.appendChild(item);
        });
      };

      await refreshApprovals();

      // ------------------------------------------
      // CARD 2: PROXY SUDDEN ABSENCE DISPATCH (HOD Reporting on Behalf)
      // ------------------------------------------
      const proxyCard = el('div', { className: 'card', style: 'border-color: rgba(239, 68, 68, 0.35);' },
        el('div', { className: 'card-header' },
          el('h3', { className: 'card-title', style: 'color: #f87171;' }, '🚨 Report Sudden Faculty Absence on Behalf'),
          el('span', { className: 'badge badge-affected' }, 'Autonomous Solver')
        ),
        el('p', { style: 'color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;' },
          'If a department faculty member calls in sick or fails to arrive, HOD can log their absence to immediately reallocate slots.'
        )
      );

      const deptTeachers = isHOD
        ? MOCK_DATABASE.users.filter(u => u.role === 'teacher' && u.departmentId === (user.departmentId || 'dept-cse'))
        : MOCK_DATABASE.users.filter(u => u.role === 'teacher');

      const proxyTeacherSelect = el('select', { className: 'form-control', style: 'margin-bottom: 0.85rem; font-size: 0.85rem;' });
      deptTeachers.forEach(t => {
        proxyTeacherSelect.appendChild(el('option', { value: t.id }, `${t.fullName} (${t.designation || 'Faculty'}) — [${t.academicId || t.id}]`));
      });

      const proxyDateInput = el('input', {
        type: 'date',
        className: 'form-control',
        value: today,
        style: 'margin-bottom: 0.85rem; font-size: 0.85rem;'
      });

      // Preview slots of chosen teacher
      const proxySlotPreview = el('div', {
        style: 'background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 0.85rem 1.1rem; margin-bottom: 0.85rem; font-size: 0.825rem;'
      });

      const updateProxySlots = async () => {
        const facId = proxyTeacherSelect.value;
        const d = proxyDateInput.value;
        const slots = await api.getTeacherScheduleForDate(facId, d);
        proxySlotPreview.innerHTML = '';
        if (slots.length === 0) {
          proxySlotPreview.innerHTML = '<span style="color: #059669; font-weight: 700;">✨ 0 teaching periods scheduled on this date.</span>';
        } else {
          proxySlotPreview.innerHTML = `<span style="color: #DC2626; font-weight: 800;">⚠️ ${slots.length} broken slot(s) will be automatically reallocated: </span>` +
            slots.map(s => `<strong style="color: #0F172A; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 2px 7px; border-radius: 6px; margin: 0 3px; font-weight: 700; display: inline-block;">P${s.period}: ${s.subjectCode}</strong>`).join(' ');
        }
      };

      proxyTeacherSelect.onchange = updateProxySlots;
      proxyDateInput.onchange = updateProxySlots;
      await updateProxySlots();

      const proxyRemarksInput = el('input', {
        type: 'text',
        className: 'form-control',
        placeholder: 'Official reason (e.g. Called in sick, Medical leave, Emergency family duty)',
        value: 'Unwell / Emergency leave reported to HOD',
        style: 'margin-bottom: 1.25rem; font-size: 0.85rem;'
      });

      const proxySubmitBtn = el('button', {
        className: 'btn btn-danger',
        style: 'width: 100%; padding: 0.85rem; font-weight: 700;'
      }, '🚨 Mark Absence & Reassign Timetable Slots');

      proxySubmitBtn.onclick = async () => {
        try {
          proxySubmitBtn.disabled = true;
          proxySubmitBtn.textContent = 'Executing Multi-Factor Repair Engine...';

          await api.markSuddenAbsence({
            faculty_id: proxyTeacherSelect.value,
            absence_date: proxyDateInput.value,
            remarks: proxyRemarksInput.value.trim() || `Absence logged by HOD ${user.fullName}`
          });

          showToast('⚡ Faculty marked absent! Timetable reallocated & both teachers notified.', 'success');
          setTimeout(() => router.navigate('/timetable'), 700);
        } catch (err) {
          showToast(err.message, 'error');
          proxySubmitBtn.disabled = false;
          proxySubmitBtn.textContent = '🚨 Mark Absence & Reassign Timetable Slots';
        }
      };

      proxyCard.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Select Absent Faculty:'), proxyTeacherSelect));
      proxyCard.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Date of Absence:'), proxyDateInput));
      proxyCard.appendChild(proxySlotPreview);
      proxyCard.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label', style: 'font-size: 0.8rem;' }, 'Official Remarks:'), proxyRemarksInput));
      proxyCard.appendChild(proxySubmitBtn);
      container.appendChild(proxyCard);
    }

    return container;
  }
};
