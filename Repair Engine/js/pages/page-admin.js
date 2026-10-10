// File: /js/pages/page-admin.js
// Admin Office Portal: College-Wide Authority, HOD Management, Faculty CRUD & Leave Overrides

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal } from '../ui/modal.js';
import { router } from '../core/router.js';
import { getTodayIST } from '../core/format.js';
import { MOCK_DATABASE } from '../core/mock-data.js';

export const pageAdmin = {
  async render() {
    const container = el('div', { style: 'display: flex; flex-direction: column; gap: 2rem;' });

    // 1. Super Admin Header Banner
    const banner = el('div', {
      className: 'card',
      style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.08) 50%, #ffffff 100%); border: 1.5px solid #E2E8F0; border-top: 3px solid #06B6D4; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; border-radius: 20px; box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.05);'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;' },
          el('span', { className: 'badge badge-normal', style: 'font-size: 0.72rem; padding: 3px 9px; font-weight: 700; border-radius: 9999px;' }, 'CENTRAL ACADEMIC AUTHORITY'),
          el('span', { style: 'font-size: 0.75rem; color: #7C3AED; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); padding: 2px 8px; border-radius: 6px; font-family: var(--font-mono); font-weight: 700;' }, 'ADM-2026 • PRINCIPAL / DEAN')
        ),
        el('h2', { style: 'font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: #0F172A; margin: 0;' },
          'College Central Administration Office'
        ),
        el('p', { style: 'color: #64748B; font-size: 0.875rem; margin-top: 0.35rem; font-weight: 500;' },
          'Executive oversight across all 5 B.Tech engineering departments, faculty rosters, and timetable operations.'
        )
      ),
      el('div', { style: 'display: flex; gap: 0.65rem; flex-wrap: wrap;' },
        el('button', {
          className: 'btn btn-primary',
          style: 'border-radius: 9999px; font-weight: 800; font-size: 0.84rem; padding: 0.55rem 1.25rem;',
          onClick: () => router.navigate('/repair')
        }, '⚡ Global Repair Console'),
        el('button', {
          className: 'btn btn-cyan',
          style: 'border-radius: 9999px; font-weight: 800; font-size: 0.84rem; padding: 0.55rem 1.25rem; box-shadow: 0 4px 14px -2px rgba(6, 182, 212, 0.45);',
          onClick: () => router.navigate('/timetable')
        }, '📅 Master Timetable')
      )
    );
    container.appendChild(banner);

    // 2. Department & HOD Directory (5 B.Tech Departments)
    const dirCard = el('div', { className: 'card', style: 'background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 20px; box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.05);' },
      el('div', { className: 'card-header', style: 'margin-bottom: 1rem;' },
        el('div', {},
          el('h3', { className: 'card-title', style: 'font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0;' }, '🏛️ Academic Departments & HOD Directory'),
          el('p', { style: 'color: #64748B; font-size: 0.825rem; margin-top: 0.25rem; font-weight: 500;' },
            'Administration of undergraduate B.Tech engineering branches and appointed department heads.'
          )
        ),
        el('div', { style: 'display: flex; gap: 0.65rem; align-items: center;' },
          el('span', { className: 'badge badge-normal', style: 'font-size: 0.75rem; padding: 4px 10px; font-weight: 700; border-radius: 9999px;' }, `${MOCK_DATABASE.departments.length} Departments Active`),
          el('button', {
            className: 'btn btn-secondary btn-sm',
            style: 'border-radius: 9999px; font-weight: 700; font-size: 0.8rem; padding: 0.45rem 1rem; border: 1px solid #CBD5E1; background: #FFFFFF;',
            onClick: () => openAddDepartmentModal()
          }, '➕ Add Dept')
        )
      ),
      el('div', { id: 'hod-cards-container', style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.25rem; margin-top: 0.75rem;' })
    );
    container.appendChild(dirCard);

    // Helper: Refresh HOD Directory Cards
    const refreshDirectory = () => {
      const grid = dirCard.querySelector('#hod-cards-container');
      grid.innerHTML = '';

      MOCK_DATABASE.departments.forEach(dept => {
        const hod = MOCK_DATABASE.users.find(u => u.id === dept.hodId || u.academicId === dept.hodAcademicId) || {
          fullName: dept.hodName || 'Pending Appointment',
          email: dept.email || 'N/A',
          academicId: dept.hodAcademicId || 'UNASSIGNED',
          designation: 'Head of Department'
        };

        const deptTeachers = MOCK_DATABASE.users.filter(u => u.role === 'teacher' && u.departmentId === dept.id);
        const isFirstYearAS = dept.id === 'dept-as';

        const card = el('div', {
          style: `background: #FFFFFF; border: 1.5px solid ${isFirstYearAS ? 'rgba(6, 182, 212, 0.45)' : '#E2E8F0'}; border-radius: 18px; padding: 1.35rem 1.45rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04); transition: transform 180ms ease, box-shadow 180ms ease;`
        },
          el('div', {},
            // Top Row: Code Pill + Year Scope Badge
            el('div', { style: 'display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;' },
              el('span', { style: 'font-weight: 800; font-size: 0.78rem; color: #0284c7; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.28); padding: 3px 9px; border-radius: 6px; font-family: var(--font-mono);' }, dept.code),
              el('span', { className: `badge ${isFirstYearAS ? 'badge-substitute' : 'badge-normal'}`, style: 'font-size: 0.72rem; padding: 3px 9px; font-weight: 700; border-radius: 9999px;' },
                isFirstYearAS ? '1st Year (All Branches)' : '2nd – 4th Year'
              )
            ),
            // Department Title
            el('h4', { style: 'font-size: 1.15rem; font-weight: 800; color: #0F172A; letter-spacing: -0.015em; margin: 0.4rem 0 0.85rem 0; line-height: 1.3;' },
              dept.name.replace(/\s*Department$/i, '')
            ),
            // HOD Profile Box (Clean & Readable)
            el('div', { style: 'background: #F8FAFC; padding: 0.85rem 1rem; border-radius: 14px; border: 1px solid #E2E8F0; margin-bottom: 0.85rem;' },
              el('div', { style: 'display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;' },
                el('div', { style: 'display: flex; align-items: center; gap: 0.6rem;' },
                  el('div', { style: 'width: 34px; height: 34px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 800; flex-shrink: 0;' }, '👨‍💼'),
                  el('div', {},
                    el('div', { style: 'font-size: 0.68rem; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.04em;' }, 'Department Head'),
                    el('div', { style: 'font-weight: 800; color: #0F172A; font-size: 0.95rem; line-height: 1.2;' }, hod.fullName)
                  )
                ),
                el('span', { style: 'font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; color: #7C3AED; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); padding: 2px 7px; border-radius: 6px;' },
                  hod.academicId || 'HOD'
                )
              ),
              el('div', { style: 'font-size: 0.78rem; color: #64748B; margin-top: 0.45rem; display: flex; align-items: center; gap: 0.35rem; font-weight: 500;' },
                el('span', {}, '📧'),
                el('span', {}, hod.email || dept.email || 'N/A')
              )
            ),
            // Clean Stat Chips Row (Replacing long cluttered sentence)
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;' },
              el('span', { style: `display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; font-weight: 700; color: ${deptTeachers.length > 0 ? '#047857' : '#64748B'}; background: ${deptTeachers.length > 0 ? 'rgba(16, 185, 129, 0.08)' : '#F1F5F9'}; border: 1px solid ${deptTeachers.length > 0 ? 'rgba(16, 185, 129, 0.25)' : '#E2E8F0'}; padding: 3px 10px; border-radius: 9999px;` },
                el('span', {}, '👥'),
                el('span', {}, `${deptTeachers.length} Active Faculty`)
              ),
              el('span', { style: 'display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; font-weight: 700; color: #0369A1; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); padding: 3px 10px; border-radius: 9999px;' },
                el('span', {}, '🎓'),
                el('span', {}, isFirstYearAS ? '1st Year Core' : 'Higher B.Tech')
              )
            )
          ),
          // Action Buttons
          el('div', { style: 'display: flex; gap: 0.5rem; border-top: 1px solid #F1F5F9; padding-top: 0.85rem; margin-top: 0.25rem;' },
            el('button', {
              className: 'btn btn-secondary btn-sm',
              style: 'flex: 1; font-weight: 700; border-radius: 9999px; border: 1px solid #CBD5E1; background: #FFFFFF; font-size: 0.8rem; padding: 0.45rem 0.85rem;',
              onClick: () => openEditHodModal(dept, hod)
            }, '✏️ Edit HOD'),
            el('button', {
              className: 'btn btn-cyan btn-sm',
              style: 'font-weight: 800; border-radius: 9999px; font-size: 0.8rem; padding: 0.45rem 1.15rem; box-shadow: 0 4px 12px -2px rgba(6, 182, 212, 0.4);',
              title: `Impersonate & login as ${hod.fullName}`,
              onClick: () => {
                auth.switchUser(hod.id);
                showToast(`Switched to ${hod.fullName} (${dept.code}) portal`, 'info');
                router.navigate('/hod');
              }
            }, '👤 Enter Portal')
          )
        );

        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 10px 25px -4px rgba(15, 23, 42, 0.08)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = '0 4px 16px -2px rgba(15, 23, 42, 0.04)';
        });

        grid.appendChild(card);
      });
    };

    // Modal: Edit HOD & Department Information
    const openEditHodModal = (dept, hod) => {
      const content = el('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' });

      const nameInput = el('input', { type: 'text', className: 'form-control', value: hod.fullName || dept.hodName || '' });
      const idInput = el('input', { type: 'text', className: 'form-control', value: hod.academicId || dept.hodAcademicId || '' });
      const emailInput = el('input', { type: 'text', className: 'form-control', value: hod.email || dept.email || '' });
      const deptNameInput = el('input', { type: 'text', className: 'form-control', value: dept.name || '' });
      const scopeInput = el('textarea', { className: 'form-control', rows: 2, value: dept.academicScope || '' });
      const desigInput = el('input', { type: 'text', className: 'form-control', value: hod.designation || 'HOD & Professor' });

      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'HOD Full Name:'), nameInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'HOD Academic Login ID (e.g. HOD-ASH, HOD-CSE):'), idInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'HOD Email / Login:'), emailInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Department Title:'), deptNameInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Department Academic Scope:'), scopeInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Designation & Title:'), desigInput));

      const cancelBtn = el('button', { className: 'btn btn-secondary', onClick: closeModal }, 'Cancel');
      const saveBtn = el('button', {
        className: 'btn btn-primary',
        onClick: async () => {
          const newName = nameInput.value.trim();
          const newId = idInput.value.trim().toUpperCase();
          const newEmail = emailInput.value.trim();
          const newDeptName = deptNameInput.value.trim();
          const newScope = scopeInput.value.trim();
          const newDesig = desigInput.value.trim();

          if (!newName || !newId) {
            showToast('HOD Name and Academic ID are required!', 'warning');
            return;
          }

          try {
            await api.updateHOD(hod.id, {
              fullName: newName,
              academicId: newId,
              email: newEmail,
              designation: newDesig,
              departmentName: newDeptName,
              departmentScope: newScope
            });

            await api.updateDepartment(dept.id, {
              name: newDeptName,
              academicScope: newScope,
              hodName: newName,
              hodAcademicId: newId,
              email: newEmail
            });

            showToast(`Updated HOD & department credentials for ${newName}!`, 'success');
            closeModal();
            refreshDirectory();
            refreshGlobalAttendance();
          } catch (err) {
            showToast(err.message, 'danger');
          }
        }
      }, '💾 Save Changes');

      openModal(`✏️ Edit HOD & Department: ${dept.code}`, content, [cancelBtn, saveBtn]);
    };

    // Modal: Add New Department
    const openAddDepartmentModal = () => {
      const content = el('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' });
      const codeInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. IT (2nd-4th Yr)' });
      const nameInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. Information Technology Department' });
      const scopeInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. 2nd, 3rd & 4th Year B.Tech' });

      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Department Code:'), codeInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Department Full Name:'), nameInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Academic Scope:'), scopeInput));

      const cancelBtn = el('button', { className: 'btn btn-secondary', onClick: closeModal }, 'Cancel');
      const saveBtn = el('button', {
        className: 'btn btn-primary',
        onClick: async () => {
          const code = codeInput.value.trim();
          const name = nameInput.value.trim();
          const scope = scopeInput.value.trim();
          if (!code || !name) {
            showToast('Code and Name are required.', 'warning');
            return;
          }
          await api.createDepartment(code, name, scope);
          showToast(`Department ${code} created successfully!`, 'success');
          closeModal();
          refreshDirectory();
        }
      }, 'Create Department');

      openModal('➕ Create New Academic Department', content, [cancelBtn, saveBtn]);
    };

    // 3. College-Wide Faculty Register & Attendance Management
    let selectedDeptFilter = 'all';

    const globalAttendanceCard = el('div', { className: 'card', style: 'background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 20px; box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.05);' },
      el('div', { className: 'card-header' },
        el('div', {},
          el('h3', { className: 'card-title', style: 'font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0;' }, '🌐 Faculty Roster & Live Attendance Register'),
          el('p', { style: 'color: #64748B; font-size: 0.825rem; margin-top: 0.25rem; font-weight: 500;' },
            'Institutional faculty profiles, departmental designations, and real-time attendance management.'
          )
        ),
        el('div', { style: 'display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;' },
          el('span', { className: 'badge badge-normal', style: 'font-size: 0.75rem; padding: 3px 10px; font-weight: 700; border-radius: 9999px;' }, `Date: ${getTodayIST()}`),
          el('button', {
            className: 'btn btn-primary btn-sm',
            style: 'border-radius: 9999px; font-weight: 700; font-size: 0.8rem; padding: 0.45rem 1rem;',
            onClick: () => openAddFacultyModal()
          }, '➕ Add New Faculty')
        )
      ),
      el('div', { style: 'display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;' },
        el('label', { style: 'font-size: 0.85rem; font-weight: 700; color: #0F172A;' }, 'Filter by Department:'),
        (() => {
          const sel = el('select', { className: 'form-control', style: 'width: auto; min-width: 260px; font-weight: 600; border-radius: 10px; border: 1.5px solid #CBD5E1;' },
            el('option', { value: 'all' }, '🏛️ All Departments (All Faculty)')
          );
          MOCK_DATABASE.departments.forEach(d => {
            sel.appendChild(el('option', { value: d.id }, `${d.name} (${d.code})`));
          });
          sel.onchange = () => {
            selectedDeptFilter = sel.value;
            refreshGlobalAttendance();
          };
          return sel;
        })()
      ),
      el('div', { id: 'admin-attendance-container', style: 'display: flex; flex-direction: column; gap: 0.85rem;' })
    );
    container.appendChild(globalAttendanceCard);

    // Refresh Faculty Register
    const refreshGlobalAttendance = async () => {
      const listContainer = globalAttendanceCard.querySelector('#admin-attendance-container');
      listContainer.innerHTML = '';

      let allTeachers = MOCK_DATABASE.users.filter(u => u.role === 'teacher');
      if (selectedDeptFilter !== 'all') {
        allTeachers = allTeachers.filter(u => u.departmentId === selectedDeptFilter);
      }

      if (allTeachers.length === 0) {
        listContainer.innerHTML = `
          <div style="background: #F8FAFC; border: 1.5px dashed #E2E8F0; border-radius: 16px; padding: 2rem; text-align: center;">
            <p style="font-weight: 700; color: #64748B; margin: 0; font-size: 0.9rem;">No faculty members found in this department.</p>
          </div>
        `;
        return;
      }

      allTeachers.forEach(t => {
        const isAbsent = t.attendanceStatus === 'absent';
        const isOnLeave = t.attendanceStatus === 'on_leave';
        const isPresent = !isAbsent && !isOnLeave;

        let statusClass = 'badge-normal';
        let statusLabel = 'PRESENT';
        if (isAbsent) {
          statusClass = 'badge-affected';
          statusLabel = 'ABSENT';
        } else if (isOnLeave) {
          statusClass = 'badge-substitute';
          statusLabel = 'ON LEAVE';
        }

        const deptObj = MOCK_DATABASE.departments.find(d => d.id === t.departmentId) || { code: 'ASH (1st Year)' };

        const row = el('div', {
          style: `background: #FFFFFF; border: 1.5px solid ${isAbsent ? 'rgba(239, 68, 68, 0.45)' : isOnLeave ? 'rgba(245, 158, 11, 0.45)' : '#E2E8F0'}; border-radius: 16px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);`
        },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap;' },
              el('span', { style: 'color: #7C3AED; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 800; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); padding: 2px 7px; border-radius: 6px;' },
                `[${t.academicId || t.id}]`
              ),
              el('strong', { style: 'font-size: 1.05rem; font-weight: 800; color: #0F172A;' }, t.fullName),
              el('span', { className: `badge ${statusClass}`, style: 'font-size: 0.72rem; padding: 2px 9px; font-weight: 700; border-radius: 9999px;' }, statusLabel),
              el('span', { style: 'font-size: 0.74rem; font-weight: 700; color: #0284c7; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.28); padding: 2px 8px; border-radius: 6px; font-family: var(--font-mono);' },
                deptObj.code
              )
            ),
            el('div', { style: 'font-size: 0.8rem; color: #475569; margin-top: 0.35rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;' },
              el('span', { style: 'font-weight: 600;' }, `${t.roleTitle || t.designation || 'Faculty'} • ${t.departmentName || 'Engineering'}`),
              el('span', { style: 'background: #F1F5F9; border: 1px solid #E2E8F0; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; color: #475569;' },
                `Max Load: ${t.maxDaily || 5}/day, ${t.maxWeekly || 20}/wk`
              )
            )
          ),
          el('div', { style: 'display: flex; gap: 0.45rem; align-items: center; flex-wrap: wrap;' },
            el('button', {
              className: 'btn btn-secondary btn-sm',
              style: 'border-radius: 9999px; font-weight: 700; font-size: 0.78rem; padding: 0.38rem 0.85rem; border: 1px solid #CBD5E1; background: #FFFFFF;',
              onClick: () => openEditFacultyModal(t)
            }, '✏️ Edit'),
            el('button', {
              className: `btn ${isPresent ? 'btn-cyan' : 'btn-secondary'} btn-sm`,
              style: 'border-radius: 9999px; font-weight: 700; font-size: 0.78rem; padding: 0.38rem 0.95rem;',
              onClick: async () => {
                t.attendanceStatus = 'present';
                showToast(`Marked ${t.fullName} Present.`, 'success');
                refreshGlobalAttendance();
              }
            }, '✓ Present'),
            el('button', {
              className: `btn ${isAbsent ? 'btn-danger' : 'btn-secondary'} btn-sm`,
              style: 'border-radius: 9999px; font-weight: 700; font-size: 0.78rem; padding: 0.38rem 0.95rem;',
              onClick: async () => {
                await api.setTeacherAttendance(t.id, 'absent', getTodayIST());
                showToast(`Marked ${t.fullName} Absent! Repair engine initiated.`, 'warning');
                refreshGlobalAttendance();
                setTimeout(() => router.navigate('/repair'), 600);
              }
            }, '🚨 Absent & Repair'),
            el('button', {
              className: `btn ${isOnLeave ? 'btn-primary' : 'btn-secondary'} btn-sm`,
              style: 'border-radius: 9999px; font-weight: 700; font-size: 0.78rem; padding: 0.38rem 0.95rem;',
              onClick: async () => {
                await api.setTeacherAttendance(t.id, 'on_leave', getTodayIST());
                showToast(`Marked ${t.fullName} On Leave!`, 'info');
                refreshGlobalAttendance();
                setTimeout(() => router.navigate('/repair'), 600);
              }
            }, '🗓️ On-Leave')
          )
        );
        listContainer.appendChild(row);
      });
    };

    // Modal: Edit Faculty Record
    const openEditFacultyModal = (faculty) => {
      const content = el('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' });

      const nameInput = el('input', { type: 'text', className: 'form-control', value: faculty.fullName });
      const idInput = el('input', { type: 'text', className: 'form-control', value: faculty.academicId || '' });
      const emailInput = el('input', { type: 'text', className: 'form-control', value: faculty.email || '' });
      const roleTitleInput = el('input', { type: 'text', className: 'form-control', value: faculty.roleTitle || '' });
      const desigInput = el('input', { type: 'text', className: 'form-control', value: faculty.designation || 'Assistant Professor' });

      const deptSelect = el('select', { className: 'form-control' });
      MOCK_DATABASE.departments.forEach(d => {
        const opt = el('option', { value: d.id }, `${d.name} (${d.code})`);
        if (d.id === faculty.departmentId) opt.selected = true;
        deptSelect.appendChild(opt);
      });

      const maxDailyInput = el('input', { type: 'number', className: 'form-control', value: faculty.maxDaily || 5, min: 1, max: 8 });
      const maxWeeklyInput = el('input', { type: 'number', className: 'form-control', value: faculty.maxWeekly || 20, min: 1, max: 40 });

      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Faculty Full Name:'), nameInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Academic ID (e.g. FAC-102):'), idInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Email / Login:'), emailInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Department Assignment:'), deptSelect));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Subject / Role Title:'), roleTitleInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Designation:'), desigInput));

      const loadRow = el('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;' },
        el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Max Daily Classes:'), maxDailyInput),
        el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Max Weekly Classes:'), maxWeeklyInput)
      );
      content.appendChild(loadRow);

      const cancelBtn = el('button', { className: 'btn btn-secondary', onClick: closeModal }, 'Cancel');
      const deleteBtn = el('button', {
        className: 'btn btn-danger',
        onClick: async () => {
          if (confirm(`Are you sure you want to remove ${faculty.fullName}?`)) {
            await api.deleteFaculty(faculty.id);
            showToast(`Removed faculty ${faculty.fullName}`, 'info');
            closeModal();
            refreshGlobalAttendance();
          }
        }
      }, '🗑️ Remove');

      const saveBtn = el('button', {
        className: 'btn btn-primary',
        onClick: async () => {
          const name = nameInput.value.trim();
          const acId = idInput.value.trim().toUpperCase();
          if (!name || !acId) {
            showToast('Name and Academic ID are required!', 'warning');
            return;
          }

          await api.updateFaculty(faculty.id, {
            fullName: name,
            academicId: acId,
            email: emailInput.value.trim(),
            departmentId: deptSelect.value,
            roleTitle: roleTitleInput.value.trim(),
            designation: desigInput.value.trim(),
            maxDaily: maxDailyInput.value,
            maxWeekly: maxWeeklyInput.value
          });

          showToast(`Updated faculty details for ${name}!`, 'success');
          closeModal();
          refreshGlobalAttendance();
        }
      }, '💾 Save Changes');

      openModal(`✏️ Edit Faculty: ${faculty.fullName}`, content, [deleteBtn, cancelBtn, saveBtn]);
    };

    // Modal: Add New Faculty
    const openAddFacultyModal = () => {
      const content = el('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' });

      const nameInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. Dr. Rajesh Sharma' });
      const idInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. FAC-115' });
      const emailInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. rajesh.sharma@sribalaji.edu' });

      const deptSelect = el('select', { className: 'form-control' });
      MOCK_DATABASE.departments.forEach(d => {
        deptSelect.appendChild(el('option', { value: d.id }, `${d.name} (${d.code})`));
      });

      const roleTitleInput = el('input', { type: 'text', className: 'form-control', placeholder: 'e.g. Faculty — Engineering Physics' });
      const desigInput = el('input', { type: 'text', className: 'form-control', value: 'Assistant Professor' });
      const maxDailyInput = el('input', { type: 'number', className: 'form-control', value: 5, min: 1, max: 8 });
      const maxWeeklyInput = el('input', { type: 'number', className: 'form-control', value: 20, min: 1, max: 40 });

      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Faculty Full Name:'), nameInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Academic ID:'), idInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Official Email:'), emailInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Department:'), deptSelect));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Subject / Role:'), roleTitleInput));
      content.appendChild(el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Designation:'), desigInput));

      const loadRow = el('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;' },
        el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Max Daily Classes:'), maxDailyInput),
        el('div', { className: 'form-group' }, el('label', { className: 'form-label' }, 'Max Weekly Classes:'), maxWeeklyInput)
      );
      content.appendChild(loadRow);

      const cancelBtn = el('button', { className: 'btn btn-secondary', onClick: closeModal }, 'Cancel');
      const saveBtn = el('button', {
        className: 'btn btn-primary',
        onClick: async () => {
          const name = nameInput.value.trim();
          if (!name) {
            showToast('Full name is required!', 'warning');
            return;
          }

          const created = await api.addFaculty({
            fullName: name,
            academicId: idInput.value.trim(),
            email: emailInput.value.trim() || `${name.toLowerCase().replace(/[^a-z]/g, '.')}@sribalaji.edu`,
            departmentId: deptSelect.value,
            roleTitle: roleTitleInput.value.trim(),
            designation: desigInput.value.trim(),
            maxDaily: maxDailyInput.value,
            maxWeekly: maxWeeklyInput.value
          });

          showToast(`Faculty ${created.fullName} added successfully!`, 'success');
          closeModal();
          refreshGlobalAttendance();
          refreshDirectory();
        }
      }, 'Add Faculty');

      openModal('➕ Onboard New Faculty Member', content, [cancelBtn, saveBtn]);
    };

    // 4. College-Wide Leave Approvals (Admin Authority)
    const adminLeavesCard = el('div', { className: 'card' },
      el('div', { className: 'card-header' },
        el('h3', { className: 'card-title' }, '✍️ College-Wide Faculty Leave Approvals'),
        el('span', { className: 'badge badge-substitute' }, 'Executive Authority')
      ),
      el('div', { id: 'admin-leaves-list', style: 'display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem;' })
    );
    container.appendChild(adminLeavesCard);

    const refreshAdminLeaves = async () => {
      const leavesList = adminLeavesCard.querySelector('#admin-leaves-list');
      leavesList.innerHTML = '';

      const allLeaves = await api.getLeaves();
      const pendingLeaves = allLeaves.filter(l => l.status === 'pending');

      if (pendingLeaves.length === 0) {
        leavesList.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
            <p style="font-weight: 600; color: var(--text-main); margin: 0;">✨ All Faculty Leaves Processed</p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Zero pending leave applications college-wide.</p>
          </div>
        `;
        return;
      }

      pendingLeaves.forEach(l => {
        const item = el('div', {
          style: 'background: #ffffff; border: 1px solid var(--border-glass-active); border-radius: var(--radius-md); padding: 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem; box-shadow: var(--shadow-sm);'
        },
          el('div', {},
            el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
              el('strong', { style: 'font-size: 1.05rem; color: var(--text-main);' }, l.teacherName),
              el('span', { className: 'badge badge-substitute' }, l.leaveType),
              el('span', { style: 'font-size: 0.8rem; color: var(--accent-cyan); font-family: var(--font-mono);' }, `📅 ${l.leaveDate}`)
            ),
            el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin-top: 0.25rem;' },
              `Reason: "${l.reason}" | ${l.departmentName}`
            )
          ),
          el('div', { style: 'display: flex; gap: 0.5rem;' },
            el('button', {
              className: 'btn btn-primary btn-sm',
              onClick: async () => {
                await api.approveLeave(l.id, 'Dean of Academic Affairs');
                showToast(`Executive approval granted for ${l.teacherName}! Repair solver started.`, 'success');
                refreshAdminLeaves();
                refreshGlobalAttendance();
                setTimeout(() => router.navigate('/repair'), 600);
              }
            }, '✓ Approve & Trigger Repair'),
            el('button', {
              className: 'btn btn-secondary btn-sm',
              onClick: async () => {
                await api.rejectLeave(l.id, 'Executive administrative disapproval');
                showToast(`Leave rejected for ${l.teacherName}`, 'info');
                refreshAdminLeaves();
              }
            }, '✗ Reject')
          )
        );
        leavesList.appendChild(item);
      });
    };

    refreshDirectory();
    await refreshGlobalAttendance();
    await refreshAdminLeaves();

    return container;
  }
};
