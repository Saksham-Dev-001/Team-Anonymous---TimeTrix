// File: /js/pages/page-hod.js
// HOD Department Operations: Faculty Attendance, Leave Approvals, Roster & Timetable Repairs

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { showToast } from '../ui/toast.js';
import { auth } from '../core/auth.js';
import { getTodayIST } from '../core/format.js';
import { router } from '../core/router.js';
import { MOCK_DATABASE } from '../core/mock-data.js';

export const pageHOD = {
  async render() {
    const user = auth.getCurrentUser() || { fullName: 'Dr. Syed Firoz Haider', role: 'hod', departmentId: 'dept-as', departmentName: 'Applied Science & Humanities Department', academicId: 'HOD-FIROZ' };
    let deptId = user.departmentId || 'dept-as';
    let deptObj = MOCK_DATABASE.departments.find(d => d.id === deptId) || MOCK_DATABASE.departments[0];
    let deptName = deptObj ? deptObj.name : (user.departmentName || 'Applied Science & Humanities Department');

    const container = el('div', { style: 'display: flex; flex-direction: column; gap: 2rem;' });

    // 1. HOD Portal Header Banner
    const banner = el('div', {
      className: 'card',
      style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.10) 0%, rgba(139, 92, 246, 0.08) 50%, #ffffff 100%); border: 1.5px solid rgba(34, 211, 238, 0.35); box-shadow: 0 16px 40px -10px rgba(34, 211, 238, 0.2), inset 0 1px 1px #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem;'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;' },
          el('span', { className: 'badge badge-substitute' }, 'DEPARTMENT HEAD CONSOLE'),
          el('span', { style: 'font-size: 0.8rem; color: var(--secondary-accent, #8B5CF6); font-family: var(--font-mono); font-weight: 700;' },
            `[${user.academicId || deptObj.hodAcademicId || 'HOD'}] ${deptObj.code}`
          ),
          el('span', { className: 'badge badge-approved' },
            deptObj.id === 'dept-as' ? 'Full 1st Year (All Branches)' : '2nd - 4th Year'
          )
        ),
        el('h2', { style: 'font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main); margin: 0.2rem 0;' },
          `${deptName}`
        ),
        el('p', { style: 'color: var(--text-muted); font-size: 0.875rem; margin: 0; max-width: 780px;' },
          `Welcome, ${user.fullName}. Academic Scope: ${deptObj.academicScope || 'B.Tech Program'}.`
        )
      ),
      el('div', { style: 'display: flex; gap: 0.75rem; flex-wrap: wrap;' },
        el('button', {
          className: 'btn btn-primary',
          onClick: () => router.navigate('/repair')
        }, '⚡ Review Repair Proposals'),
        el('button', {
          className: 'btn btn-secondary',
          onClick: () => router.navigate('/timetable')
        }, '📅 Master Timetable')
      )
    );
    container.appendChild(banner);

    // 2. Main Two-Column Layout: Left = Attendance & Leaves, Right = Onboard Faculty & Quick Stats
    const mainGrid = el('div', {
      style: 'display: grid; grid-template-columns: 1.35fr 0.65fr; gap: 1.5rem; align-items: start;'
    });

    const leftCol = el('div', { style: 'display: flex; flex-direction: column; gap: 1.5rem;' });
    const rightCol = el('div', { style: 'display: flex; flex-direction: column; gap: 1.5rem;' });

    // 2a. Faculty Daily Attendance Board (The Main Requirement!)
    const attendanceCard = el('div', { className: 'card' },
      el('div', { className: 'card-header' },
        el('h3', { className: 'card-title' }, '📋 Daily Faculty Attendance Register'),
        el('span', { className: 'badge badge-normal' }, `Date: ${getTodayIST()}`)
      ),
      el('p', { style: 'color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;' },
        'Mark teacher attendance for today. When any teacher is marked "Absent" or "On Leave", the Autonomous Repair Engine immediately recalculates broken slots.'
      ),
      el('div', { id: 'hod-attendance-list', style: 'display: flex; flex-direction: column; gap: 0.85rem;' })
    );
    leftCol.appendChild(attendanceCard);

    // Refresh Faculty Attendance Register
    const refreshAttendanceList = async () => {
      const listContainer = attendanceCard.querySelector('#hod-attendance-list');
      listContainer.innerHTML = '';

      const teachers = await api.getTeachersByDepartment(deptId);

      teachers.forEach(t => {
        const isAbsent = t.attendanceStatus === 'absent';
        const isOnLeave = t.attendanceStatus === 'on_leave';
        const isPresent = !isAbsent && !isOnLeave;

        let statusClass = 'badge-normal';
        let statusLabel = 'PRESENT TODAY';
        if (isAbsent) {
          statusClass = 'badge-affected';
          statusLabel = 'ABSENT TODAY';
        } else if (isOnLeave) {
          statusClass = 'badge-substitute';
          statusLabel = 'ON APPROVED LEAVE';
        }

        const row = el('div', {
          style: `background: rgba(255, 255, 255, 0.02); border: 1px solid ${isAbsent ? 'rgba(239, 68, 68, 0.4)' : isOnLeave ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-glass)'}; border-radius: var(--radius-md); padding: 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem; transition: all 180ms ease;`
        },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
              el('span', { style: 'color: var(--text-muted); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px;' }, `[${t.academicId || t.id}]`),
              el('strong', { style: 'font-size: 1.05rem; color: var(--text-main);' }, t.fullName),
              el('span', { className: `badge ${statusClass}` }, statusLabel)
            ),
            el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin-top: 0.25rem;' },
              `${t.designation} | Past 30D Substitutions Taken: ${t.substitutions30d || 0}`
            )
          ),
          el('div', { style: 'display: flex; gap: 0.4rem; flex-wrap: wrap;' },
            el('button', {
              className: `btn ${isPresent ? 'btn-approved' : 'btn-secondary'} btn-sm`,
              onClick: async () => {
                t.attendanceStatus = 'present';
                showToast(`Marked ${t.fullName} as Present.`, 'success');
                refreshAttendanceList();
              }
            }, '✓ Present'),
            el('button', {
              className: `btn ${isAbsent ? 'btn-danger' : 'btn-secondary'} btn-sm`,
              onClick: async () => {
                await api.setTeacherAttendance(t.id, 'absent', getTodayIST());
                showToast(`Marked ${t.fullName} as Absent! AI Repair solver triggered.`, 'warning');
                refreshAttendanceList();
                setTimeout(() => router.navigate('/repair'), 600);
              }
            }, '🚨 Absent (Trigger Repair)'),
            el('button', {
              className: `btn ${isOnLeave ? 'btn-primary' : 'btn-secondary'} btn-sm`,
              onClick: async () => {
                await api.setTeacherAttendance(t.id, 'on_leave', getTodayIST());
                showToast(`Marked ${t.fullName} On-Leave! Repair cases generated.`, 'info');
                refreshAttendanceList();
                setTimeout(() => router.navigate('/repair'), 600);
              }
            }, '🗓️ On-Leave')
          )
        );
        listContainer.appendChild(row);
      });
    };

    // 2b. Pending Department Leave Applications
    const leavesCard = el('div', { className: 'card' },
      el('div', { className: 'card-header' },
        el('h3', { className: 'card-title' }, '✍️ Department Leave Applications'),
        el('span', { className: 'badge badge-substitute' }, 'HOD Approval')
      ),
      el('p', { style: 'color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;' },
        'Review leave applications submitted by teachers in this department. Approving triggers timetable repair automatically.'
      ),
      el('div', { id: 'hod-leaves-board', style: 'display: flex; flex-direction: column; gap: 0.85rem;' })
    );
    leftCol.appendChild(leavesCard);

    const refreshLeavesBoard = async () => {
      const leavesContainer = leavesCard.querySelector('#hod-leaves-board');
      leavesContainer.innerHTML = '';

      const allLeaves = await api.getLeaves({ departmentId: deptId });
      const pending = allLeaves.filter(l => l.status === 'pending');

      if (pending.length === 0) {
        leavesContainer.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
            <p style="font-weight: 600; color: var(--text-main); margin: 0;">✨ No Pending Leave Applications</p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">All department leave requests are up-to-date.</p>
          </div>
        `;
        return;
      }

      pending.forEach(l => {
        const item = el('div', {
          style: 'background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass-active); border-radius: var(--radius-md); padding: 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem;'
        },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
              el('strong', { style: 'font-size: 1.05rem; color: var(--text-main);' }, l.teacherName),
              el('span', { className: 'badge badge-substitute' }, l.leaveType),
              el('span', { style: 'font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);' }, `📅 ${l.leaveDate}`)
            ),
            el('p', { style: 'font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem;' },
              `Reason: "${l.reason}"`
            )
          ),
          el('div', { style: 'display: flex; gap: 0.5rem;' },
            el('button', {
              className: 'btn btn-primary btn-sm',
              onClick: async () => {
                await api.approveLeave(l.id, user.fullName);
                showToast(`Approved leave for ${l.teacherName}! Repair solver started.`, 'success');
                refreshLeavesBoard();
                refreshAttendanceList();
                setTimeout(() => router.navigate('/repair'), 600);
              }
            }, '✓ Approve & Repair'),
            el('button', {
              className: 'btn btn-secondary btn-sm',
              onClick: async () => {
                await api.rejectLeave(l.id, 'Department scheduling clash');
                showToast(`Leave rejected for ${l.teacherName}`, 'info');
                refreshLeavesBoard();
              }
            }, '✗ Reject')
          )
        );
        leavesContainer.appendChild(item);
      });
    };

    // 2c. Right Column: Department Real-Time Faculty Attendance & Coverage Metrics
    const statusMetricsCard = el('div', { className: 'card', style: 'padding: 1.35rem;' });
    
    const refreshStatusMetrics = async () => {
      statusMetricsCard.innerHTML = '';
      const teachers = await api.getTeachersByDepartment(deptId);
      const totalTeachers = teachers.length;
      const presentCount = teachers.filter(t => t.attendanceStatus !== 'absent' && t.attendanceStatus !== 'on_leave').length;
      const absentCount = teachers.filter(t => t.attendanceStatus === 'absent').length;
      const leaveCount = teachers.filter(t => t.attendanceStatus === 'on_leave').length;

      statusMetricsCard.appendChild(
        el('div', { style: 'margin-bottom: 1rem;' },
          el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
            el('h4', { style: 'font-size: 1rem; font-weight: 800; color: var(--text-main); margin: 0;' }, '📊 Faculty Presence Today'),
            el('span', { className: 'badge badge-approved' }, 'OPERATIONAL')
          ),
          el('p', { style: 'font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0 0;' },
            `Real-time status for ${deptName}`
          )
        )
      );

      const metricsGrid = el('div', {
        style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;'
      },
        el('div', { style: 'background: var(--bg-subtle, #f8fafc); padding: 0.75rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0); text-align: center;' },
          el('div', { style: 'font-size: 1.35rem; font-weight: 800; color: #059669;' }, String(presentCount)),
          el('div', { style: 'font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;' }, 'Present Today')
        ),
        el('div', { style: 'background: var(--bg-subtle, #f8fafc); padding: 0.75rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0); text-align: center;' },
          el('div', { style: `font-size: 1.35rem; font-weight: 800; color: ${absentCount > 0 ? '#DC2626' : '#64748b'};` }, String(absentCount + leaveCount)),
          el('div', { style: 'font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;' }, 'Absent / On Leave')
        )
      );
      statusMetricsCard.appendChild(metricsGrid);

      statusMetricsCard.appendChild(
        el('div', { style: 'font-size: 0.775rem; color: var(--text-muted); line-height: 1.4; background: rgba(34, 211, 238, 0.06); padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid rgba(34, 211, 238, 0.2);' },
          'ℹ️ Faculty profile creation, credentials & cross-department onboarding are centrally managed by College System Admin.'
        )
      );
    };

    rightCol.appendChild(statusMetricsCard);

    // 2d. Right Column: Department Timetable Coverage & Active Substitutions
    const activeCoverageCard = el('div', { className: 'card', style: 'padding: 1.35rem;' });

    const refreshActiveCoverage = async () => {
      activeCoverageCard.innerHTML = '';
      const today = getTodayIST();
      const overrides = MOCK_DATABASE.sessionOverrides.filter(o => o.sessionDate === today);

      activeCoverageCard.appendChild(
        el('div', { style: 'margin-bottom: 0.85rem;' },
          el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
            el('h4', { style: 'font-size: 1rem; font-weight: 800; color: var(--text-main); margin: 0;' }, '⚡ Today\'s Substitution Status'),
            el('span', { className: 'badge badge-substitute' }, `${overrides.length} Active`)
          ),
          el('p', { style: 'font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0 0;' },
            'Live lecture coverages assigned in the timetable'
          )
        )
      );

      if (overrides.length === 0) {
        activeCoverageCard.appendChild(
          el('div', { style: 'text-align: center; padding: 1.5rem 0.5rem; color: var(--text-muted);' },
            el('span', { style: 'font-size: 1.5rem;' }, '✨'),
            el('div', { style: 'font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem;' }, 'All Regular Lectures On Track'),
            el('div', { style: 'font-size: 0.775rem;' }, 'Zero substitute covers needed today.')
          )
        );
      } else {
        const list = el('div', { style: 'display: flex; flex-direction: column; gap: 0.65rem;' });
        overrides.forEach(ov => {
          const item = el('div', {
            style: 'background: rgba(34, 211, 238, 0.05); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 10px; padding: 0.75rem 0.9rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;'
          },
            el('div', {},
              el('div', { style: 'font-size: 0.85rem; font-weight: 800; color: var(--text-main);' },
                `P${ov.period || 1} • ${ov.subjectCode || 'Class'}`
              ),
              el('div', { style: 'font-size: 0.75rem; color: #0891B2; font-weight: 600;' },
                `👤 Sub: ${ov.substituteFacultyName || 'Assigned Faculty'}`
              )
            ),
            el('button', {
              className: 'btn btn-secondary btn-sm',
              style: 'font-size: 0.72rem; padding: 0.25rem 0.6rem; border-radius: 9999px;',
              onClick: () => router.navigate('/timetable')
            }, 'View Timetable')
          );
          list.appendChild(item);
        });
        activeCoverageCard.appendChild(list);
      }
    };

    rightCol.appendChild(activeCoverageCard);

    mainGrid.appendChild(leftCol);
    mainGrid.appendChild(rightCol);
    container.appendChild(mainGrid);

    await refreshAttendanceList();
    await refreshLeavesBoard();
    await refreshStatusMetrics();
    await refreshActiveCoverage();

    return container;
  }
};
