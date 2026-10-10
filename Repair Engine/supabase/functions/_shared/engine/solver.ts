// File: /supabase/functions/_shared/engine/solver.ts
// Pure Deterministic Solver Pipeline

import { EngineSession, CandidateFaculty, RepairCandidateOption } from './types.ts';
import { RoomSlot, validateSubstituteConstraints } from './constraints.ts';
import { scoreSubstituteOption } from './scoring.ts';

export function solveSessionRepairs(
  session: EngineSession,
  candidates: CandidateFaculty[],
  batchStrength: number,
  room: RoomSlot,
  isHoliday: boolean,
  sessionDeptId: string
): RepairCandidateOption[] {
  const options: RepairCandidateOption[] = [];

  // 1. Evaluate Direct Substitute Candidates
  for (const faculty of candidates) {
    const isSameDept = faculty.departmentId === sessionDeptId;
    const validation = validateSubstituteConstraints(session, faculty, batchStrength, room, isHoliday);

    if (validation.passed) {
      const { score, breakdown } = scoreSubstituteOption(faculty, isSameDept, false);
      const explanation = `${faculty.fullName} (${faculty.expertiseLevel} expertise) is free in period ${session.startPeriod}. Has covered ${faculty.substitutionsLast30Days} sessions in past 30 days. Zero student gaps created.`;

      options.push({
        optionKind: 'substitute',
        substituteFacultyId: faculty.id,
        score,
        scoreBreakdown: breakdown,
        passedChecks: validation.passedChecks,
        explanation,
        rank: 1 // Temporarily 1, ranked subsequently
      });
    }
  }

  // 2. Sort by score descending and assign deterministic ranks
  options.sort((a, b) => b.score - a.score);

  // 3. Fallback Option: Supervised Self-Study / Assignment Block
  options.push({
    optionKind: 'self_study',
    score: 25.0,
    scoreBreakdown: {
      subjectExpertise: 0,
      sameDepartment: 10,
      workloadBalance: 10,
      noStudentGap: 5,
      minimalChange: 0
    },
    passedChecks: [
      'Original classroom reserved',
      'Batch curriculum syllabus assignment logged'
    ],
    explanation: 'Self-study and assignment session in assigned room. Class flagged as self-study; no substitute faculty required.',
    rank: 99
  });

  // Assign final ranks 1, 2, 3...
  return options.slice(0, 3).map((opt, index) => ({
    ...opt,
    rank: index + 1
  }));
}

