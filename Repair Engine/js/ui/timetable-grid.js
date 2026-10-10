// File: /js/ui/timetable-grid.js
// Futuristic Timetable Grid Visualizer Component with Modern Cards & Highlighting

import { el } from '../core/dom.js';

export function renderTimetableGrid(sessions, onSessionClick, targetDate = null) {
  const container = el('div', { className: 'timetable-container' });

  // Compute current day of week (1 = Monday ... 6 = Saturday)
  const refDate = targetDate ? new Date(targetDate) : new Date();
  const currentWeekday = refDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  // Header Title & Rich Legend Bar
  const header = el('div', { className: 'timetable-header' },
    el('div', {},
      el('div', { style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;' },
        el('span', { className: 'badge badge-approved', style: 'font-size: 0.7rem;' }, 'MASTER MATRIX'),
        el('span', { style: 'font-size: 0.75rem; color: #0891B2; font-family: var(--font-mono); font-weight: 700;' }, 'MON – SAT • 6 PERIODS')
      ),
      el('h3', { className: 'card-title', style: 'margin: 0; font-size: 1.35rem; font-weight: 800;' }, 'Weekly Academic Schedule (IST)')
    ),
    el('div', { className: 'timetable-legend' },
      el('div', { className: 'timetable-legend-item' },
        el('span', { className: 'timetable-legend-dot', style: 'background: #10B981;' }),
        el('span', {}, 'Regular Class')
      ),
      el('div', { className: 'timetable-legend-item' },
        el('span', { className: 'timetable-legend-dot', style: 'background: #8B5CF6;' }),
        el('span', {}, '⚡ Substitute')
      ),
      el('div', { className: 'timetable-legend-item' },
        el('span', { className: 'timetable-legend-dot', style: 'background: #EF4444;' }),
        el('span', {}, '⚠️ Broken/Absent')
      ),
      el('div', { className: 'timetable-legend-item' },
        el('span', { className: 'timetable-legend-dot', style: 'background: #06B6D4;' }),
        el('span', {}, '📖 Self-Study')
      ),
      el('div', { className: 'timetable-legend-item' },
        el('span', { className: 'timetable-legend-dot', style: 'background: #94A3B8;' }),
        el('span', {}, '☕ Free Slot')
      )
    )
  );
  container.appendChild(header);

  // Grid Structure
  const grid = el('div', { className: 'timetable-grid' });

  // Top header row: Blank corner + Mon - Sat
  grid.appendChild(el('div', { className: 'timetable-cell-header', style: 'background: #f1f5f9;' },
    el('span', { style: 'font-weight: 800; font-size: 0.85rem; color: #64748b;' }, 'PERIOD'),
    el('span', { style: 'font-size: 0.65rem; color: #94a3b8; font-family: var(--font-mono);' }, 'BELL TIMES')
  ));

  const days = [
    { name: 'Monday', index: 1 },
    { name: 'Tuesday', index: 2 },
    { name: 'Wednesday', index: 3 },
    { name: 'Thursday', index: 4 },
    { name: 'Friday', index: 5 },
    { name: 'Saturday', index: 6 }
  ];

  days.forEach(day => {
    const isToday = currentWeekday === day.index;
    const headerCell = el('div', {
      className: `timetable-cell-header ${isToday ? 'current-day-col' : ''}`
    },
      el('span', { style: 'font-size: 0.885rem;' }, day.name.toUpperCase()),
      isToday ? el('span', {
        className: 'badge badge-cyan',
        style: 'font-size: 0.62rem; padding: 1px 6px; font-weight: 800; margin-top: 0.15rem;'
      }, '● TODAY') : el('span', {
        style: 'font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);'
      }, `DAY ${day.index}`)
    );
    grid.appendChild(headerCell);
  });

  // Exact College Periods 1 to 6 (9:35am - 3:25pm)
  const slotTimes = [
    '',
    '9:35 - 10:30',
    '10:30 - 11:25',
    '11:25 - 12:20',
    '12:20 - 1:10',
    '1:45 - 2:35',
    '2:35 - 3:25'
  ];

  for (let p = 1; p <= 6; p++) {
    // Period number cell on left column
    grid.appendChild(el('div', { className: 'timetable-cell period-header' },
      el('strong', {}, `P${p}`),
      el('span', { className: 'period-time-badge' }, slotTimes[p])
    ));

    // Day slots (Monday to Saturday)
    for (let d = 1; d <= 6; d++) {
      const match = sessions.find(s => s.weekday === d && s.start_period === p);

      if (match) {
        let stateClass = 'session-normal';
        let badgeLabel = 'Regular';

        if (match.is_sub_duty) {
          stateClass = 'session-substitute';
          badgeLabel = '⚡ Sub Duty';
        } else if (match.override_kind === 'affected' || match.override_status === 'broken') {
          stateClass = 'session-affected';
          badgeLabel = '⚠️ Absent';
        } else if (match.override_kind === 'substitute' || match.is_modified) {
          stateClass = 'session-substitute';
          badgeLabel = '⚡ Substitute';
        } else if (match.override_kind === 'self_study') {
          stateClass = 'session-selfstudy';
          badgeLabel = '📖 Self-Study';
        }

        const cell = el('div', {
          className: `timetable-cell ${stateClass}`,
          onClick: () => onSessionClick && onSessionClick(match)
        },
          // Card Header: Subject Code & Status Badge
          el('div', { className: 'session-card-header' },
            el('span', { className: 'session-code-tag' }, match.subject_code),
            el('span', { className: 'session-status-badge' }, badgeLabel)
          ),

          // Card Body: Subject Full Name
          el('div', { className: 'session-subject-title', title: match.subject_name }, match.subject_name || 'Academic Lecture'),

          // Card Faculty & Coverage
          el('div', { className: 'session-faculty-info' },
            el('div', { className: 'session-faculty-name', title: match.faculty_name },
              el('span', { style: 'font-size: 0.85rem;' }, '👤'),
              el('span', {}, match.is_sub_duty
                ? (match.faculty_name || 'You (Substitute)')
                : (match.faculty_name || 'Unassigned')
              )
            ),
            (match.is_sub_duty || match.override_kind === 'substitute') && match.original_faculty_name ? el('div', {
              className: 'session-sub-detail',
              title: `Covering for ${match.original_faculty_name}`
            }, `for ${match.original_faculty_name}`) : null
          ),

          // Card Footer: Room Code & Batch
          el('div', { className: 'session-card-footer' },
            el('span', { className: 'session-room-tag' }, `📍 ${match.room_code || 'TBA'}`),
            el('span', { className: 'session-batch-tag' },
              match.batch_name ? match.batch_name.split('(')[0].trim() : 'Sec A'
            )
          )
        );

        grid.appendChild(cell);
      } else {
        // Free Period Slot
        const freeCell = el('div', { className: 'timetable-cell session-free' },
          el('span', { style: 'font-size: 1.1rem; opacity: 0.7;' }, '☕'),
          el('span', { style: 'font-size: 0.75rem; color: #64748b; font-weight: 700; margin-top: 0.25rem;' }, 'Free Slot')
        );
        grid.appendChild(freeCell);
      }
    }
  }

  container.appendChild(grid);
  return container;
}
