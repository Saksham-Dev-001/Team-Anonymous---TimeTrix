// File: /js/core/api.js
// Production-Ready Unified API Service with Role & Attendance Logic

import { getSupabase } from './supabase.js';
import { MOCK_DATABASE } from './mock-data.js';
import { calculateBestSubstitutes } from './smart-repair-engine.js';

// Hydrate saved edits from localStorage if available
try {
  const savedUsers = localStorage.getItem('relief_custom_users');
  if (savedUsers) {
    const parsed = JSON.parse(savedUsers);
    if (Array.isArray(parsed) && parsed.length > 0) {
      MOCK_DATABASE.users = parsed.filter(u => 
        u.role !== 'student' && 
        !['f-civil-1', 'f-civil-2', 'f-mech-1', 'f-mech-2', 'f-ee-1', 'f-ee-2', 'f-cse-1', 'f-cse-2'].includes(u.id)
      );
    }
  }
  const savedDepts = localStorage.getItem('relief_custom_departments');
  if (savedDepts) {
    const parsed = JSON.parse(savedDepts);
    if (Array.isArray(parsed) && parsed.length > 0) {
      MOCK_DATABASE.departments = parsed;
    }
  }

  // Ensure Applied Science HOD details are synchronized to Dr. Syed Firoz Haider
  const ashDept = MOCK_DATABASE.departments.find(d => d.id === 'dept-as');
  if (ashDept) {
    ashDept.hodName = 'Dr. Syed Firoz Haider';
    ashDept.hodAcademicId = 'HOD-FIROZ';
    ashDept.email = 'hod.firoz@sribalaji.edu';
    ashDept.name = 'Applied Science & Humanities Department';
  }
  const ashHod = MOCK_DATABASE.users.find(u => u.id === 'u-hod-ash' || u.academicId === 'HOD-FIROZ' || u.academicId === 'HOD-ASH');
  if (ashHod) {
    ashHod.fullName = 'Dr. Syed Firoz Haider';
    ashHod.academicId = 'HOD-FIROZ';
    ashHod.email = 'hod.firoz@sribalaji.edu';
    ashHod.role = 'hod';
    ashHod.roleTitle = 'HOD — Applied Science & Humanities Department';
    ashHod.departmentName = 'Applied Science & Humanities Department';
    ashHod.designation = 'HOD & Associate Professor';
  }

  // Purge any extra faculties that are not in the schedule
  MOCK_DATABASE.users = MOCK_DATABASE.users.filter(u => 
    !['f-civil-1', 'f-civil-2', 'f-mech-1', 'f-mech-2', 'f-ee-1', 'f-ee-2', 'f-cse-1', 'f-cse-2'].includes(u.id)
  );

  const curActive = localStorage.getItem('relief_active_user_id');
  if (['f-civil-1', 'f-civil-2', 'f-mech-1', 'f-mech-2', 'f-ee-1', 'f-ee-2', 'f-cse-1', 'f-cse-2'].includes(curActive)) {
    localStorage.setItem('relief_active_user_id', 'u-hod-ash');
  }

  localStorage.setItem('relief_custom_users', JSON.stringify(MOCK_DATABASE.users));
  localStorage.setItem('relief_custom_departments', JSON.stringify(MOCK_DATABASE.departments));
  const savedSettings = localStorage.getItem('timetrix_custom_settings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    if (parsed && typeof parsed === 'object') {
      MOCK_DATABASE.systemSettings = {
        ...MOCK_DATABASE.systemSettings,
        ...parsed
      };
    }
  }
  const savedOverrides = localStorage.getItem('timetrix_custom_overrides');
  if (savedOverrides) {
    const parsed = JSON.parse(savedOverrides);
    if (Array.isArray(parsed)) MOCK_DATABASE.sessionOverrides = parsed;
  }
  const savedAbsences = localStorage.getItem('timetrix_custom_absences');
  if (savedAbsences) {
    const parsed = JSON.parse(savedAbsences);
    if (Array.isArray(parsed)) MOCK_DATABASE.absences = parsed;
  }
  const savedCases = localStorage.getItem('timetrix_custom_repair_cases');
  if (savedCases) {
    const parsed = JSON.parse(savedCases);
    if (Array.isArray(parsed)) MOCK_DATABASE.repairCases = parsed;
  }
  const savedLeaves = localStorage.getItem('timetrix_custom_leaves');
  if (savedLeaves) {
    const parsed = JSON.parse(savedLeaves);
    if (Array.isArray(parsed)) MOCK_DATABASE.leaves = parsed;
  }
  const savedNotifs = localStorage.getItem('timetrix_custom_notifications');
  if (savedNotifs) {
    const parsed = JSON.parse(savedNotifs);
    if (Array.isArray(parsed)) {
      MOCK_DATABASE.notifications = parsed.map(n => {
        if (n.body && typeof n.body === 'string' && n.body.includes('broken lecture slot')) {
          n.body = n.body
            .replace(/(\d+)\s*broken lecture slot\(s\)/gi, '$1 scheduled lecture(s)')
            .replace(/have been updated in the timetable\.\s*Substitute faculty & absent teacher notified\./gi, 'have been successfully covered with substitute faculty. Schedule updated & clash-free verified.');
        }
        return n;
      });
    }
  }
  const savedLogs = localStorage.getItem('timetrix_custom_audit_logs');
  if (savedLogs) {
    const parsed = JSON.parse(savedLogs);
    if (Array.isArray(parsed)) MOCK_DATABASE.auditLogs = parsed;
  }
} catch (e) {
  console.warn('DB hydration fallback:', e);
}

