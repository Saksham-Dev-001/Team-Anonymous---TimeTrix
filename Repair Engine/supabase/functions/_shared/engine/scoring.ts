// File: /supabase/functions/_shared/engine/scoring.ts
// Pure Deterministic Scoring System for Candidate Options

import { CandidateFaculty, RepairCandidateOption } from './types.ts';

export function scoreSubstituteOption(
  faculty: CandidateFaculty,
  isSameDept: boolean,
  createsStudentGap: boolean
): { score: number; breakdown: RepairCandidateOption['scoreBreakdown'] } {
  // Weights (Default: 40 expertise, 20 same-dept, 15 workload, 15 no-gap, 10 minimal-change)
  let expertiseScore = 0;
  if (faculty.expertiseLevel === 'primary') expertiseScore = 40;
  else if (faculty.expertiseLevel === 'secondary') expertiseScore = 25;
  else if (faculty.expertiseLevel === 'can_cover') expertiseScore = 15;

  const deptScore = isSameDept ? 20 : 5;

  // Workload balance: lower past 30 days substitutions = higher score
  const loadPenalty = Math.min(15, faculty.substitutionsLast30Days * 2.5);
  const workloadScore = Math.max(0, 15 - loadPenalty);

  const gapScore = createsStudentGap ? 0 : 15;
  const minimalChangeScore = 10; // Direct substitute requires no slot relocation

  const totalScore = expertiseScore + deptScore + workloadScore + gapScore + minimalChangeScore;

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      subjectExpertise: expertiseScore,
      sameDepartment: deptScore,
      workloadBalance: workloadScore,
      noStudentGap: gapScore,
      minimalChange: minimalChangeScore
    }
  };
}

