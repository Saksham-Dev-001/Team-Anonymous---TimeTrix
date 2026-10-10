// File: /js/pages/page-substitutions.js
// Academic Reports, Substitution History, Absence Registry & Admin System Audit Trail
// Clean, systematic institutional logs for Admin Office & HODs with intuitive filters

import { el } from '../core/dom.js';
import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { showToast } from '../ui/toast.js';
import { getTodayIST } from '../core/format.js';
import { openManualReassignModal } from '../ui/manual-reassign-modal.js';
import { MOCK_DATABASE } from '../core/mock-data.js';

export const pageSubstitutions = {
  async render() {
    const currentUser = auth.getCurrentUser() || { fullName: 'Faculty Member', role: 'teacher', id: 'f-1' };
    const isHOD = currentUser.role === 'hod' || currentUser.role === 'super_admin';
    const isAdmin = currentUser.role === 'super_admin';

    const container = el('div', { style: 'display: flex; flex-direction: column; gap: 1.75rem; max-width: 1080px; margin: 0 auto;' });

    // Default tab: Admin Office lands on Audit Trail, teachers/HODs on Substitutions
    let activeTab = isAdmin ? 'audit' : 'substitutions'; 
    let selectedDateFilter = ''; // '' for all dates or YYYY-MM-DD
    let selectedTypeFilter = ''; // '' for all types or 'auto_repair' | 'manual_override' | 'absence_logged' | 'case_deleted'
    let searchQuery = '';

    // 1. Top Header Banner
    const banner = el('div', {
      className: 'card',
      style: 'background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.08) 50%, #ffffff 100%); border-top: 3px solid #22D3EE; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-radius: 18px;'
    },
      el('div', {},
        el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;' },
          el('span', { className: 'badge badge-approved' }, 'AUDIT REGISTRY'),
          el('span', { style: 'font-size: 0.8rem; color: #0891B2; font-family: var(--font-mono); font-weight: 700;' }, 'SYSTEMATIC LOGS'),
          isAdmin ? el('span', { className: 'badge badge-substitute', style: 'font-size: 0.7rem;' }, 'ADMIN OFFICE PRIVILEGE') : null
        ),
        el('h2', { style: 'font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main); margin: 0;' },
          isAdmin ? 'Institutional Audit Logs & Substitution Records' : 'Academic Substitution & Absence History Log'
        ),
        el('p', { style: 'color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;' },
          'Official record of all teacher absences, autonomous substitutions, HOD overrides, and case deletions with complete actor accountability.'
        )
      )
    );
    container.appendChild(banner);

    // 2. Control Bar: Navigation Tabs
    const controlsCard = el('div', {
      className: 'card',
      style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: 1.15rem 1.35rem;'
    });

    const tabsContainer = el('div', {
      style: 'display: flex; gap: 0.5rem; background: var(--bg-subtle, #f1f5f9); padding: 0.3rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0); flex-wrap: wrap;'
    });

    const tabConfigs = [
      { id: 'audit', label: '🛡️ Admin System Audit Trail', privilegeOnly: true },
      { id: 'substitutions', label: '🔄 Substitution History' },
      { id: 'absences', label: '📋 Absence & Leave Log' },
      { id: 'inbox', label: '📥 Duty Inbox' }
    ];

    // Filter available tabs based on role
    const visibleTabs = tabConfigs.filter(t => !t.privilegeOnly || isHOD);

    const tabButtons = [];
    visibleTabs.forEach(t => {
      const btn = el('button', {
        type: 'button',
        className: `btn btn-sm ${t.id === activeTab ? 'btn-primary' : 'btn-secondary'}`,
        style: 'font-weight: 700; font-size: 0.8rem;'
      }, t.label);

      btn.onclick = () => {
        tabButtons.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        activeTab = t.id;
        renderTabContent();
      };

      tabButtons.push(btn);
      tabsContainer.appendChild(btn);
    });

    // Date Filter Controls on the top bar
    const dateInput = el('input', {
      type: 'date',
      className: 'form-control',
      style: 'width: auto; min-width: 150px; font-weight: 600; font-size: 0.85rem;'
    });

    dateInput.onchange = () => {
      selectedDateFilter = dateInput.value;
      renderTabContent();
    };

    const todayBtn = el('button', {
      className: 'btn btn-secondary btn-sm',
      style: 'font-size: 0.775rem; font-weight: 700;',
      onClick: () => {
        const today = getTodayIST();
        dateInput.value = today;
        selectedDateFilter = today;
        renderTabContent();
      }
    }, 'Today');

    const clearDateBtn = el('button', {
      className: 'btn btn-secondary btn-sm',
      style: 'font-size: 0.775rem;',
      onClick: () => {
        dateInput.value = '';
        selectedDateFilter = '';
        renderTabContent();
      }
    }, 'All Dates');

    const topFilterControls = el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;' },
      el('span', { style: 'font-size: 0.8rem; font-weight: 700; color: var(--text-muted);' }, 'Date:'),
      dateInput,
      todayBtn,
      clearDateBtn
    );

    controlsCard.appendChild(tabsContainer);
    controlsCard.appendChild(topFilterControls);
    container.appendChild(controlsCard);

    // 3. Content View Area
    const viewContainer = el('div', { id: 'reports-view-container' });
    container.appendChild(viewContainer);

    const renderTabContent = async () => {
      viewContainer.innerHTML = '';

      // ==========================================
      // TAB: SYSTEM AUDIT TRAIL (ADMIN OFFICE & HOD)
      // ==========================================
      if (activeTab === 'audit') {
        const auditCard = el('div', { className: 'card', style: 'padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;' });

        // Fetch logs with current filter
        const logs = await api.getAuditLogs({
          date: selectedDateFilter,
          type: selectedTypeFilter,
          searchQuery: searchQuery
        });

        // Compute metrics for quick insight counters
        const allLogs = await api.getAuditLogs({});
        const autoCount = allLogs.filter(l => l.type === 'auto_repair').length;
        const manualCount = allLogs.filter(l => l.type === 'manual_override').length;
        const absenceCount = allLogs.filter(l => l.type === 'absence_logged').length;
        const deleteCount = allLogs.filter(l => l.type === 'case_deleted').length;

        // KPI Counters Strip
        const metricsStrip = el('div', {
          style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;'
        },
          el('div', {
            style: 'background: #ffffff; border: 1px solid #e2e8f0; border-top: 3.5px solid #06b6d4; border-radius: 14px; padding: 1.15rem 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;'
          },
            el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
              el('span', { style: 'font-size: 0.75rem; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.03em;' }, '⚡ Auto-Repairs'),
              el('span', { style: 'font-size: 0.72rem; background: #e0f2fe; color: #0284c7; padding: 2px 7px; border-radius: 9999px; font-weight: 700;' }, 'AI Engine')
            ),
            el('div', { style: 'font-size: 2.1rem; font-weight: 800; color: #0f172a; font-family: var(--font-mono, monospace); margin: 0.4rem 0 0.15rem 0; line-height: 1;' }, `${autoCount}`),
            el('div', { style: 'font-size: 0.75rem; color: #64748b; font-weight: 500;' }, 'Autonomous algorithm slots')
          ),
          el('div', {
            style: 'background: #ffffff; border: 1px solid #e2e8f0; border-top: 3.5px solid #8b5cf6; border-radius: 14px; padding: 1.15rem 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;'
          },
            el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
              el('span', { style: 'font-size: 0.75rem; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.03em;' }, '✏️ HOD Overrides'),
              el('span', { style: 'font-size: 0.72rem; background: #ede9fe; color: #6d28d9; padding: 2px 7px; border-radius: 9999px; font-weight: 700;' }, 'Manual')
            ),
            el('div', { style: 'font-size: 2.1rem; font-weight: 800; color: #0f172a; font-family: var(--font-mono, monospace); margin: 0.4rem 0 0.15rem 0; line-height: 1;' }, `${manualCount}`),
            el('div', { style: 'font-size: 0.75rem; color: #64748b; font-weight: 500;' }, 'Manual faculty reassignments')
          ),
          el('div', {
            style: 'background: #ffffff; border: 1px solid #e2e8f0; border-top: 3.5px solid #ef4444; border-radius: 14px; padding: 1.15rem 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;'
          },
            el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
              el('span', { style: 'font-size: 0.75rem; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.03em;' }, '🚨 Absences Recorded'),
              el('span', { style: 'font-size: 0.72rem; background: #fee2e2; color: #b91c1c; padding: 2px 7px; border-radius: 9999px; font-weight: 700;' }, 'Leaves')
            ),
            el('div', { style: 'font-size: 2.1rem; font-weight: 800; color: #0f172a; font-family: var(--font-mono, monospace); margin: 0.4rem 0 0.15rem 0; line-height: 1;' }, `${absenceCount}`),
            el('div', { style: 'font-size: 0.75rem; color: #64748b; font-weight: 500;' }, 'Emergency leaves & sick calls')
          ),
          el('div', {
            style: 'background: #ffffff; border: 1px solid #e2e8f0; border-top: 3.5px solid #f59e0b; border-radius: 14px; padding: 1.15rem 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;'
          },
            el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
              el('span', { style: 'font-size: 0.75rem; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.03em;' }, '🗑️ Cases Cleared'),
              el('span', { style: 'font-size: 0.72rem; background: #fef3c7; color: #b45309; padding: 2px 7px; border-radius: 9999px; font-weight: 700;' }, 'Reverted')
            ),
            el('div', { style: 'font-size: 2.1rem; font-weight: 800; color: #0f172a; font-family: var(--font-mono, monospace); margin: 0.4rem 0 0.15rem 0; line-height: 1;' }, `${deleteCount}`),
            el('div', { style: 'font-size: 0.75rem; color: #64748b; font-weight: 500;' }, 'Dismissals by HOD / Admin')
          )
        );
        auditCard.appendChild(metricsStrip);

        // Header Title + Concise Filter Controls
        const filterBar = el('div', {
          style: 'background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 0.95rem 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);'
        });

        // Search Input
        const searchInput = el('input', {
          type: 'text',
          className: 'form-control',
          placeholder: '🔍 Search faculty, subject, or admin...',
          value: searchQuery,
          style: 'min-width: 260px; flex: 1; font-size: 0.85rem; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 0.55rem 0.95rem; font-weight: 500; color: #0f172a;'
        });

        searchInput.oninput = () => {
          searchQuery = searchInput.value;
          renderTabContent();
        };

        // Action Type Dropdown Filter
        const typeSelect = el('select', {
          className: 'form-control',
          style: 'width: auto; font-size: 0.85rem; font-weight: 600; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 0.55rem 0.95rem; color: #0f172a; cursor: pointer;'
        },
          el('option', { value: '' }, 'All Action Types'),
          el('option', { value: 'auto_repair' }, '⚡ Auto-Repairs'),
          el('option', { value: 'manual_override' }, '✏️ HOD Overrides'),
          el('option', { value: 'absence_logged' }, '🚨 Faculty Absences'),
          el('option', { value: 'case_deleted' }, '🗑️ Deletions & Reverts')
        );

        typeSelect.value = selectedTypeFilter;
        typeSelect.onchange = () => {
          selectedTypeFilter = typeSelect.value;
          renderTabContent();
        };

        const resetBtn = el('button', {
          className: 'btn btn-secondary btn-sm',
          style: 'font-size: 0.8rem; font-weight: 600; border-radius: 10px; padding: 0.55rem 1rem; background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; cursor: pointer; transition: all 0.15s ease;',
          onClick: () => {
            selectedDateFilter = '';
            selectedTypeFilter = '';
            searchQuery = '';
            dateInput.value = '';
            renderTabContent();
          }
        }, 'Reset Filters');

        const filterActions = el('div', { style: 'display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;' },
          typeSelect,
          resetBtn
        );

        filterBar.appendChild(searchInput);
        filterBar.appendChild(filterActions);
        auditCard.appendChild(filterBar);

        // Section Title & Result Count
        const headerRow = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.25rem 0.2rem 0 0.2rem;' },
          el('div', {},
            el('h3', { className: 'card-title', style: 'margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;' }, '🛡️ System Audit Trail & Accountability Log'),
            el('p', { style: 'font-size: 0.825rem; color: #64748b; margin: 0.2rem 0 0 0; font-weight: 500;' },
              selectedDateFilter ? `Showing records for ${selectedDateFilter}` : 'Showing all historical actions chronologically'
            )
          ),
          el('span', {
            style: 'background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; font-weight: 700; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem;'
          },
            `${logs.length} Event${logs.length === 1 ? '' : 's'} Logged`
          )
        );
        auditCard.appendChild(headerRow);

        // Log Entries List
        if (logs.length === 0) {
          auditCard.appendChild(el('div', {
            style: 'text-align: center; padding: 3.5rem 1rem; color: #64748b; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 14px;'
          },
            el('div', { style: 'font-size: 2.4rem; margin-bottom: 0.5rem;' }, '🔍'),
            el('h4', { style: 'color: #0f172a; font-weight: 800; font-size: 1.05rem; margin-bottom: 0.35rem;' }, 'No Matching Audit Logs Found'),
            el('p', { style: 'font-size: 0.85rem; max-width: 420px; margin: 0 auto; color: #64748b; line-height: 1.5;' },
              'No events match your current filter criteria. Try resetting the filters to view the full audit history.'
            )
          ));
        } else {
          const list = el('div', { style: 'display: flex; flex-direction: column; gap: 0.95rem;' });

          logs.forEach(log => {
            // Style badge, left border and theme according to action type
            let badgeStyle = 'background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;';
            let badgeText = '⚡ AUTO-REPAIRED';
            let leftBorderColor = '#06b6d4';

            if (log.type === 'manual_override') {
              badgeStyle = 'background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe;';
              badgeText = '✏️ HOD OVERRIDE';
              leftBorderColor = '#8b5cf6';
            } else if (log.type === 'absence_logged') {
              badgeStyle = 'background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;';
              badgeText = '🚨 ABSENCE RECORD';
              leftBorderColor = '#ef4444';
            } else if (log.type === 'case_deleted') {
              badgeStyle = 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;';
              badgeText = '🗑️ CASE DELETED / REVERTED';
              leftBorderColor = '#f59e0b';
            }

            // Strip redundant leading emojis from title since badge already displays category icon
            const rawTitle = log.title || 'Audit Event';
            const cleanTitle = rawTitle.replace(/^[⚡🛡️📋🔄📝✅❌🗑️✏️🚨\s]+/u, '').trim() || rawTitle;

            // Format date & time nicely
            const dateObj = new Date(log.timestamp);
            const timeStr = isNaN(dateObj.getTime())
              ? 'Logged'
              : dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = log.targetDate || (isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0]);

            const row = el('div', {
              style: `background: #ffffff; border: 1.5px solid #e2e8f0; border-left: 4.5px solid ${leftBorderColor}; border-radius: 12px; padding: 1.15rem 1.35rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: transform 0.15s ease, box-shadow 0.15s ease;`
            },
              el('div', { style: 'display: flex; align-items: flex-start; gap: 1.15rem; flex: 1; min-width: 280px;' },
                // Timestamp Pillar
                el('div', {
                  style: 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 95px; background: #f8fafc; padding: 0.6rem 0.75rem; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center;'
                },
                  el('span', { style: 'font-size: 0.8rem; font-weight: 800; color: #0891b2; font-family: var(--font-mono, monospace);' }, timeStr),
                  el('span', { style: 'font-size: 0.7rem; color: #64748b; font-family: var(--font-mono, monospace); font-weight: 600; margin-top: 0.2rem;' }, dateStr)
                ),
                // Central Description
                el('div', { style: 'flex: 1;' },
                  el('div', { style: 'display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.35rem;' },
                    el('span', { style: `font-size: 0.7rem; font-weight: 800; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.02em; ${badgeStyle}` }, badgeText),
                    el('strong', { style: 'font-size: 1rem; color: #0f172a; font-weight: 800;' }, cleanTitle)
                  ),
                  el('p', { style: 'font-size: 0.875rem; color: #334155; margin: 0.35rem 0 0.65rem 0; line-height: 1.5; font-weight: 450;' },
                    log.description
                  ),
                  // Meta Info Footer Chips
                  el('div', { style: 'display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;' },
                    el('span', {
                      style: 'background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; color: #475569; display: inline-flex; align-items: center; gap: 0.3rem;'
                    },
                      el('strong', { style: 'color: #0f172a;' }, '👤 Actor:'),
                      el('span', { style: 'color: #0891b2; font-weight: 700;' }, log.performedBy || 'System Engine')
                    ),
                    log.departmentName ? el('span', {
                      style: 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; color: #475569; display: inline-flex; align-items: center; gap: 0.3rem;'
                    },
                      el('strong', { style: 'color: #0f172a;' }, '🏛️ Dept:'),
                      el('span', { style: 'font-weight: 600;' }, log.departmentName)
                    ) : null,
                    log.targetDate ? el('span', {
                      style: 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; color: #475569; display: inline-flex; align-items: center; gap: 0.3rem;'
                    },
                      el('strong', { style: 'color: #0f172a;' }, '📅 Target:'),
                      el('span', { style: 'font-family: var(--font-mono, monospace); font-weight: 600; color: #0f172a;' }, log.targetDate)
                    ) : null
                  )
                )
              )
            );

            list.appendChild(row);
          });

          auditCard.appendChild(list);
        }

        viewContainer.appendChild(auditCard);
      }

      // ==========================================
      // TAB: DATE-WISE SUBSTITUTION HISTORY
      // ==========================================
      else if (activeTab === 'substitutions') {
        const historyCard = el('div', { className: 'card', style: 'padding: 1.5rem;' });

        const historyItems = await api.getSubstitutionHistory({
          date: selectedDateFilter,
          facultyId: isHOD ? null : currentUser.id
        });

        historyCard.appendChild(
          el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;' },
            el('div', {},
              el('h3', { className: 'card-title', style: 'margin: 0;' }, 'Date-Wise Substitution & Repair Log'),
              el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0 0;' },
                selectedDateFilter ? `Showing records for ${selectedDateFilter}` : 'Showing all historical timetable repairs'
              )
            ),
            el('span', { className: 'badge badge-normal', style: 'font-weight: 700;' },
              `${historyItems.length} Total Record(s)`
            )
          )
        );

        if (historyItems.length === 0) {
          historyCard.appendChild(el('div', {
            style: 'text-align: center; padding: 2.5rem; color: var(--text-muted);'
          },
            el('div', { style: 'font-size: 2rem; margin-bottom: 0.5rem;' }, '✨'),
            el('h4', { style: 'color: var(--text-main); font-weight: 700;' }, 'No Substitution Records Found'),
            el('p', { style: 'font-size: 0.825rem;' }, 'When faculty absences trigger auto-repairs or manual overrides, history logs will be stored here.')
          ));
        } else {
          const list = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });

          historyItems.forEach(item => {
            const isManual = item.isManualOverride;

            const row = el('div', {
              style: 'background: #ffffff; border: 1.5px solid var(--border-color); border-radius: 12px; padding: 1.15rem 1.35rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;'
            },
              el('div', { style: 'display: flex; align-items: center; gap: 1.25rem;' },
                // Left Date & Period Badge
                el('div', { style: 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 90px; background: var(--bg-subtle, #f8fafc); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-glass, #e2e8f0);' },
                  el('span', { style: 'font-size: 1.1rem; font-weight: 800; color: #0891b2; font-family: var(--font-mono);' }, `P${item.period}`),
                  el('span', { style: 'font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); font-weight: 600;' }, item.date)
                ),
                // Center Details
                el('div', {},
                  el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;' },
                    el('span', { className: `badge ${isManual ? 'badge-substitute' : 'badge-approved'}`, style: 'font-size: 0.68rem; font-weight: 800;' },
                      isManual ? '✏️ HOD OVERRIDE' : '⚡ AUTO-REPAIRED'
                    ),
                    el('strong', { style: 'font-size: 1.05rem; color: var(--text-main);' }, `${item.subjectCode} — ${item.subjectName}`),
                    el('span', { style: 'font-size: 0.775rem; color: var(--text-muted);' }, `(${item.batchName || 'B.Tech I Year'})`)
                  ),
                  el('div', { style: 'font-size: 0.825rem; color: var(--text-muted); display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;' },
                    el('span', { style: 'color: #DC2626; font-weight: 600;' }, `⚠️ Absent: ${item.originalFacultyName}`),
                    el('span', { style: 'color: #059669; font-weight: 700;' }, `👤 Substitute: ${item.substituteFacultyName}`),
                    el('span', {}, `📍 Room: ${item.roomCode}`)
                  ),
                  el('div', { style: 'font-size: 0.775rem; color: #64748b; margin-top: 0.35rem; font-style: italic;' },
                    `Log Note: ${item.reason}`
                  )
                )
              ),
              // Right Action
              isHOD ? el('button', {
                className: 'btn btn-secondary btn-sm',
                style: 'border-radius: 9999px; font-weight: 700; font-size: 0.775rem;',
                onClick: () => {
                  openManualReassignModal({
                    entryId: item.entryId,
                    date: item.date,
                    onSaved: () => renderTabContent()
                  });
                }
              }, '✏️ Edit / Reassign') : null
            );

            list.appendChild(row);
          });

          historyCard.appendChild(list);
        }

        viewContainer.appendChild(historyCard);
      }

      // ==========================================
      // TAB: FACULTY ABSENCE & LEAVE AUDIT LOG
      // ==========================================
      else if (activeTab === 'absences') {
        const absenceCard = el('div', { className: 'card', style: 'padding: 1.5rem;' });

        const absences = await api.getAbsenceHistory({
          date: selectedDateFilter,
          facultyId: isHOD ? null : currentUser.id
        });

        absenceCard.appendChild(
          el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;' },
            el('div', {},
              el('h3', { className: 'card-title', style: 'margin: 0;' }, 'Historical Faculty Absence & Leave Registry'),
              el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0 0;' },
                'Timestamped records of all emergency absences and approved teacher leaves.'
              )
            ),
            el('span', { className: 'badge badge-affected', style: 'font-weight: 700;' },
              `${absences.length} Total Absence(s)`
            )
          )
        );

        if (absences.length === 0) {
          absenceCard.appendChild(el('div', {
            style: 'text-align: center; padding: 2.5rem; color: var(--text-muted);'
          },
            el('div', { style: 'font-size: 2rem; margin-bottom: 0.5rem;' }, '✨'),
            el('h4', { style: 'color: var(--text-main); font-weight: 700;' }, 'Zero Absences Logged'),
            el('p', { style: 'font-size: 0.825rem;' }, 'No faculty absence records match this date filter.')
          ));
        } else {
          const list = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });

          absences.forEach(abs => {
            const row = el('div', {
              style: 'background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1.15rem 1.35rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;'
            },
              el('div', {},
                el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;' },
                  el('span', { className: 'badge badge-affected', style: 'font-size: 0.68rem; font-weight: 800;' }, 'RECORDED ABSENCE'),
                  el('strong', { style: 'font-size: 1.05rem; color: var(--text-main);' }, abs.facultyName),
                  el('span', { style: 'font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);' }, `📅 ${abs.absenceDate}`)
                ),
                el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin-top: 0.35rem;' },
                  `Remarks: "${abs.remarks || 'Emergency sudden absence self-reported'}" | Dept: ${abs.departmentName}`
                )
              ),
              el('span', { className: 'badge badge-approved' }, 'RESOLVED BY REPAIR SOLVER')
            );

            list.appendChild(row);
          });

          absenceCard.appendChild(list);
        }

        viewContainer.appendChild(absenceCard);
      }

      // ==========================================
      // TAB: SUBSTITUTION REQUESTS / DUTY INBOX
      // ==========================================
      else if (activeTab === 'inbox') {
        const inboxCard = el('div', { className: 'card', style: 'padding: 1.5rem;' });

        const requests = await api.getSubstitutionRequests(isHOD ? null : currentUser.id);

        inboxCard.appendChild(
          el('div', { style: 'margin-bottom: 1.25rem;' },
            el('h3', { className: 'card-title', style: 'margin: 0;' }, '📥 Faculty Replacement Duties Inbox'),
            el('p', { style: 'font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0 0;' },
              'Current active substitution assignments and classroom coverage alerts.'
            )
          )
        );

        if (!requests || requests.length === 0) {
          inboxCard.appendChild(el('div', {
            style: 'text-align: center; padding: 2.5rem; color: var(--text-muted);'
          },
            el('div', { style: 'font-size: 2rem; margin-bottom: 0.5rem;' }, '📫'),
            el('h4', { style: 'color: var(--text-main); font-weight: 700;' }, 'No Pending Substitution Requests'),
            el('p', { style: 'font-size: 0.825rem;' }, 'All lecture coverages have been confirmed and processed.')
          ));
        } else {
          const list = el('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' });

          requests.forEach(req => {
            const row = el('div', {
              style: 'background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1.15rem 1.35rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;'
            },
              el('div', {},
                el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' },
                  el('span', { className: 'badge badge-substitute' }, `PERIOD ${req.period}`),
                  el('strong', { style: 'font-size: 1rem; color: var(--text-main);' }, `Assigned to: ${req.substituteFacultyName}`),
                  el('span', { style: 'font-size: 0.775rem; color: var(--text-muted); font-family: var(--font-mono);' }, `📅 ${req.sessionDate}`)
                ),
                el('p', { style: 'font-size: 0.825rem; color: #0891b2; margin-top: 0.35rem; font-weight: 600;' },
                  'Status: Active Timetable Coverage'
                )
              ),
              el('span', { className: 'badge badge-approved' }, 'CONFIRMED')
            );
            list.appendChild(row);
          });

          inboxCard.appendChild(list);
        }

        viewContainer.appendChild(inboxCard);
      }
    };

    renderTabContent();
    return container;
  }
};
