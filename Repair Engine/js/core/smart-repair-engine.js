// File: /js/core/smart-repair-engine.js
// Academic Multi-Factor Substitution Scoring & Best Recommendation Engine
// Factors: Availability (Zero Clash), Subject/Domain Specialty, Syllabus Conduction Deficit, Workload Fairness, Dept Affinity

import { MOCK_DATABASE } from './mock-data.js';

/**
 * Calculates and ranks the best substitute teachers for a broken lecture slot.
 * @param {Object} session - The base timetable session object.
 * @param {string} targetDate - The date string (YYYY-MM-DD) of the absence.
 * @param {number} targetWeekday - The weekday number (1 = Mon .. 6 = Sat).
 * @returns {Array} Array of candidate objects sorted from Best Recommended to Least Suitable.
 */
export function calculateBestSubstitutes(session, targetDate, targetWeekday) {
  // 1. Identify which faculty are occupied in this period on this weekday
  const busyInBase = MOCK_DATABASE.baseTimetable
    .filter(b => b.weekday === targetWeekday && b.period === session.period)
    .map(b => b.facultyId);

  // Check existing session overrides on the target date for this period
  const busyInOverrides = MOCK_DATABASE.sessionOverrides
    .filter(ov => ov.sessionDate === targetDate)
    .map(ov => {
      // Find the period of that override
      const bSlot = MOCK_DATABASE.baseTimetable.find(b => b.entryId === ov.entryId);
      return bSlot && bSlot.period === session.period ? ov.substituteFacultyId : null;
    })
    .filter(Boolean);

  // Find all faculty on approved/pending leave on targetDate
  const absentFacultyIds = MOCK_DATABASE.absences
    .filter(a => a.absenceDate === targetDate || a.targetDate === targetDate)
    .map(a => a.facultyId);

  // Find subject conduction metrics to evaluate syllabus deficits
  const conductionMap = {};
  if (Array.isArray(MOCK_DATABASE.courseConduction)) {
    MOCK_DATABASE.courseConduction.forEach(cc => {
      conductionMap[cc.subjectCode] = cc;
    });
  }

  // Teacher subjects map from base timetable
  const teacherSubjectsMap = {};
  MOCK_DATABASE.baseTimetable.forEach(b => {
    if (!teacherSubjectsMap[b.facultyId]) teacherSubjectsMap[b.facultyId] = new Set();
    teacherSubjectsMap[b.facultyId].add(b.subjectCode);
  });

  // Candidate pool: All active teachers except the absent teacher
  const allTeachers = MOCK_DATABASE.users.filter(u => u.role === 'teacher' && u.id !== session.facultyId);

  // Dynamic Institutional Scoring Weights (from System Settings / Supabase)
  const weights = (MOCK_DATABASE.systemSettings && MOCK_DATABASE.systemSettings.engineScoringWeights) || {
    freeSlot: 40,
    subjectExpertise: 35,
    syllabusCatchUp: 15,
    workloadFairness: 10
  };
  const wFree = Number(weights.freeSlot) || 40;
  const wSubj = Number(weights.subjectExpertise) || 35;
  const wSyllabus = Number(weights.syllabusCatchUp) || 15;
  const wFairness = Number(weights.workloadFairness) || 10;
  const maxPossibleScore = wFree + wSubj + wSyllabus + wFairness + 5;

  const scoredCandidates = allTeachers.map(teacher => {
    const isBusy = busyInBase.includes(teacher.id) || busyInOverrides.includes(teacher.id);
    const isAbsent = absentFacultyIds.includes(teacher.id) || teacher.attendanceStatus === 'absent';
    const isFree = !isBusy && !isAbsent;

    let score = isFree ? wFree : 0;
    const badges = [];
    const penaltyReasons = [];

    if (isFree) {
      badges.push({ text: `Free in Period ${session.period}`, type: 'success', pts: `+${wFree}` });
    } else if (isAbsent) {
      penaltyReasons.push('Faculty is marked absent on this date');
    } else {
      penaltyReasons.push(`Occupied teaching in Period ${session.period}`);
    }

    // --- Factor 2: Same Subject or Domain Specialization ---
    const taughtSubjects = teacherSubjectsMap[teacher.id] || new Set();
    const teachesSameSubject = taughtSubjects.has(session.subjectCode);
    const specLower = (teacher.specialization || teacher.roleTitle || '').toLowerCase();
    const subjNameLower = (session.subjectName || '').toLowerCase();
    const isChemistry = subjNameLower.includes('chem') && specLower.includes('chem');
    const isMaths = subjNameLower.includes('math') && specLower.includes('math');
    const isCoding = (subjNameLower.includes('program') || subjNameLower.includes('pps')) && (specLower.includes('program') || specLower.includes('pps') || specLower.includes('computing'));
    const isElectronics = subjNameLower.includes('electr') && specLower.includes('electr');
    const isCyber = subjNameLower.includes('cyber') && specLower.includes('cyber');

    const domainSpecialist = isChemistry || isMaths || isCoding || isElectronics || isCyber;

    if (teachesSameSubject) {
      score += wSubj;
      badges.push({ text: `Same Subject Faculty (${session.subjectCode})`, type: 'primary', pts: `+${wSubj}` });
    } else if (domainSpecialist) {
      const domainPts = Math.round(wSubj * 0.8);
      score += domainPts;
      badges.push({ text: `Domain Specialist (${teacher.specialization || 'Allied Field'})`, type: 'primary', pts: `+${domainPts}` });
    }

    // --- Factor 3: Syllabus Conduction Deficit (Lagging Subject Catch-up) ---
    // If the candidate's subject has held fewer classes than target, giving them this slot
    // allows a bonus lecture to catch up syllabus progress!
    let deficitEligible = false;
    let deficitCourse = null;
    taughtSubjects.forEach(code => {
      const metric = conductionMap[code];
      if (metric) {
        const pct = (metric.regularConducted / metric.totalScheduled) * 100;
        if (pct < 98) {
          deficitEligible = true;
          deficitCourse = { code, pct: Math.round(pct) };
        }
      }
    });

    if (deficitEligible && deficitCourse) {
      score += wSyllabus;
      badges.push({ text: `Syllabus Catch-Up Ready (${deficitCourse.code} at ${deficitCourse.pct}%)`, type: 'amber', pts: `+${wSyllabus}` });
    }

    // --- Factor 4: Substitution Workload Fairness ---
    const subsCount = teacher.substitutions30d || 0;
    if (subsCount === 0) {
      score += wFairness;
      badges.push({ text: `Balanced Workload (0 recent subs)`, type: 'neutral', pts: `+${wFairness}` });
    } else if (subsCount === 1) {
      const halfFair = Math.round(wFairness * 0.5);
      score += halfFair;
      badges.push({ text: `Moderate Load (1 recent sub)`, type: 'neutral', pts: `+${halfFair}` });
    } else {
      penaltyReasons.push(`High sub burden (${subsCount} substitutions this month)`);
    }

    // --- Factor 5: Same Department Affinity ---
    if (teacher.departmentId === session.deptId) {
      score += 5;
      badges.push({ text: `Same Department (${teacher.departmentName || 'Applied Sciences'})`, type: 'dept', pts: '+5' });
    }

    // Normalized Match Rating (65% to 99% for free candidates)
    const matchPercentage = isFree ? Math.min(99, Math.max(65, Math.round((score / maxPossibleScore) * 100))) : Math.min(30, Math.round((score / maxPossibleScore) * 100));

    // Dynamic Human-Readable Justification
    let justification = '';
    if (!isFree) {
      justification = penaltyReasons.join(', ') || 'Unavailable for this time slot.';
    } else if (teachesSameSubject || domainSpecialist) {
      justification = `${teacher.fullName} is 100% free in Period ${session.period} and is a certified Subject Specialist, preserving classroom syllabus continuity with zero clash.`;
    } else if (deficitEligible) {
      justification = `${teacher.fullName} is free in Period ${session.period} and can utilize this lecture block for syllabus catch-up in ${deficitCourse?.code || 'their course'}.`;
    } else {
      justification = `${teacher.fullName} has a free window in Period ${session.period} with a low monthly substitution load (${subsCount} recent substitutions).`;
    }

    // Tier badge
    let rankTier = 'Available';
    if (isFree) {
      if (matchPercentage >= 90) rankTier = 'Prime Replacement (★★★★★)';
      else if (matchPercentage >= 80) rankTier = 'Strong Alternative (★★★★☆)';
      else rankTier = 'Qualified Free Faculty (★★★☆☆)';
    } else {
      rankTier = 'Clash / Busy';
    }

    return {
      teacher,
      isFree,
      isBusy,
      isAbsent,
      score,
      matchPercentage,
      rankTier,
      badges,
      penaltyReasons,
      teachesSameSubject,
      domainSpecialist,
      deficitEligible,
      justification
    };
  });

  // Sort candidates:
  // 1. Free candidates first
  // 2. Highest match score first
  // 3. Lowest substitutions count
  scoredCandidates.sort((a, b) => {
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return (a.teacher.substitutions30d || 0) - (b.teacher.substitutions30d || 0);
  });

  return scoredCandidates;
}

