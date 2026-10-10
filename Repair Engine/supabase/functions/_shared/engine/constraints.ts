// File: /supabase/functions/_shared/engine/constraints.ts
// Pure Deterministic Constraint Verification Engine (Zero Clashes Guaranteed)

import { EngineSession, CandidateFaculty } from './types.ts';

export interface RoomSlot {
  roomId: string;
  roomType: string;
  capacity: number;
  isAvailable: boolean;
}

export interface HardCheckResult {
  passed: boolean;
  violations: string[];
  passedChecks: string[];
}

export function validateSubstituteConstraints(
  session: EngineSession,
  faculty: CandidateFaculty,
  batchStrengths: number,
  allocatedRoom: RoomSlot,
  isHoliday: boolean
): HardCheckResult {
  const violations: string[] = [];
  const passedChecks: string[] = [];

  // Check 1: Holiday validation
  if (isHoliday) {
    violations.push('Target session falls on an academic holiday.');
  } else {
    passedChecks.push('Target date is an active academic working day.');
  }

  // Check 2: Faculty free in targeted period
  if (!faculty.isFreeInPeriod) {
    violations.push(`Faculty ${faculty.fullName} is already scheduled or unavailable in period ${session.startPeriod}.`);
  } else {
    passedChecks.push(`Faculty ${faculty.fullName} has zero conflicting bookings in period ${session.startPeriod}.`);
  }

  // Check 3: Faculty daily workload limit
  if (faculty.currentDailyPeriods + session.lengthInPeriods > faculty.maxDailyPeriods) {
    violations.push(`Daily period limit exceeded: faculty currently at ${faculty.currentDailyPeriods}/${faculty.maxDailyPeriods} periods.`);
  } else {
    passedChecks.push(`Workload permitted: ${faculty.currentDailyPeriods + session.lengthInPeriods}/${faculty.maxDailyPeriods} daily periods.`);
  }

  // Check 4: Faculty weekly workload limit
  if (faculty.currentWeeklyPeriods + session.lengthInPeriods > faculty.maxWeeklyPeriods) {
    violations.push(`Weekly period limit exceeded: faculty currently at ${faculty.currentWeeklyPeriods}/${faculty.maxWeeklyPeriods} periods.`);
  } else {
    passedChecks.push(`Weekly limit preserved: ${faculty.currentWeeklyPeriods + session.lengthInPeriods}/${faculty.maxWeeklyPeriods} periods.`);
  }

  // Check 5: Room capacity
  if (allocatedRoom.capacity < batchStrengths) {
    violations.push(`Room ${allocatedRoom.roomId} capacity (${allocatedRoom.capacity}) is less than batch size (${batchStrengths}).`);
  } else {
    passedChecks.push(`Room capacity sufficient (${allocatedRoom.capacity} seats for ${batchStrengths} students).`);
  }

  // Check 6: Room availability & maintenance flag
  if (!allocatedRoom.isAvailable) {
    violations.push(`Room ${allocatedRoom.roomId} is currently flagged as unavailable or under maintenance.`);
  } else {
    passedChecks.push(`Room ${allocatedRoom.roomId} is operational and unflagged.`);
  }

  // Check 7: Lab session specialized qualification
  if (session.isLab && faculty.expertiseLevel === 'can_cover') {
    violations.push('Lab blocks require primary or secondary lab-qualified faculty.');
  } else if (session.isLab) {
    passedChecks.push('Faculty has primary/secondary qualification for laboratory blocks.');
  }

  return {
    passed: violations.length === 0,
    violations,
    passedChecks
  };
}