function saveCustomState() {
  try {
    localStorage.setItem('relief_custom_users', JSON.stringify(MOCK_DATABASE.users));
    localStorage.setItem('relief_custom_departments', JSON.stringify(MOCK_DATABASE.departments));
    localStorage.setItem('timetrix_custom_settings', JSON.stringify(MOCK_DATABASE.systemSettings));
    localStorage.setItem('timetrix_custom_overrides', JSON.stringify(MOCK_DATABASE.sessionOverrides));
    localStorage.setItem('timetrix_custom_absences', JSON.stringify(MOCK_DATABASE.absences));
    localStorage.setItem('timetrix_custom_repair_cases', JSON.stringify(MOCK_DATABASE.repairCases));
    localStorage.setItem('timetrix_custom_leaves', JSON.stringify(MOCK_DATABASE.leaves));
    localStorage.setItem('timetrix_custom_notifications', JSON.stringify(MOCK_DATABASE.notifications));
    localStorage.setItem('timetrix_custom_audit_logs', JSON.stringify(MOCK_DATABASE.auditLogs || []));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export const api = {
  // 1. Admin Office: Create HOD Profile
  async createHOD(hodData) {
    const newHod = {
      id: 'u-hod-' + Date.now(),
      academicId: hodData.academicId || ('HOD-' + (hodData.departmentCode ? hodData.departmentCode.split(' ')[0] : 'NEW')),
      fullName: hodData.fullName,
      email: hodData.email,
      role: 'hod',
      roleTitle: `HOD — ${hodData.departmentName}`,
      departmentId: hodData.departmentId,
      departmentName: hodData.departmentName,
      designation: hodData.designation || 'Head of Department',
      specialization: hodData.specialization || 'Academic Administration'
    };

    MOCK_DATABASE.users.push(newHod);

    // Update department HOD pointer
    const dept = MOCK_DATABASE.departments.find(d => d.id === hodData.departmentId);
    if (dept) {
      dept.hodId = newHod.id;
      dept.hodName = newHod.fullName;
      dept.hodAcademicId = newHod.academicId;
      dept.email = newHod.email;
    }

    saveCustomState();
    return newHod;
  },

  // 1b. Admin Office: Update HOD & Department Credentials
  async updateHOD(hodId, updates) {
    const user = MOCK_DATABASE.users.find(u => u.id === hodId || u.academicId === hodId);
    if (!user) throw new Error('HOD record not found');

    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.academicId !== undefined) user.academicId = updates.academicId.trim().toUpperCase();
    if (updates.designation !== undefined) user.designation = updates.designation;
    if (updates.specialization !== undefined) user.specialization = updates.specialization;
    if (updates.departmentName !== undefined) user.departmentName = updates.departmentName;
    if (updates.roleTitle !== undefined) user.roleTitle = updates.roleTitle;

    // Sync department details
    const dept = MOCK_DATABASE.departments.find(d => d.id === user.departmentId || d.hodId === user.id);
    if (dept) {
      dept.hodName = user.fullName;
      dept.hodAcademicId = user.academicId;
      dept.email = user.email;
      if (updates.departmentScope !== undefined) {
        dept.academicScope = updates.departmentScope;
      }
      if (updates.departmentName !== undefined) {
        dept.name = updates.departmentName;
      }
      if (updates.departmentCode !== undefined) {
        dept.code = updates.departmentCode;
      }
    }

    saveCustomState();
    return user;
  },

  // 1c. Admin Office: Update Department Profile
  async updateDepartment(deptId, updates) {
    const dept = MOCK_DATABASE.departments.find(d => d.id === deptId);
    if (!dept) throw new Error('Department not found');

    if (updates.name !== undefined) dept.name = updates.name;
    if (updates.code !== undefined) dept.code = updates.code;
    if (updates.academicScope !== undefined) dept.academicScope = updates.academicScope;
    if (updates.email !== undefined) dept.email = updates.email;

    // If HOD reassignment occurred
    if (updates.hodId && updates.hodId !== dept.hodId) {
      dept.hodId = updates.hodId;
      const targetUser = MOCK_DATABASE.users.find(u => u.id === updates.hodId);
      if (targetUser) {
        targetUser.role = 'hod';
        targetUser.departmentId = dept.id;
        targetUser.departmentName = dept.name;
        dept.hodName = targetUser.fullName;
        dept.hodAcademicId = targetUser.academicId;
      }
    }

    saveCustomState();
    return dept;
  },

  // 1d. Admin Office: Update Faculty Record
  async updateFaculty(facultyId, updates) {
    const fac = MOCK_DATABASE.users.find(u => u.id === facultyId || u.academicId === facultyId);
    if (!fac) throw new Error('Faculty record not found');

    if (updates.fullName !== undefined) fac.fullName = updates.fullName;
    if (updates.email !== undefined) fac.email = updates.email;
    if (updates.academicId !== undefined) fac.academicId = updates.academicId.trim().toUpperCase();
    if (updates.designation !== undefined) fac.designation = updates.designation;
    if (updates.roleTitle !== undefined) fac.roleTitle = updates.roleTitle;
    if (updates.departmentId !== undefined) {
      fac.departmentId = updates.departmentId;
      const dept = MOCK_DATABASE.departments.find(d => d.id === updates.departmentId);
      if (dept) fac.departmentName = dept.name;
    }
    if (updates.maxDaily !== undefined) fac.maxDaily = Number(updates.maxDaily);
    if (updates.maxWeekly !== undefined) fac.maxWeekly = Number(updates.maxWeekly);

    // Sync base timetable if name changed
    if (updates.fullName) {
      MOCK_DATABASE.baseTimetable.forEach(slot => {
        if (slot.facultyId === fac.id) {
          slot.facultyName = fac.fullName;
        }
      });
    }

    saveCustomState();
    return fac;
  },

  // 1e. Admin Office: Add New Faculty
  async addFaculty(facultyData) {
    const dept = MOCK_DATABASE.departments.find(d => d.id === facultyData.departmentId);
    const newFaculty = {
      id: 'f-' + Date.now(),
      academicId: (facultyData.academicId || ('FAC-' + Math.floor(100 + Math.random() * 900))).trim().toUpperCase(),
      fullName: facultyData.fullName,
      email: facultyData.email,
      role: 'teacher',
      roleTitle: facultyData.roleTitle || `Faculty — ${dept ? dept.name : 'Engineering'}`,
      departmentId: facultyData.departmentId,
      departmentName: dept ? dept.name : facultyData.departmentName,
      designation: facultyData.designation || 'Assistant Professor',
      maxDaily: Number(facultyData.maxDaily) || 5,
      maxWeekly: Number(facultyData.maxWeekly) || 20,
      substitutions30d: 0,
      attendanceStatus: 'present'
    };

    MOCK_DATABASE.users.push(newFaculty);
    saveCustomState();
    return newFaculty;
  },

  // 1f. Admin Office: Delete / Archive Faculty
  async deleteFaculty(facultyId) {
    const idx = MOCK_DATABASE.users.findIndex(u => u.id === facultyId || u.academicId === facultyId);
    if (idx !== -1) {
      const removed = MOCK_DATABASE.users.splice(idx, 1)[0];
      saveCustomState();
      return removed;
    }
    return null;
  },

  // 2. Admin Office: Add Department
  async createDepartment(code, name, academicScope = '') {
    const newDept = {
      id: 'dept-' + code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      code: code.toUpperCase(),
      name,
      academicScope: academicScope || 'Undergraduate B.Tech Degree Program',
      hodId: null,
      hodName: 'Not Assigned',
      hodAcademicId: 'UNASSIGNED',
      email: `${code.toLowerCase()}@sribalaji.edu`
    };
    MOCK_DATABASE.departments.push(newDept);
    saveCustomState();
    return newDept;
  },

  // 3. HOD: Manage Department Teachers
  async createTeacher(teacherData) {
    const newTeacher = {
      id: 'f-' + Date.now(),
      fullName: teacherData.fullName,
      email: teacherData.email,
      role: 'teacher',
      roleTitle: `Faculty — ${teacherData.departmentName}`,
      departmentId: teacherData.departmentId,
      departmentName: teacherData.departmentName,
      designation: teacherData.designation || 'Assistant Professor',
      maxDaily: 5,
      maxWeekly: 22,
      substitutions30d: 0,
      attendanceStatus: 'present'
    };

    MOCK_DATABASE.users.push(newTeacher);
    return newTeacher;
  },

  // 4. HOD: Mark Teacher Daily Attendance / Status
  async setTeacherAttendance(teacherId, status, date) {
    const teacher = MOCK_DATABASE.users.find(u => u.id === teacherId);
    if (!teacher) throw new Error('Teacher record not found');

    teacher.attendanceStatus = status; // 'present', 'absent', 'on_leave'

    // If teacher is marked absent, trigger repair engine
    if (status === 'absent' || status === 'on_leave') {
      await this.markSuddenAbsence({
        faculty_id: teacherId,
        absence_date: date,
        remarks: `Attendance marked ${status.toUpperCase()} by Department HOD`
      });
    }

    return teacher;
  },

  // 5. Get Department Faculty List
  async getTeachersByDepartment(deptId) {
    if (!deptId) {
      return MOCK_DATABASE.users.filter(u => u.role === 'teacher');
    }
    return MOCK_DATABASE.users.filter(u => u.role === 'teacher' && u.departmentId === deptId);
  },

  // 6. Get All Departments
  async getDepartments() {
    return MOCK_DATABASE.departments;
  },

  // 7. Get All Users
  async getAllUsers() {
    return MOCK_DATABASE.users;
  },

  // 8. Timetable Computation (Recurring Template + Dated Overrides)
  async getEffectiveTimetable(filterType, filterId, date, batchId) {
    const targetWeekday = new Date(date).getDay() || 7;
    let baseSessions = MOCK_DATABASE.baseTimetable.filter(s => s.weekday === targetWeekday);

    if (batchId) {
      baseSessions = baseSessions.filter(s => s.batchId === batchId);
    } else if (filterType === 'batch' && filterId) {
      baseSessions = baseSessions.filter(s => s.batchId === filterId);
    } else if (filterType === 'department' && filterId) {
      baseSessions = baseSessions.filter(s => s.deptId === filterId);
    } else if (filterType === 'faculty' && filterId) {
      baseSessions = baseSessions.filter(s => s.facultyId === filterId);
    }

    return baseSessions.map(base => {
      const override = MOCK_DATABASE.sessionOverrides.find(o => 
        o.entryId === base.entryId && o.sessionDate === date && ['confirmed', 'awaiting_acceptance'].includes(o.status)
      );

      if (override) {
        let subFacultyName = base.facultyName;
        if (override.substituteFacultyId) {
          const sub = MOCK_DATABASE.users.find(f => f.id === override.substituteFacultyId);
          if (sub) subFacultyName = sub.fullName;
        }

        return {
          entry_id: base.entryId,
          session_date: date,
          weekday: base.weekday,
          start_period: override.newStartPeriod || base.period,
          length_in_periods: 1,
          subject_code: base.subjectCode,
          subject_name: base.subjectName,
          faculty_id: override.substituteFacultyId || base.facultyId,
          faculty_name: subFacultyName,
          room_code: base.roomCode,
          room_name: 'Main Classroom',
          is_modified: true,
          override_kind: override.kind,
          override_status: override.status,
          override_reason: override.reason
        };
      }

      // Check if faculty is absent on this date
      const isAbsent = MOCK_DATABASE.absences.some(a => a.facultyId === base.facultyId && a.absenceDate === date);

      return {
        entry_id: base.entryId,
        session_date: date,
        weekday: base.weekday,
        start_period: base.period,
        length_in_periods: 1,
        subject_code: base.subjectCode,
        subject_name: base.subjectName,
        faculty_id: base.facultyId,
        faculty_name: base.facultyName,
        room_code: base.roomCode,
        room_name: 'Main Classroom',
        is_modified: isAbsent,
        override_kind: isAbsent ? 'affected' : null,
        override_status: isAbsent ? 'broken' : 'normal',
        override_reason: isAbsent ? 'Faculty Absent: Awaiting Repair Engine Assignment' : null
      };
    });
  },

  // 8b. Full Weekly Master Grid (Monday - Saturday for all 6 Periods)
  async getWeeklyEffectiveTimetable(filter = 'b-sec-a', date) {
    let batchId = typeof filter === 'string' ? filter : filter?.batchId;
    let facultyId = typeof filter === 'object' ? filter?.facultyId : null;

    let baseSessions = [];
    if (facultyId) {
      // Find all base sessions for this faculty across all sections/batches (handle HOD Haider dual-link)
      const effectiveFid = facultyId === 'u-hod-ash' ? 'f-haider' : facultyId;
      baseSessions = MOCK_DATABASE.baseTimetable.filter(s => s.facultyId === facultyId || s.facultyId === effectiveFid);

      // Also find sessions where this faculty is covering as a substitute on target date
      const subOverrides = MOCK_DATABASE.sessionOverrides.filter(
        o => (o.substituteFacultyId === facultyId || o.substituteFacultyId === effectiveFid) && o.sessionDate === date && o.kind === 'substitute'
      );
      const coveredEntryIds = subOverrides.map(o => o.entryId);
      const additionalCoveredSessions = MOCK_DATABASE.baseTimetable.filter(s => coveredEntryIds.includes(s.entryId));

      // Combine unique entries
      baseSessions = [...baseSessions, ...additionalCoveredSessions.filter(s => !baseSessions.some(b => b.entryId === s.entryId))];
    } else {
      baseSessions = MOCK_DATABASE.baseTimetable.filter(s => s.batchId === (batchId || 'b-sec-a'));
    }

    return baseSessions.map(base => {
      const override = MOCK_DATABASE.sessionOverrides.find(o => 
        o.entryId === base.entryId && o.sessionDate === date && ['confirmed', 'awaiting_acceptance'].includes(o.status)
      );
      const isAbsent = MOCK_DATABASE.absences.some(a => a.facultyId === base.facultyId && a.absenceDate === date);
      
      let subFacultyName = base.facultyName;
      if (override && override.substituteFacultyId) {
        const sub = MOCK_DATABASE.users.find(f => f.id === override.substituteFacultyId);
        if (sub) subFacultyName = sub.fullName;
      }

      const isSubDuty = facultyId && override?.substituteFacultyId === facultyId;

      return {
        entry_id: base.entryId,
        session_date: date,
        weekday: base.weekday,
        start_period: override?.newStartPeriod || base.period,
        length_in_periods: 1,
        subject_code: base.subjectCode,
        subject_name: base.subjectName,
        faculty_id: override?.substituteFacultyId || base.facultyId,
        faculty_name: subFacultyName,
        original_faculty_id: base.facultyId,
        original_faculty_name: base.facultyName,
        room_code: base.roomCode,
        room_name: base.batchName,
        batch_id: base.batchId,
        batch_name: base.batchName,
        is_sub_duty: isSubDuty,
        is_modified: !!override || isAbsent,
        override_kind: override ? override.kind : (isAbsent ? 'affected' : null),
        override_status: override ? override.status : (isAbsent ? 'broken' : 'normal'),
        override_reason: override ? override.reason : (isAbsent ? 'Faculty Absent' : null)
      };
    });
  },

  // --- NOTIFICATION ENGINE (Supabase table: 'notifications') ---
  async getNotifications(userId) {
    if (!MOCK_DATABASE.notifications) MOCK_DATABASE.notifications = [];
    if (!userId) return [...MOCK_DATABASE.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return MOCK_DATABASE.notifications
      .filter(n => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async addNotification(payload) {
    if (!MOCK_DATABASE.notifications) MOCK_DATABASE.notifications = [];
    const notif = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      userId: payload.userId,
      type: payload.type || 'system_alert',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      readAt: null,
      createdAt: new Date().toISOString()
    };
    MOCK_DATABASE.notifications.unshift(notif);
    saveCustomState();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timetrix:new_notification', { detail: notif }));
      window.dispatchEvent(new CustomEvent('timetrix:notification', { detail: { ...notif, isNew: true } }));
    }
    return notif;
  },

  async markNotificationRead(notifId) {
    if (!MOCK_DATABASE.notifications) return;
    const n = MOCK_DATABASE.notifications.find(item => item.id === notifId);
    if (n) {
      n.readAt = new Date().toISOString();
      saveCustomState();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timetrix:notification', { detail: { ...n, isReadUpdate: true } }));
      }
    }
    return { success: true };
  },

  async markAllNotificationsRead(userId) {
    if (!MOCK_DATABASE.notifications) return;
    MOCK_DATABASE.notifications.forEach(n => {
      if (!userId || n.userId === userId || n.userId === 'all') {
        n.readAt = new Date().toISOString();
      }
    });
    saveCustomState();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timetrix:notification', { detail: { all: true, isReadUpdate: true } }));
    }
    return { success: true };
  },

  async getUnreadNotificationCount(userId) {
    if (!MOCK_DATABASE.notifications) return 0;
    return MOCK_DATABASE.notifications.filter(n => 
      (!userId || n.userId === userId || n.userId === 'all') && !n.readAt
    ).length;
  },

  // 9. Absence Recording & Instant Automatic Best-Recommended Repair Pipeline
  async markSuddenAbsence(payload) {
    const teacher = MOCK_DATABASE.users.find(u => u.id === payload.faculty_id);
    if (teacher) {
      teacher.attendanceStatus = 'absent';
    }

    const absence = {
      id: 'abs-' + Date.now(),
      facultyId: payload.faculty_id,
      absenceDate: payload.absence_date,
      remarks: payload.remarks,
      createdAt: new Date().toISOString()
    };
    MOCK_DATABASE.absences.push(absence);

    // Identify affected broken lecture slots
    const targetWeekday = new Date(payload.absence_date).getDay() || 7;
    const brokenSessions = MOCK_DATABASE.baseTimetable.filter(
      s => s.facultyId === payload.faculty_id && s.weekday === targetWeekday
    );

    const caseId = 'case-' + Date.now();
    const repairCase = {
      id: caseId,
      absenceId: absence.id,
      targetDate: payload.absence_date,
      status: 'applied', // Automatically solved and applied!
      totalAffectedSessions: brokenSessions.length,
      resolvedSessions: 0,
      facultyName: teacher?.fullName || 'Faculty Member',
      departmentName: teacher?.departmentName || 'Engineering'
    };
    MOCK_DATABASE.repairCases.push(repairCase);

    // ⚡ AUTOMATICALLY SOLVE & ASSIGN BEST RECOMMENDED FACULTY IN TIMETABLE
    for (const session of brokenSessions) {
      // Remove any existing override for this slot on this date
      MOCK_DATABASE.sessionOverrides = MOCK_DATABASE.sessionOverrides.filter(
        ov => !(ov.entryId === session.entryId && ov.sessionDate === payload.absence_date)
      );

      // Evaluate candidate teachers using Multi-Factor Best Recommendation Solver
      const candidates = calculateBestSubstitutes(session, payload.absence_date, targetWeekday);
      let topPick = null;
      let isHandpicked = false;

      // If teacher specified a preferred / handpicked substitute, check if they are free in this period
      if (payload.preferredSubstituteId) {
        const preferredCand = candidates.find(c => c.teacher.id === payload.preferredSubstituteId);
        if (preferredCand && preferredCand.isFree) {
          topPick = preferredCand;
          isHandpicked = true;
        }
      }

      // If no preferred candidate free, fall back to top ranked free candidate
      if (!topPick) {
        topPick = candidates.find(c => c.isFree);
      }

      if (topPick) {
        const override = {
          id: 'ovr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          entryId: session.entryId,
          sessionDate: payload.absence_date,
          kind: 'substitute',
          status: 'confirmed',
          substituteFacultyId: topPick.teacher.id,
          substituteFacultyName: topPick.teacher.fullName,
          originalFacultyId: session.facultyId,
          originalFacultyName: teacher?.fullName || session.facultyName,
          period: session.period,
          subjectCode: session.subjectCode,
          subjectName: session.subjectName,
          roomCode: session.roomCode,
          batchName: session.batchName || 'Section B (AI & DS - 1st Year)',
          reason: isHandpicked
            ? `Direct Handover: ${topPick.teacher.fullName} (Pre-coordinated • Clash-free in Period ${session.period})`
            : `Auto-Assigned Best Match (${topPick.matchPercentage}% • ${topPick.rankTier}): ${topPick.justification}`,
          appliedAt: new Date().toISOString(),
          isAutoAssigned: !isHandpicked,
          isManualHandpick: isHandpicked
        };
        MOCK_DATABASE.sessionOverrides.push(override);
        topPick.teacher.substitutions30d = (topPick.teacher.substitutions30d || 0) + 1;
        repairCase.resolvedSessions++;

        // 🔔 NOTIFY ABSENT TEACHER
        await this.addNotification({
          userId: payload.faculty_id,
          type: 'absence_logged',
          title: isHandpicked
            ? `🤝 Handover Active: Period ${session.period} (${session.subjectCode})`
            : `📋 Lecture Auto-Covered: Period ${session.period} (${session.subjectCode})`,
          body: isHandpicked
            ? `Your Period ${session.period} lecture on ${payload.absence_date} has been handed over to ${topPick.teacher.fullName}.`
            : `Your Period ${session.period} lecture on ${payload.absence_date} has been automatically assigned to ${topPick.teacher.fullName} (${topPick.matchPercentage}% Best Match).`,
          data: { 
            entryId: session.entryId, 
            date: payload.absence_date, 
            substituteId: topPick.teacher.id,
            substituteName: topPick.teacher.fullName,
            period: session.period,
            roomCode: session.roomCode,
            subjectCode: session.subjectCode,
            subjectName: session.subjectName,
            batchName: session.batchName
          }
        });

        // 🔔 NOTIFY REPLACEMENT / SUBSTITUTE FACULTY
        await this.addNotification({
          userId: topPick.teacher.id,
          type: 'substitution_assigned',
          title: isHandpicked
            ? `🤝 Direct Handover Duty: Period ${session.period} (${session.subjectCode})`
            : `⚡ Substitution Duty: Period ${session.period} (${session.subjectCode})`,
          body: isHandpicked
            ? `${teacher?.fullName || 'Faculty Member'} has assigned you to cover Period ${session.period} (${session.subjectName}) in room ${session.roomCode} on ${payload.absence_date}.`
            : `You are assigned to cover ${session.subjectName} in room ${session.roomCode} on ${payload.absence_date} for ${teacher?.fullName || 'Faculty Member'} (Syllabus Continuity).`,
          data: { 
            entryId: session.entryId, 
            date: payload.absence_date, 
            originalFacultyId: payload.faculty_id,
            originalFacultyName: teacher?.fullName || session.facultyName,
            period: session.period,
            subjectCode: session.subjectCode,
            subjectName: session.subjectName,
            roomCode: session.roomCode,
            batchName: session.batchName,
            matchPercentage: topPick.matchPercentage
          }
        });
      } else {
        // Fallback: Self-Study Block
        const override = {
          id: 'ovr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          entryId: session.entryId,
          sessionDate: payload.absence_date,
          kind: 'self_study',
          status: 'confirmed',
          substituteFacultyId: null,
          originalFacultyId: session.facultyId,
          originalFacultyName: teacher?.fullName || session.facultyName,
          period: session.period,
          subjectCode: session.subjectCode,
          subjectName: session.subjectName,
          roomCode: session.roomCode,
          reason: 'Designated Self-Study / Library block (no clash-free faculty free).',
          appliedAt: new Date().toISOString(),
          isAutoAssigned: true
        };
        MOCK_DATABASE.sessionOverrides.push(override);
        repairCase.resolvedSessions++;

        await this.addNotification({
          userId: payload.faculty_id,
          type: 'absence_logged',
          title: `📖 Period ${session.period} Assigned to Self-Study`,
          body: `Your Period ${session.period} (${session.subjectCode}) on ${payload.absence_date} is scheduled as monitored self-study in ${session.roomCode}.`,
          data: { entryId: session.entryId, date: payload.absence_date }
        });
      }
    }

    // 🔔 NOTIFY HODs & Super Admin of Automated Action
    const hods = MOCK_DATABASE.users.filter(u => u.role === 'hod' || u.role === 'super_admin');
    const formattedAbsenceDate = new Date(payload.absence_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const slotCountText = brokenSessions.length === 1 ? '1 scheduled lecture' : `${brokenSessions.length} scheduled lectures`;

    for (const hod of hods) {
      await this.addNotification({
        userId: hod.id,
        type: 'system_alert',
        title: `🛡️ Schedule Updated: ${teacher?.fullName || 'Faculty'} Absent`,
        body: `${slotCountText} on ${formattedAbsenceDate} have been successfully covered with substitute faculty. Schedule updated & clash-free verified.`,
        data: { caseId, date: payload.absence_date, facultyId: payload.faculty_id }
      });
    }

    saveCustomState();
    return absence;
  },

  // 10. Get Repair Cases
  async getRepairCases(deptId) {
    if (!MOCK_DATABASE.repairCases) MOCK_DATABASE.repairCases = [];
    if (!deptId) return MOCK_DATABASE.repairCases;
    return MOCK_DATABASE.repairCases;
  },

  // 10b. HOD & Admin: Delete or Dismiss Repair Case
  async deleteRepairCase(caseId, { revertOverrides = true, editorUser = null } = {}) {
    if (!MOCK_DATABASE.repairCases) MOCK_DATABASE.repairCases = [];
    const idx = MOCK_DATABASE.repairCases.findIndex(c => c.id === caseId);
    if (idx === -1) throw new Error('Repair case not found');

    const deletedCase = MOCK_DATABASE.repairCases[idx];
    MOCK_DATABASE.repairCases.splice(idx, 1);

    // If absenceId exists, remove the associated absence
    let linkedAbsence = null;
    if (deletedCase.absenceId && MOCK_DATABASE.absences) {
      const absIdx = MOCK_DATABASE.absences.findIndex(a => a.id === deletedCase.absenceId);
      if (absIdx !== -1) {
        linkedAbsence = MOCK_DATABASE.absences[absIdx];
        MOCK_DATABASE.absences.splice(absIdx, 1);
        
        // Reset teacher attendance status to 'present' if no other absences on this date
        const hasOther = MOCK_DATABASE.absences.some(a => a.facultyId === linkedAbsence.facultyId);
        if (!hasOther) {
          const teacher = MOCK_DATABASE.users.find(u => u.id === linkedAbsence.facultyId);
          if (teacher) teacher.attendanceStatus = 'present';
        }
      }
    }

    // If revertOverrides is true, restore the original timetable slots
    if (revertOverrides && deletedCase.targetDate) {
      const targetDate = deletedCase.targetDate;
      const targetWeekday = new Date(targetDate).getDay() || 7;
      const facultyId = linkedAbsence?.facultyId;

      let entryIds = [];
      if (facultyId) {
        const baseSessions = MOCK_DATABASE.baseTimetable.filter(
          s => s.facultyId === facultyId && s.weekday === targetWeekday
        );
        entryIds = baseSessions.map(s => s.entryId);
      }

      if (entryIds.length > 0) {
        // Notify substitutes that the substitution has been canceled
        const removedOverrides = MOCK_DATABASE.sessionOverrides.filter(
          ov => entryIds.includes(ov.entryId) && ov.sessionDate === targetDate
        );

        for (const ov of removedOverrides) {
          if (ov.substituteFacultyId) {
            const sub = MOCK_DATABASE.users.find(u => u.id === ov.substituteFacultyId);
            if (sub) {
              sub.substitutions30d = Math.max(0, (sub.substitutions30d || 1) - 1);
              await this.addNotification({
                userId: sub.id,
                type: 'substitution_updated',
                title: `ℹ️ Substitution Duty Revoked / Canceled`,
                body: `Your substitution duty for ${ov.subjectCode} on ${targetDate} was canceled as the repair case was cleared by ${editorUser?.fullName || 'HOD'}.`,
                data: { entryId: ov.entryId, date: targetDate }
              });
            }
          }
        }

        MOCK_DATABASE.sessionOverrides = MOCK_DATABASE.sessionOverrides.filter(
          ov => !(entryIds.includes(ov.entryId) && ov.sessionDate === targetDate)
        );
      }
    }

    // Log to System Audit Trail
    if (!MOCK_DATABASE.auditLogs) MOCK_DATABASE.auditLogs = [];
    MOCK_DATABASE.auditLogs.unshift({
      id: 'audit-' + Date.now(),
      type: 'case_deleted',
      title: `🗑️ Repair Case Deleted: ${deletedCase.facultyName}`,
      description: `Case for ${deletedCase.facultyName} on ${deletedCase.targetDate} was cleared by ${editorUser?.fullName || 'Department HOD'}. (${revertOverrides ? 'Timetable overrides reverted.' : 'Overrides kept intact.'})`,
      performedBy: editorUser?.fullName || 'HOD / Admin',
      departmentName: deletedCase.departmentName || 'Engineering',
      targetDate: deletedCase.targetDate,
      timestamp: new Date().toISOString()
    });

    saveCustomState();
    return { success: true, deletedCase };
  },

  // 10c. System Audit Logs API (Admin Office & HOD View)
  async getAuditLogs(filter = {}) {
    if (!MOCK_DATABASE.auditLogs) MOCK_DATABASE.auditLogs = [];
    let combined = [...MOCK_DATABASE.auditLogs];

    // Add absence entries
    if (Array.isArray(MOCK_DATABASE.absences)) {
      MOCK_DATABASE.absences.forEach(a => {
        const teacher = MOCK_DATABASE.users.find(u => u.id === a.facultyId);
        if (!combined.some(c => c.absenceId === a.id)) {
          combined.push({
            id: 'audit-abs-' + a.id,
            absenceId: a.id,
            type: 'absence_logged',
            title: `🚨 Emergency Absence: ${teacher?.fullName || 'Faculty Member'}`,
            description: `Absence logged on ${a.absenceDate}. Remarks: "${a.remarks || 'Sudden Absence'}"`,
            performedBy: teacher?.fullName || 'Faculty Member',
            departmentId: teacher?.departmentId || '',
            departmentName: teacher?.departmentName || 'Engineering',
            targetDate: a.absenceDate,
            timestamp: a.createdAt || new Date().toISOString()
          });
        }
      });
    }

    // Add substitution override entries
    if (Array.isArray(MOCK_DATABASE.sessionOverrides)) {
      MOCK_DATABASE.sessionOverrides.forEach(ov => {
        if (!combined.some(c => c.overrideId === ov.id)) {
          const session = MOCK_DATABASE.baseTimetable.find(b => b.entryId === ov.entryId);
          const teacher = MOCK_DATABASE.users.find(u => u.id === (ov.originalFacultyId || session?.facultyId));
          const sub = MOCK_DATABASE.users.find(u => u.id === ov.substituteFacultyId);
          combined.push({
            id: 'audit-ovr-' + ov.id,
            overrideId: ov.id,
            type: ov.isManualOverride ? 'manual_override' : 'auto_repair',
            title: ov.isManualOverride
              ? `✏️ Manual Assignment: P${ov.period || session?.period || 1} (${ov.subjectCode || session?.subjectCode || 'LEC'})`
              : `⚡ Auto-Repair: P${ov.period || session?.period || 1} (${ov.subjectCode || session?.subjectCode || 'LEC'})`,
            description: `${sub?.fullName || ov.substituteFacultyName || (ov.kind === 'self_study' ? 'Self-Study Block' : 'Substitute')} covering for ${teacher?.fullName || ov.originalFacultyName || 'Absent Faculty'} in ${ov.roomCode || session?.roomCode || 'TBA'}. (${ov.reason || 'Syllabus continuity'})`,
            performedBy: ov.editedBy || (ov.isManualOverride ? 'HOD' : 'Autonomous Engine'),
            departmentId: teacher?.departmentId || '',
            departmentName: teacher?.departmentName || 'Applied Science & Humanities (1st Year)',
            targetDate: ov.sessionDate,
            timestamp: ov.appliedAt || new Date().toISOString()
          });
        }
      });
    }

    if (filter.date) {
      combined = combined.filter(l => l.targetDate === filter.date);
    }
    if (filter.type) {
      combined = combined.filter(l => l.type === filter.type);
    }
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      combined = combined.filter(l => 
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.performedBy && l.performedBy.toLowerCase().includes(q))
      );
    }

    return combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // 11. Get Repair Options
  async getRepairOptions(caseId) {
    return MOCK_DATABASE.repairOptions.filter(o => o.repairCaseId === caseId);
  },

  // 12. Apply Repair Option
  async applyRepairOption(optionId) {
    const opt = MOCK_DATABASE.repairOptions.find(o => o.id === optionId);
    if (!opt) throw new Error('Option not found');

    const override = {
      id: 'ovr-' + Date.now(),
      entryId: opt.entryId,
      sessionDate: opt.sessionDate,
      kind: opt.optionKind,
      status: opt.optionKind === 'substitute' ? 'awaiting_acceptance' : 'confirmed',
      substituteFacultyId: opt.candidatePayload?.substituteFacultyId || null,
      reason: opt.explanation,
      appliedAt: new Date().toISOString()
    };
    MOCK_DATABASE.sessionOverrides.push(override);

    if (opt.optionKind === 'substitute' && opt.candidatePayload?.substituteFacultyId) {
      MOCK_DATABASE.substitutionRequests.push({
        id: 'sub-req-' + Date.now(),
        overrideId: override.id,
        substituteFacultyId: opt.candidatePayload.substituteFacultyId,
        substituteFacultyName: opt.candidatePayload.substituteFacultyName,
        sessionDate: opt.sessionDate,
        period: opt.candidatePayload.period,
        status: 'awaiting_acceptance',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    }

    const rCase = MOCK_DATABASE.repairCases.find(c => c.id === opt.repairCaseId);
    if (rCase) {
      rCase.resolvedSessions += 1;
      if (rCase.resolvedSessions >= rCase.totalAffectedSessions) {
        rCase.status = 'applied';
      }
    }
    saveCustomState();
    return { success: true };
  },

  // 13. Substitution Requests
  async getSubstitutionRequests(facultyId) {
    if (!facultyId) return MOCK_DATABASE.substitutionRequests;
    return MOCK_DATABASE.substitutionRequests.filter(r => r.substituteFacultyId === facultyId);
  },

  async respondToSubstitution(requestId, accept) {
    const req = MOCK_DATABASE.substitutionRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = accept ? 'confirmed' : 'rejected';
    const override = MOCK_DATABASE.sessionOverrides.find(o => o.id === req.overrideId);
    if (override) {
      override.status = accept ? 'confirmed' : 'rejected';
    }
    saveCustomState();
    return { success: true };
  },

  // 14. Teacher Leave Management (Planned Leave & HOD Workflow)
  async applyLeave(leaveData) {
    const newLeave = {
      id: 'leave-' + Date.now(),
      teacherId: leaveData.teacherId,
      teacherName: leaveData.teacherName,
      departmentId: leaveData.departmentId,
      departmentName: leaveData.departmentName,
      leaveDate: leaveData.leaveDate,
      endDate: leaveData.endDate || leaveData.leaveDate,
      leaveType: leaveData.leaveType || 'Casual Leave',
      reason: leaveData.reason || 'Personal / Academic duty',
      suggestedSubstituteId: leaveData.suggestedSubstituteId || null,
      suggestedSubstituteName: leaveData.suggestedSubstituteName || null,
      affectedLecturesCount: leaveData.affectedLecturesCount || 0,
      affectedLecturesSummary: leaveData.affectedLecturesSummary || '',
      status: 'pending',
      appliedAt: new Date().toISOString(),
      approvedBy: null
    };
    if (!MOCK_DATABASE.leaves) MOCK_DATABASE.leaves = [];
    MOCK_DATABASE.leaves.push(newLeave);

    // 🔔 Notify Department HOD & Super Admin
    const hods = MOCK_DATABASE.users.filter(u => 
      (u.role === 'hod' && (!leaveData.departmentId || u.departmentId === leaveData.departmentId)) || 
      u.role === 'super_admin'
    );
    for (const hod of hods) {
      await this.addNotification({
        userId: hod.id,
        type: 'leave_request',
        title: `📝 New Leave Application: ${leaveData.teacherName}`,
        body: `${leaveData.teacherName} submitted ${newLeave.leaveType} for ${newLeave.leaveDate} (${newLeave.affectedLecturesCount} lecture(s) affected). Review & approve.`,
        data: { leaveId: newLeave.id, date: newLeave.leaveDate, teacherId: newLeave.teacherId }
      });
    }

    saveCustomState();
    return newLeave;
  },

  async getLeaves(filter = {}) {
    if (!MOCK_DATABASE.leaves) MOCK_DATABASE.leaves = [];
    let list = [...MOCK_DATABASE.leaves];
    if (filter.teacherId) {
      list = list.filter(l => l.teacherId === filter.teacherId);
    }
    if (filter.departmentId) {
      list = list.filter(l => l.departmentId === filter.departmentId);
    }
    return list;
  },

  async approveLeave(leaveId, approverName = 'Department HOD') {
    if (!MOCK_DATABASE.leaves) MOCK_DATABASE.leaves = [];
    const leave = MOCK_DATABASE.leaves.find(l => l.id === leaveId);
    if (!leave) throw new Error('Leave application not found');

    leave.status = 'approved';
    leave.approvedBy = approverName;
    leave.approvedAt = new Date().toISOString();

    // Automatically trigger absence & Best Recommended or suggested auto-replacement in timetable!
    await this.markSuddenAbsence({
      faculty_id: leave.teacherId,
      absence_date: leave.leaveDate,
      remarks: `Leave approved by ${approverName} (${leave.leaveType})`,
      preferredSubstituteId: leave.suggestedSubstituteId || null
    });

    // 🔔 Notify the applying teacher that their leave was approved
    await this.addNotification({
      userId: leave.teacherId,
      type: 'leave_approved',
      title: `✅ Leave Approved (${leave.leaveType})`,
      body: `Your leave for ${leave.leaveDate} has been approved by ${approverName}. Schedule has been updated with substitute coverage.`,
      data: { leaveId: leave.id, date: leave.leaveDate }
    });

    saveCustomState();
    return leave;
  },

  async rejectLeave(leaveId, reason = 'Departmental scheduling constraints') {
    if (!MOCK_DATABASE.leaves) MOCK_DATABASE.leaves = [];
    const leave = MOCK_DATABASE.leaves.find(l => l.id === leaveId);
    if (!leave) throw new Error('Leave application not found');

    leave.status = 'rejected';
    leave.rejectionReason = reason;
    leave.rejectedAt = new Date().toISOString();

    // 🔔 Notify the applying teacher that their leave was rejected
    await this.addNotification({
      userId: leave.teacherId,
      type: 'leave_rejected',
      title: `❌ Leave Application Not Approved`,
      body: `Your leave request for ${leave.leaveDate} was not approved by HOD. Reason: "${reason}"`,
      data: { leaveId: leave.id, date: leave.leaveDate }
    });

    saveCustomState();
    return leave;
  },

  // 14b. Helper: Inspect Teacher Schedule on a given Date
  async getTeacherScheduleForDate(teacherId, date) {
    const targetWeekday = new Date(date).getDay() || 7;
    const baseSessions = MOCK_DATABASE.baseTimetable
      .filter(s => s.facultyId === teacherId && s.weekday === targetWeekday)
      .sort((a, b) => a.period - b.period);

    return baseSessions.map(session => {
      const override = MOCK_DATABASE.sessionOverrides.find(
        o => o.entryId === session.entryId && o.sessionDate === date
      );
      const isAbsent = MOCK_DATABASE.absences.some(
        a => a.facultyId === teacherId && a.absenceDate === date
      );

      return {
        entryId: session.entryId,
        period: session.period,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        roomCode: session.roomCode,
        batchName: session.batchName,
        isAbsent,
        override: override || null
      };
    });
  },

  // 14c. Helper: Get Department Colleagues for Handover Coordination
  async getColleaguesForHandover(teacherId, date) {
    const teacher = MOCK_DATABASE.users.find(u => u.id === teacherId);
    const deptId = teacher?.departmentId;
    const allColleagues = MOCK_DATABASE.users.filter(
      u => u.role === 'teacher' && u.id !== teacherId && (!deptId || u.departmentId === deptId)
    );

    const targetWeekday = new Date(date).getDay() || 7;
    return allColleagues.map(colleague => {
      const isAbsent = MOCK_DATABASE.absences.some(a => a.facultyId === colleague.id && a.absenceDate === date);
      const regularClasses = MOCK_DATABASE.baseTimetable.filter(s => s.facultyId === colleague.id && s.weekday === targetWeekday);
      const subDuties = MOCK_DATABASE.sessionOverrides.filter(o => o.substituteFacultyId === colleague.id && o.sessionDate === date);
      const busyPeriods = [...new Set([...regularClasses.map(s => s.period), ...subDuties.map(o => o.period)])];

      return {
        id: colleague.id,
        fullName: colleague.fullName,
        designation: colleague.designation || 'Faculty Member',
        specialization: colleague.specialization || '',
        departmentName: colleague.departmentName || '',
        isAbsent,
        busyPeriods,
        busyCount: busyPeriods.length,
        freeCount: Math.max(0, 6 - busyPeriods.length)
      };
    });
  },

  // 15. Smart Auto-Repair All Broken Slots in 1 Click (Best Match Engine)
  async applyAllRepairs(caseId) {
    const rCase = MOCK_DATABASE.repairCases.find(c => c.id === caseId);
    if (!rCase) throw new Error('Repair case not found');

    const targetDate = rCase.targetDate;
    const targetWeekday = new Date(targetDate).getDay() || 7;
    const targetAbsence = MOCK_DATABASE.absences.find(a => a.id === rCase.absenceId);
    const absentFacultyId = targetAbsence ? targetAbsence.facultyId : null;

    const brokenSessions = MOCK_DATABASE.baseTimetable.filter(
      s => s.facultyId === absentFacultyId && s.weekday === targetWeekday
    );

    let appliedCount = 0;

    for (const session of brokenSessions) {
      const alreadyRepaired = MOCK_DATABASE.sessionOverrides.some(
        ov => ov.entryId === session.entryId && ov.sessionDate === targetDate
      );
      if (alreadyRepaired) continue;

      const candidates = calculateBestSubstitutes(session, targetDate, targetWeekday);
      const topPick = candidates.find(c => c.isFree);

      if (topPick) {
        await this.applyManualRepair(
          caseId,
          session.entryId,
          topPick.teacher.id,
          'substitute',
          `Auto-assigned via Best Recommendation Engine (${topPick.matchPercentage}% Match • ${topPick.rankTier})`
        );
        appliedCount++;
      } else {
        await this.applyManualRepair(caseId, session.entryId, null, 'self_study', 'Self-Study block designated.');
        appliedCount++;
      }
    }

    rCase.resolvedSessions = rCase.totalAffectedSessions;
    rCase.status = 'applied';
    saveCustomState();
    return { success: true, count: appliedCount };
  },

  // 16. Manual Repair / Substitution for a Specific Broken Slot (HOD Manual Override)
  async applyManualRepair(caseId, entryId, substituteFacultyId, optionKind = 'substitute', customNote = '', editorUser = null) {
    let rCase = MOCK_DATABASE.repairCases.find(c => c.id === caseId);
    const session = MOCK_DATABASE.baseTimetable.find(s => s.entryId === entryId);
    if (!session) throw new Error('Timetable slot not found');

    const targetDate = rCase 
      ? rCase.targetDate 
      : (customNote && customNote.targetDate ? customNote.targetDate : new Date().toISOString().split('T')[0]);

    // Find existing override if any
    const existingOverride = MOCK_DATABASE.sessionOverrides.find(
      ov => ov.entryId === entryId && ov.sessionDate === targetDate
    );

    // If previously assigned to a different substitute, notify them of cancellation/reassignment
    if (existingOverride && existingOverride.substituteFacultyId && existingOverride.substituteFacultyId !== substituteFacultyId) {
      const prevSub = MOCK_DATABASE.users.find(u => u.id === existingOverride.substituteFacultyId);
      if (prevSub) {
        prevSub.substitutions30d = Math.max(0, (prevSub.substitutions30d || 1) - 1);
        await this.addNotification({
          userId: prevSub.id,
          type: 'substitution_updated',
          title: `ℹ️ Substitution Reassigned: Period ${session.period} (${session.subjectCode})`,
          body: `Your substitution duty for Period ${session.period} on ${targetDate} has been updated or reassigned by ${editorUser?.fullName || 'HOD'}.`,
          data: { entryId, date: targetDate }
        });
      }
    }

    // Remove old override
    MOCK_DATABASE.sessionOverrides = MOCK_DATABASE.sessionOverrides.filter(
      ov => !(ov.entryId === entryId && ov.sessionDate === targetDate)
    );

    const isSub = optionKind === 'substitute' && substituteFacultyId;
    const newSubTeacher = isSub ? MOCK_DATABASE.users.find(u => u.id === substituteFacultyId) : null;

    const noteString = typeof customNote === 'string' ? customNote : '';
    const reasonText = isSub
      ? `HOD Manual Assignment: ${newSubTeacher?.fullName || 'Faculty'} selected to substitute Period ${session.period}. ${noteString}`
      : `HOD Manual Override: Self-Study block designated in ${session.roomCode}. ${noteString}`;

    const override = {
      id: 'ovr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      entryId: entryId,
      sessionDate: targetDate,
      kind: isSub ? 'substitute' : 'self_study',
      status: 'confirmed',
      substituteFacultyId: isSub ? substituteFacultyId : null,
      substituteFacultyName: newSubTeacher?.fullName || null,
      originalFacultyId: session.facultyId,
      originalFacultyName: session.facultyName,
      period: session.period,
      subjectCode: session.subjectCode,
      subjectName: session.subjectName,
      roomCode: session.roomCode,
      batchName: session.batchName || 'Section B (AI & DS - 1st Year)',
      reason: reasonText,
      appliedAt: new Date().toISOString(),
      isManualOverride: true,
      editedBy: editorUser?.fullName || 'HOD'
    };
    MOCK_DATABASE.sessionOverrides.push(override);

    if (isSub && newSubTeacher) {
      newSubTeacher.substitutions30d = (newSubTeacher.substitutions30d || 0) + 1;

      // 🔔 NOTIFY NEWLY ASSIGNED SUBSTITUTE TEACHER
      await this.addNotification({
        userId: newSubTeacher.id,
        type: 'substitution_assigned',
        title: `⚡ Substitution Assigned by HOD: Period ${session.period} (${session.subjectCode})`,
        body: `${editorUser?.fullName || 'Department HOD'} has assigned you to cover Period ${session.period} (${session.subjectName}) in Room ${session.roomCode} on ${targetDate} for ${session.facultyName}.`,
        data: { 
          entryId, 
          date: targetDate, 
          period: session.period,
          roomCode: session.roomCode,
          subjectCode: session.subjectCode,
          subjectName: session.subjectName,
          batchName: session.batchName || 'Section B (AI & DS - 1st Year)',
          originalFacultyName: session.facultyName,
          reason: reasonText
        }
      });
    }

    // 🔔 NOTIFY ORIGINAL / ABSENT TEACHER OF HOD UPDATE
    if (session.facultyId) {
      await this.addNotification({
        userId: session.facultyId,
        type: 'absence_logged',
        title: `Update: Period ${session.period} Assigned to ${newSubTeacher?.fullName || 'Self-Study'}`,
        body: `HOD updated your Period ${session.period} lecture on ${targetDate} to be covered by ${newSubTeacher?.fullName || 'monitored self-study'}.`,
        data: { entryId, date: targetDate, period: session.period }
      });
    }

    if (rCase) {
      rCase.resolvedSessions = Math.min(rCase.totalAffectedSessions, (rCase.resolvedSessions || 0) + 1);
      if (rCase.resolvedSessions >= rCase.totalAffectedSessions) {
        rCase.status = 'applied';
      }
    }

    saveCustomState();
    return { success: true, override };
  },

  // 17. Class Delivery Conduction Registry (% Class Conducted)
  async getConductionMetrics() {
    const list = MOCK_DATABASE.courseConduction || [];
    const totalScheduled = list.reduce((sum, c) => sum + (c.totalScheduled || 0), 0);
    const totalConducted = list.reduce((sum, c) => sum + (c.regularConducted || 0) + (c.substitutedConducted || 0), 0);
    const totalSubstituted = list.reduce((sum, c) => sum + (c.substitutedConducted || 0), 0);
    const totalMissed = list.reduce((sum, c) => sum + (c.missedUnresolved || 0), 0);
    const overallPercent = totalScheduled > 0 ? Math.round((totalConducted / totalScheduled) * 1000) / 10 : 100;

    return {
      courses: list.map(c => ({
        ...c,
        conductedTotal: (c.regularConducted || 0) + (c.substitutedConducted || 0),
        conductedPercent: c.totalScheduled > 0 ? Math.round((((c.regularConducted || 0) + (c.substitutedConducted || 0)) / c.totalScheduled) * 1000) / 10 : 100
      })),
      totalScheduled,
      totalConducted,
      totalSubstituted,
      totalMissed,
      overallPercent
    };
  },

  // 18. Today's Real-Time Live Bell Schedule Tracker (Exact College Timings)
  async getLiveDaySchedule(date, filter = 'b-sec-a') {
    const targetWeekday = new Date(date).getDay() || 7;
    let batchId = typeof filter === 'string' ? filter : filter?.batchId;
    let facultyId = typeof filter === 'object' ? filter?.facultyId : null;

    // Official Bell Periods (Sri Balaji College: 9:35 AM to 3:25 PM)
    const bellPeriods = [
      { period: 1, startTime: '09:35', endTime: '10:30', timeSlot: '9:35am - 10:30am', label: 'Period I' },
      { period: 2, startTime: '10:30', endTime: '11:25', timeSlot: '10:30am - 11:25am', label: 'Period II' },
      { period: 3, startTime: '11:25', endTime: '12:20', timeSlot: '11:25am - 12:20pm', label: 'Period III' },
      { period: 4, startTime: '12:20', endTime: '13:10', timeSlot: '12:20pm - 1:10pm', label: 'Period IV' },
      { period: 5, startTime: '13:45', endTime: '14:35', timeSlot: '1:45pm - 2:35pm', label: 'Period V' },
      { period: 6, startTime: '14:35', endTime: '15:25', timeSlot: '2:35pm - 3:25pm', label: 'Period VI' }
    ];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return bellPeriods.map(bp => {
      const [sH, sM] = bp.startTime.split(':').map(Number);
      const [eH, eM] = bp.endTime.split(':').map(Number);
      const startTotal = sH * 60 + sM;
      const endTotal = eH * 60 + eM;

      const isOngoing = currentMinutes >= startTotal && currentMinutes < endTotal;
      const isPast = currentMinutes >= endTotal;
      const isUpcoming = currentMinutes < startTotal;

      if (facultyId) {
        const effectiveFid = facultyId === 'u-hod-ash' ? 'f-haider' : facultyId;

        // 1. Check if this teacher has an assigned substitution duty in this period
        const subOverride = MOCK_DATABASE.sessionOverrides.find(
          o => (o.substituteFacultyId === facultyId || o.substituteFacultyId === effectiveFid) && o.sessionDate === date && o.kind === 'substitute'
        );
        let subBase = null;
        if (subOverride) {
          subBase = MOCK_DATABASE.baseTimetable.find(b => b.entryId === subOverride.entryId && b.period === bp.period);
        }

        if (subOverride && subBase) {
          return {
            ...bp,
            entryId: subBase.entryId,
            isOngoing,
            isPast,
            isUpcoming,
            status: 'substitution_duty',
            isSubDuty: true,
            isSubstituted: true,
            subjectCode: subBase.subjectCode,
            subjectName: subBase.subjectName,
            roomCode: subBase.roomCode,
            batchName: subBase.batchName,
            facultyName: `You (Substitute Duty)`,
            originalFacultyName: subBase.facultyName,
            overrideReason: subOverride.reason,
            alertMessage: `⚡ Covering for ${subBase.facultyName}`
          };
        }

        // 2. Check if this teacher has a scheduled regular lecture
        const base = MOCK_DATABASE.baseTimetable.find(
          s => (s.facultyId === facultyId || s.facultyId === effectiveFid) && s.weekday === targetWeekday && s.period === bp.period
        );

        if (!base) {
          return {
            ...bp,
            isOngoing,
            isPast,
            isUpcoming,
            status: 'free',
            subjectCode: 'FREE',
            subjectName: 'Free Period (No Lecture Assigned)',
            roomCode: 'Faculty Lounge / Office',
            batchName: 'N/A',
            facultyName: 'Self-Directed Time',
            isFree: true
          };
        }

        // Check if teacher's lecture is overridden or teacher is absent
        const override = MOCK_DATABASE.sessionOverrides.find(o => o.entryId === base.entryId && o.sessionDate === date);
        const isAbsent = MOCK_DATABASE.absences.some(a => a.facultyId === base.facultyId && a.absenceDate === date);

        if (override) {
          const sub = MOCK_DATABASE.users.find(u => u.id === override.substituteFacultyId);
          return {
            ...bp,
            entryId: base.entryId,
            isOngoing,
            isPast,
            isUpcoming,
            status: override.kind === 'substitute' ? 'covered_by_sub' : 'self_study',
            isSubstituted: true,
            subjectCode: base.subjectCode,
            subjectName: base.subjectName,
            roomCode: base.roomCode,
            batchName: base.batchName,
            facultyName: sub ? sub.fullName : 'Designated Self-Study',
            originalFacultyName: base.facultyName,
            overrideReason: override.reason,
            alertMessage: `Covered by substitute ${sub ? sub.fullName : 'faculty'}`
          };
        }

        if (isAbsent) {
          return {
            ...bp,
            entryId: base.entryId,
            isOngoing,
            isPast,
            isUpcoming,
            status: 'broken',
            isBroken: true,
            subjectCode: base.subjectCode,
            subjectName: base.subjectName,
            roomCode: base.roomCode,
            batchName: base.batchName,
            facultyName: base.facultyName,
            alertMessage: 'You are marked absent on this date.'
          };
        }

        return {
          ...bp,
          entryId: base.entryId,
          isOngoing,
          isPast,
          isUpcoming,
          status: 'normal',
          subjectCode: base.subjectCode,
          subjectName: base.subjectName,
          roomCode: base.roomCode,
          batchName: base.batchName,
          facultyName: base.facultyName,
          isRegular: true
        };
      }

      // Branch / Section Wise Logic
      const baseSessions = MOCK_DATABASE.baseTimetable.filter(s => s.weekday === targetWeekday && s.batchId === batchId);
      const base = baseSessions.find(s => s.period === bp.period);
      if (!base) {
        return {
          ...bp,
          isOngoing,
          isPast,
          isUpcoming,
          status: 'free',
          subjectCode: 'LIB',
          subjectName: 'Self-Directed Library / Study Period',
          roomCode: 'Central Library',
          batchName: batchId === 'b-sec-a' ? 'Section A' : 'Section B',
          facultyName: 'Open Floor'
        };
      }

      // Check override
      const override = MOCK_DATABASE.sessionOverrides.find(o => o.entryId === base.entryId && o.sessionDate === date);
      const isAbsent = MOCK_DATABASE.absences.some(a => a.facultyId === base.facultyId && a.absenceDate === date);

      if (override) {
        let subName = base.facultyName;
        if (override.substituteFacultyId) {
          const sub = MOCK_DATABASE.users.find(u => u.id === override.substituteFacultyId);
          if (sub) subName = sub.fullName;
        }

        return {
          ...bp,
          entryId: base.entryId,
          isOngoing,
          isPast,
          isUpcoming,
          status: override.kind === 'substitute' ? 'substituted' : 'self_study',
          subjectCode: base.subjectCode,
          subjectName: base.subjectName,
          roomCode: base.roomCode,
          batchName: base.batchName,
          facultyName: subName,
          originalFacultyName: base.facultyName,
          overrideReason: override.reason,
          isSubstituted: override.kind === 'substitute'
        };
      }

      if (isAbsent) {
        return {
          ...bp,
          entryId: base.entryId,
          isOngoing,
          isPast,
          isUpcoming,
          status: 'broken',
          subjectCode: base.subjectCode,
          subjectName: base.subjectName,
          roomCode: base.roomCode,
          batchName: base.batchName,
          facultyName: base.facultyName,
          isBroken: true,
          alertMessage: `Faculty ${base.facultyName} Absent! Class at risk.`
        };
      }

      return {
        ...bp,
        entryId: base.entryId,
        isOngoing,
        isPast,
        isUpcoming,
        status: 'normal',
        subjectCode: base.subjectCode,
        subjectName: base.subjectName,
        roomCode: base.roomCode,
        batchName: base.batchName,
        facultyName: base.facultyName,
        isRegular: true
      };
    });
  },

  // 19. Date-Wise History & Audit Log API (Substitutions, Absences, Repairs)
  async getSubstitutionHistory(filter = {}) {
    if (!MOCK_DATABASE.sessionOverrides) return [];
    let list = [...MOCK_DATABASE.sessionOverrides];

    if (filter.date) {
      list = list.filter(o => o.sessionDate === filter.date);
    }
    if (filter.facultyId) {
      list = list.filter(o => o.substituteFacultyId === filter.facultyId || o.originalFacultyId === filter.facultyId);
    }

    return list.map(ov => {
      const session = MOCK_DATABASE.baseTimetable.find(b => b.entryId === ov.entryId);
      const sub = MOCK_DATABASE.users.find(u => u.id === ov.substituteFacultyId);
      const orig = MOCK_DATABASE.users.find(u => u.id === (ov.originalFacultyId || session?.facultyId));

      return {
        id: ov.id,
        entryId: ov.entryId,
        date: ov.sessionDate,
        period: session?.period || ov.period || 1,
        subjectCode: session?.subjectCode || ov.subjectCode || 'LEC',
        subjectName: session?.subjectName || ov.subjectName || 'Lecture Slot',
        roomCode: session?.roomCode || ov.roomCode || 'TBA',
        batchName: session?.batchName || 'B.Tech I Year',
        originalFacultyName: orig?.fullName || ov.originalFacultyName || session?.facultyName || 'Absent Teacher',
        substituteFacultyName: sub?.fullName || ov.substituteFacultyName || (ov.kind === 'self_study' ? 'Self-Study Block' : 'Unassigned'),
        kind: ov.kind,
        isManualOverride: !!ov.isManualOverride,
        editedBy: ov.editedBy || 'Automated Engine',
        reason: ov.reason,
        appliedAt: ov.appliedAt || new Date().toISOString()
      };
    }).sort((a, b) => new Date(b.date + ' ' + b.appliedAt) - new Date(a.date + ' ' + a.appliedAt));
  },

  async getAbsenceHistory(filter = {}) {
    if (!MOCK_DATABASE.absences) return [];
    let list = [...MOCK_DATABASE.absences];

    if (filter.date) {
      list = list.filter(a => a.absenceDate === filter.date);
    }
    if (filter.facultyId) {
      list = list.filter(a => a.facultyId === filter.facultyId);
    }

    return list.map(abs => {
      const teacher = MOCK_DATABASE.users.find(u => u.id === abs.facultyId);
      return {
        ...abs,
        facultyName: teacher?.fullName || 'Faculty Member',
        departmentName: teacher?.departmentName || 'Applied Sciences'
      };
    }).sort((a, b) => new Date(b.absenceDate) - new Date(a.absenceDate));
  },

  // 17. System Settings & Scoring Configurations (Backend Table: 'settings')
  async getSettings() {
    return MOCK_DATABASE.systemSettings;
  },

  async updateSettings(updates) {
    if (updates.engineScoringWeights) {
      MOCK_DATABASE.systemSettings.engineScoringWeights = {
        ...MOCK_DATABASE.systemSettings.engineScoringWeights,
        ...updates.engineScoringWeights
      };
    }
    if (updates.timingConfig) {
      MOCK_DATABASE.systemSettings.timingConfig = {
        ...MOCK_DATABASE.systemSettings.timingConfig,
        ...updates.timingConfig
      };
    }
    saveCustomState();
    return MOCK_DATABASE.systemSettings;
  }
};
