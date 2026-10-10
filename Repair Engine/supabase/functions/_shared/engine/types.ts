// File: /supabase/functions/_shared/engine/types.ts
// Pure Engine Types and Data Contracts

export interface EngineSession {
  entryId: string;
  sessionDate: string; // YYYY-MM-DD
  weekday: number;
  startPeriod: number;
  lengthInPeriods: number;
  subjectId: string;
  subjectCode: string;
  originalFacultyId: string;
  roomId: string;
  batchIds: string[];
  isLab: boolean;
}

export interface CandidateFaculty {
  id: string;
  fullName: string;
  departmentId: string;
  expertiseLevel: 'primary' | 'secondary' | 'can_cover';
  currentDailyPeriods: number;
  maxDailyPeriods: number;
  currentWeeklyPeriods: number;
  maxWeeklyPeriods: number;
  substitutionsLast30Days: number;
  isFreeInPeriod: boolean;
}

export interface RepairCandidateOption {
  optionKind: 'substitute' | 'swap' | 'reschedule' | 'merge' | 'self_study';
  substituteFacultyId?: string;
  newRoomId?: string;
  newDate?: string;
  newStartPeriod?: number;
  score: number;
  scoreBreakdown: {
    subjectExpertise: number;
    sameDepartment: number;
    workloadBalance: number;
    noStudentGap: number;
    minimalChange: number;
  };
  passedChecks: string[];
  explanation: string;
  rank: number;
}

