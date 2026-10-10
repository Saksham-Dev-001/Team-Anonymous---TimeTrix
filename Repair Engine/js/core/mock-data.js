// File: /js/core/mock-data.js
// Sri Balaji College of Engg & Technology, Jaipur
// Production Academic Timetable & Faculty Master Database (B.Tech I Sem 2026-27)

export const MOCK_DATABASE = {
  // College Information
  institution: {
    name: 'Sri Balaji College of Engg & Technology, Jaipur',
    semester: 'B.Tech I Sem',
    academicYear: '2026-27',
    effectiveDate: '17/08/2026'
  },

  // Academic Departments (B.Tech Only Hierarchy)
  departments: [
    {
      id: 'dept-as',
      code: 'ASH (1st Year)',
      name: 'Applied Science & Humanities Department',
      academicScope: 'Full 1st Year B.Tech (All Branches: CSE, CS, AI, DS, Civil, Mech, EE)',
      hodId: 'u-hod-ash',
      hodName: 'Dr. Syed Firoz Haider',
      hodAcademicId: 'HOD-FIROZ',
      email: 'hod.firoz@sribalaji.edu'
    },
    {
      id: 'dept-civil',
      code: 'CIVIL (2nd-4th Yr)',
      name: 'Civil Engineering Department',
      academicScope: '2nd, 3rd & 4th Year B.Tech (Civil)',
      hodId: 'u-hod-civil',
      hodName: 'Dr. Rajeshwar Sharma',
      hodAcademicId: 'HOD-CIVIL',
      email: 'hod.civil@sribalaji.edu'
    },
    {
      id: 'dept-me',
      code: 'MECH (2nd-4th Yr)',
      name: 'Mechanical Engineering Department',
      academicScope: '2nd, 3rd & 4th Year B.Tech (Mechanical)',
      hodId: 'u-hod-mech',
      hodName: 'Dr. Ramesh Verma',
      hodAcademicId: 'HOD-MECH',
      email: 'hod.mech@sribalaji.edu'
    },
    {
      id: 'dept-ee',
      code: 'EE (2nd-4th Yr)',
      name: 'Electrical Engineering Department',
      academicScope: '2nd, 3rd & 4th Year B.Tech (Electrical)',
      hodId: 'u-hod-ee',
      hodName: 'Dr. Mahendra Soni',
      hodAcademicId: 'HOD-EE',
      email: 'hod.ee@sribalaji.edu'
    },
    {
      id: 'dept-cse',
      code: 'CSE (2nd-4th Yr)',
      name: 'Computer Science & Engineering Department',
      academicScope: '2nd, 3rd & 4th Year B.Tech (CSE)',
      hodId: 'u-hod-cse',
      hodName: 'Dr. Pankaj Meel',
      hodAcademicId: 'HOD-CSE',
      email: 'hod.cse@sribalaji.edu'
    }
  ],

  // System Users Across Roles
  users: [
    // 1. Central Administration (Super Admin)
    {
      id: 'u-admin',
      academicId: 'ADM-2026',
      fullName: 'Dr. K. S. Mukherjee',
      email: 'principal@sribalaji.edu',
      role: 'super_admin',
      roleTitle: 'College Admin Office (Principal)',
      departmentId: null,
      departmentName: 'Central Administration Office'
    },

    // 2. Department Heads (5 B.Tech HODs)
    {
      id: 'u-hod-ash',
      academicId: 'HOD-FIROZ',
      fullName: 'Dr. Syed Firoz Haider',
      email: 'hod.firoz@sribalaji.edu',
      role: 'hod',
      roleTitle: 'HOD — Applied Science & Humanities Department',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities Department',
      designation: 'HOD & Associate Professor',
      specialization: 'Digital Electronics & Applied Sciences'
    },
    {
      id: 'u-hod-civil',
      academicId: 'HOD-CIVIL',
      fullName: 'Dr. Rajeshwar Sharma',
      email: 'hod.civil@sribalaji.edu',
      role: 'hod',
      roleTitle: 'HOD — Civil Engg. (2nd, 3rd, 4th Year)',
      departmentId: 'dept-civil',
      departmentName: 'Civil Engineering Department',
      designation: 'HOD & Professor',
      specialization: 'Structural Engineering'
    },
    {
      id: 'u-hod-mech',
      academicId: 'HOD-MECH',
      fullName: 'Dr. Ramesh Verma',
      email: 'hod.mech@sribalaji.edu',
      role: 'hod',
      roleTitle: 'HOD — Mechanical Engg. (2nd, 3rd, 4th Year)',
      departmentId: 'dept-me',
      departmentName: 'Mechanical Engineering Department',
      designation: 'HOD & Professor',
      specialization: 'Thermal & Production Systems'
    },
    {
      id: 'u-hod-ee',
      academicId: 'HOD-EE',
      fullName: 'Dr. Mahendra Soni',
      email: 'hod.ee@sribalaji.edu',
      role: 'hod',
      roleTitle: 'HOD — Electrical Engg. (2nd, 3rd, 4th Year)',
      departmentId: 'dept-ee',
      departmentName: 'Electrical Engineering Department',
      designation: 'HOD & Professor',
      specialization: 'Power Systems & Control'
    },
    {
      id: 'u-hod-cse',
      academicId: 'HOD-CSE',
      fullName: 'Dr. Pankaj Meel',
      email: 'hod.cse@sribalaji.edu',
      role: 'hod',
      roleTitle: 'HOD — Computer Science & Engg. (2nd, 3rd, 4th Year)',
      departmentId: 'dept-cse',
      departmentName: 'Computer Science & Engineering Department',
      designation: 'HOD & Associate Professor',
      specialization: 'Advanced Computing & Communication'
    },

    // 3. Department Faculty (Sri Balaji College Real Faculty List)
    // 1st Year Central Faculty (Applied Science & Humanities - All Branches)
    {
      id: 'f-astha',
      academicId: 'FAC-102',
      fullName: 'Dr. Aastha Pareek',
      email: 'aastha.pareek@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Chemistry & Lab',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Associate Professor',
      maxDaily: 5,
      maxWeekly: 22,
      substitutions30d: 1,
      attendanceStatus: 'present'
    },
    {
      id: 'f-vishal-ch',
      academicId: 'FAC-101',
      fullName: 'Dr. Vishal Saxena',
      email: 'vishal.saxena@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Engineering Chemistry',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Associate Professor',
      specialization: 'Engineering Chemistry & Material Science',
      maxDaily: 5,
      maxWeekly: 22,
      substitutions30d: 0,
      attendanceStatus: 'present'
    },
    {
      id: 'f-khan',
      academicId: 'FAC-103',
      fullName: 'Dr. A. H. Khan',
      email: 'ah.khan@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Engg. Mathematics (Sec A & B)',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Professor',
      maxDaily: 5,
      maxWeekly: 22,
      substitutions30d: 0,
      attendanceStatus: 'present'
    },
    {
      id: 'f-happy',
      academicId: 'FAC-104',
      fullName: 'Mr. Happy Dabla',
      email: 'happy.dabla@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Digital Electronics (Sec A)',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Assistant Professor',
      maxDaily: 5,
      maxWeekly: 20,
      substitutions30d: 2,
      attendanceStatus: 'present'
    },
    {
      id: 'f-haider',
      academicId: 'FAC-105',
      fullName: 'Dr. Syed Firoz Haider',
      email: 'firoz.haider@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Digital Electronics (Sec B)',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Associate Professor',
      maxDaily: 5,
      maxWeekly: 20,
      substitutions30d: 1,
      attendanceStatus: 'present'
    },
    {
      id: 'f-sikander',
      academicId: 'FAC-106',
      fullName: 'Mr. Sikander Khan',
      email: 'sikander.khan@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Cyber Security & PPS Lab',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Assistant Professor',
      maxDaily: 6,
      maxWeekly: 24,
      substitutions30d: 0,
      attendanceStatus: 'present'
    },
    {
      id: 'f-toofan',
      academicId: 'FAC-107',
      fullName: 'Mr. Toofan Mukharjee',
      email: 'toofan.m@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Cyber Security (Sec B)',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Assistant Professor',
      maxDaily: 5,
      maxWeekly: 20,
      substitutions30d: 0,
      attendanceStatus: 'present'
    },
    {
      id: 'f-vikas',
      academicId: 'FAC-108',
      fullName: 'Mr. Vikas Singh',
      email: 'vikas.singh@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Programming (PPS)',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Assistant Professor',
      maxDaily: 5,
      maxWeekly: 22,
      substitutions30d: 1,
      attendanceStatus: 'present'
    },
    {
      id: 'f-vijay',
      academicId: 'FAC-109',
      fullName: 'Mr. Vijay Sharma',
      email: 'vijay.sharma@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — PPS Lab Practicum',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Assistant Professor',
      maxDaily: 5,
      maxWeekly: 18,
      substitutions30d: 0,
      attendanceStatus: 'present'
    },
    {
      id: 'f-nisha',
      academicId: 'FAC-110',
      fullName: 'Dr. Nisha Poonia',
      email: 'nisha.poonia@sribalaji.edu',
      role: 'teacher',
      roleTitle: 'Faculty — Comm. Skills Lab',
      departmentId: 'dept-as',
      departmentName: 'Applied Science & Humanities (1st Year)',
      designation: 'Assistant Professor',
      maxDaily: 5,
      maxWeekly: 18,
      substitutions30d: 0,
      attendanceStatus: 'present'
    }
  ],

  // Classrooms & Facilities
  rooms: [
    { id: 'r-sl1', code: 'SL1', name: 'Classroom SL1 (Section A)', capacity: 70, type: 'lecture' },
    { id: 'r-sl4', code: 'SL-4', name: 'Classroom SL-4 (Section B)', capacity: 70, type: 'lecture' },
    { id: 'r-chemlab', code: 'CHEM-LAB', name: 'Engineering Chemistry Lab', capacity: 40, type: 'lab' },
    { id: 'r-cslab', code: 'CS-LAB', name: 'Communication Skills Lab', capacity: 40, type: 'lab' },
    { id: 'r-ppslab', code: 'PPS-LAB', name: 'PPS Programming Lab', capacity: 45, type: 'lab' },
    { id: 'r-lib', code: 'LIB', name: 'Central College Library', capacity: 120, type: 'library' },
    { id: 'r-eca', code: 'ARENA', name: 'ECA Activity Center', capacity: 150, type: 'activity' }
  ],

  // Academic Batches
  batches: [
    { id: 'b-sec-a', deptId: 'dept-as', name: 'Section A (CSE & CS)', roomCode: 'SL1', strength: 62 },
    { id: 'b-sec-b', deptId: 'dept-as', name: 'Section B (AI & DS)', roomCode: 'SL-4', strength: 58 }
  ],

  // Official Bell Timetable Periods (Exact from College Schedule)
  bellSchedule: [
    { period: 1, startTime: '09:35', endTime: '10:30', timeSlot: '9:35am - 10:30am', label: 'Period I' },
    { period: 2, startTime: '10:30', endTime: '11:25', timeSlot: '10:30am - 11:25am', label: 'Period II' },
    { period: 3, startTime: '11:25', endTime: '12:20', timeSlot: '11:25am - 12:20pm', label: 'Period III' },
    { period: 4, startTime: '12:20', endTime: '13:10', timeSlot: '12:20pm - 1:10pm', label: 'Period IV' },
    { period: 'break', startTime: '13:10', endTime: '13:45', timeSlot: '1:10pm - 1:45pm', label: 'LUNCH BREAK' },
    { period: 5, startTime: '13:45', endTime: '14:35', timeSlot: '1:45pm - 2:35pm', label: 'Period V' },
    { period: 6, startTime: '14:35', endTime: '15:25', timeSlot: '2:35pm - 3:25pm', label: 'Period VI' }
  ],

  // Complete Recurring Timetable Matrix (Section A & Section B)
  baseTimetable: [
    // =========================================================================
    // SECTION A (CSE & CS) — CLASSROOM SL1
    // =========================================================================

    // --- MONDAY (Sec A) ---
    { entryId: 'sa-mon-1', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 1, period: 1, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-mon-2', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 1, period: 2, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-mon-3', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 1, period: 3, subjectCode: 'CS101', subjectName: 'Programming for Problem Solving', facultyId: 'f-vikas', facultyName: 'Mr. Vikas Singh', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-mon-4', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 1, period: 4, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sa-mon-5', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 1, period: 5, subjectCode: 'LAB-A1', subjectName: 'A1: Chemistry Lab / A2: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },
    { entryId: 'sa-mon-6', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 1, period: 6, subjectCode: 'LAB-A1', subjectName: 'A1: Chemistry Lab / A2: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },

    // --- TUESDAY (Sec A) ---
    { entryId: 'sa-tue-1', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 2, period: 1, subjectCode: 'EC101', subjectName: 'Digital Electronics', facultyId: 'f-happy', facultyName: 'Mr. Happy Dabla', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-tue-2', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 2, period: 2, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-tue-3', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 2, period: 3, subjectCode: 'CS101', subjectName: 'Programming for Problem Solving', facultyId: 'f-vikas', facultyName: 'Mr. Vikas Singh', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-tue-4', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 2, period: 4, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sa-tue-5', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 2, period: 5, subjectCode: 'LAB-A2', subjectName: 'A2: Chemistry Lab / A1: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },
    { entryId: 'sa-tue-6', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 2, period: 6, subjectCode: 'LAB-A2', subjectName: 'A2: Chemistry Lab / A1: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },

    // --- WEDNESDAY (Sec A) ---
    { entryId: 'sa-wed-1', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 3, period: 1, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-wed-2', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 3, period: 2, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sa-wed-3', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 3, period: 3, subjectCode: 'CY101', subjectName: 'Cyber Security & Ethical Hacking', facultyId: 'f-sikander', facultyName: 'Mr. Sikander Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-wed-4', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 3, period: 4, subjectCode: 'EC101', subjectName: 'Digital Electronics', facultyId: 'f-happy', facultyName: 'Mr. Happy Dabla', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-wed-5', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 3, period: 5, subjectCode: 'HU101', subjectName: 'Communication Skills', facultyId: 'f-nisha', facultyName: 'Dr. Nisha Poonia', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-wed-6', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 3, period: 6, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },

    // --- THURSDAY (Sec A) ---
    { entryId: 'sa-thu-1', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 4, period: 1, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-thu-2', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 4, period: 2, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-thu-3', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 4, period: 3, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sa-thu-4', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 4, period: 4, subjectCode: 'CY101', subjectName: 'Cyber Security & Ethical Hacking', facultyId: 'f-sikander', facultyName: 'Mr. Sikander Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-thu-5', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 4, period: 5, subjectCode: 'HU101', subjectName: 'Communication Skills', facultyId: 'f-nisha', facultyName: 'Dr. Nisha Poonia', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-thu-6', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 4, period: 6, subjectCode: 'EC101', subjectName: 'Digital Electronics', facultyId: 'f-happy', facultyName: 'Mr. Happy Dabla', roomId: 'r-sl1', roomCode: 'SL1' },

    // --- FRIDAY (Sec A) ---
    { entryId: 'sa-fri-1', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 5, period: 1, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-fri-2', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 5, period: 2, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sa-fri-3', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 5, period: 3, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-fri-4', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 5, period: 4, subjectCode: 'HU101', subjectName: 'Communication Skills', facultyId: 'f-nisha', facultyName: 'Dr. Nisha Poonia', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-fri-5', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 5, period: 5, subjectCode: 'LAB-PPS', subjectName: 'A1: PPS Lab / A2: PPS Lab', facultyId: 'f-vijay', facultyName: 'Mr. Vijay Sharma & Mr. Sikander Khan', roomId: 'r-ppslab', roomCode: 'PPS-LAB' },
    { entryId: 'sa-fri-6', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 5, period: 6, subjectCode: 'LAB-PPS', subjectName: 'A1: PPS Lab / A2: PPS Lab', facultyId: 'f-vijay', facultyName: 'Mr. Vijay Sharma & Mr. Sikander Khan', roomId: 'r-ppslab', roomCode: 'PPS-LAB' },

    // --- SATURDAY (Sec A) ---
    { entryId: 'sa-sat-1', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 6, period: 1, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-sat-2', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 6, period: 2, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-sat-3', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 6, period: 3, subjectCode: 'CS101', subjectName: 'Programming for Problem Solving', facultyId: 'f-vikas', facultyName: 'Mr. Vikas Singh', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-sat-4', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 6, period: 4, subjectCode: 'CY101', subjectName: 'Cyber Security & Ethical Hacking', facultyId: 'f-sikander', facultyName: 'Mr. Sikander Khan', roomId: 'r-sl1', roomCode: 'SL1' },
    { entryId: 'sa-sat-5', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 6, period: 5, subjectCode: 'ECA', subjectName: 'Extra Curricular Activities', facultyId: null, facultyName: 'Faculty In-Charge', roomId: 'r-eca', roomCode: 'ARENA' },
    { entryId: 'sa-sat-6', batchId: 'b-sec-a', batchName: 'Section A (CSE & CS)', deptId: 'dept-as', weekday: 6, period: 6, subjectCode: 'ECA', subjectName: 'Extra Curricular Activities', facultyId: null, facultyName: 'Faculty In-Charge', roomId: 'r-eca', roomCode: 'ARENA' },


    // =========================================================================
    // SECTION B (AI & DS) — CLASSROOM SL-4
    // =========================================================================

    // --- MONDAY (Sec B) ---
    { entryId: 'sb-mon-1', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 1, period: 1, subjectCode: 'CY101', subjectName: 'Cyber Security & Ethical Hacking', facultyId: 'f-toofan', facultyName: 'Mr. Toofan Mukharjee', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-mon-2', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 1, period: 2, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-mon-3', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 1, period: 3, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sb-mon-4', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 1, period: 4, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-mon-5', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 1, period: 5, subjectCode: 'HU101', subjectName: 'Communication Skills', facultyId: 'f-nisha', facultyName: 'Dr. Nisha Poonia', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-mon-6', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 1, period: 6, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },

    // --- TUESDAY (Sec B) ---
    { entryId: 'sb-tue-1', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 2, period: 1, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-tue-2', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 2, period: 2, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-tue-3', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 2, period: 3, subjectCode: 'LAB-B1', subjectName: 'B1: Chemistry Lab / B2: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },
    { entryId: 'sb-tue-4', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 2, period: 4, subjectCode: 'LAB-B1', subjectName: 'B1: Chemistry Lab / B2: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },
    { entryId: 'sb-tue-5', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 2, period: 5, subjectCode: 'HU101', subjectName: 'Communication Skills', facultyId: 'f-nisha', facultyName: 'Dr. Nisha Poonia', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-tue-6', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 2, period: 6, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },

    // --- WEDNESDAY (Sec B) ---
    { entryId: 'sb-wed-1', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 3, period: 1, subjectCode: 'EC101', subjectName: 'Digital Electronics', facultyId: 'f-haider', facultyName: 'Dr. Syed Firoz Haider', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-wed-2', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 3, period: 2, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-wed-3', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 3, period: 3, subjectCode: 'CS101', subjectName: 'Programming for Problem Solving', facultyId: 'f-vikas', facultyName: 'Mr. Vikas Singh', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-wed-4', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 3, period: 4, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-wed-5', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 3, period: 5, subjectCode: 'LAB-PPS', subjectName: 'B1: PPS Lab / B2: PPS Lab', facultyId: 'f-vijay', facultyName: 'Mr. Vijay Sharma & Mr. Sikander Khan', roomId: 'r-ppslab', roomCode: 'PPS-LAB' },
    { entryId: 'sb-wed-6', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 3, period: 6, subjectCode: 'LAB-PPS', subjectName: 'B1: PPS Lab / B2: PPS Lab', facultyId: 'f-vijay', facultyName: 'Mr. Vijay Sharma & Mr. Sikander Khan', roomId: 'r-ppslab', roomCode: 'PPS-LAB' },

    // --- THURSDAY (Sec B) ---
    { entryId: 'sb-thu-1', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 4, period: 1, subjectCode: 'CY101', subjectName: 'Cyber Security & Ethical Hacking', facultyId: 'f-toofan', facultyName: 'Mr. Toofan Mukharjee', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-thu-2', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 4, period: 2, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sb-thu-3', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 4, period: 3, subjectCode: 'CS101', subjectName: 'Programming for Problem Solving', facultyId: 'f-vikas', facultyName: 'Mr. Vikas Singh', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-thu-4', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 4, period: 4, subjectCode: 'EC101', subjectName: 'Digital Electronics', facultyId: 'f-haider', facultyName: 'Dr. Syed Firoz Haider', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-thu-5', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 4, period: 5, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sb-thu-6', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 4, period: 6, subjectCode: 'HU101', subjectName: 'Communication Skills', facultyId: 'f-nisha', facultyName: 'Dr. Nisha Poonia', roomId: 'r-sl4', roomCode: 'SL-4' },

    // --- FRIDAY (Sec B) ---
    { entryId: 'sb-fri-1', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 5, period: 1, subjectCode: 'EC101', subjectName: 'Digital Electronics', facultyId: 'f-haider', facultyName: 'Dr. Syed Firoz Haider', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-fri-2', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 5, period: 2, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sb-fri-3', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 5, period: 3, subjectCode: 'CS101', subjectName: 'Programming for Problem Solving', facultyId: 'f-vikas', facultyName: 'Mr. Vikas Singh', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-fri-4', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 5, period: 4, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-fri-5', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 5, period: 5, subjectCode: 'LAB-B2', subjectName: 'B2: Chemistry Lab / B1: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },
    { entryId: 'sb-fri-6', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 5, period: 6, subjectCode: 'LAB-B2', subjectName: 'B2: Chemistry Lab / B1: Comm. Skills Lab', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek & Dr. Nisha Poonia', roomId: 'r-chemlab', roomCode: 'CHEM/CS-LAB' },

    // --- SATURDAY (Sec B) ---
    { entryId: 'sb-sat-1', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 6, period: 1, subjectCode: 'MA101', subjectName: 'Engg. Mathematics', facultyId: 'f-khan', facultyName: 'Dr. A. H. Khan', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-sat-2', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 6, period: 2, subjectCode: 'CY101', subjectName: 'Cyber Security & Ethical Hacking', facultyId: 'f-toofan', facultyName: 'Mr. Toofan Mukharjee', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-sat-3', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 6, period: 3, subjectCode: 'LIB', subjectName: 'Library / Self Study', facultyId: null, facultyName: 'Librarian', roomId: 'r-lib', roomCode: 'LIB' },
    { entryId: 'sb-sat-4', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 6, period: 4, subjectCode: 'CH101', subjectName: 'Engg. Chemistry', facultyId: 'f-astha', facultyName: 'Dr. Aastha Pareek', roomId: 'r-sl4', roomCode: 'SL-4' },
    { entryId: 'sb-sat-5', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 6, period: 5, subjectCode: 'ECA', subjectName: 'Extra Curricular Activities', facultyId: null, facultyName: 'Faculty In-Charge', roomId: 'r-eca', roomCode: 'ARENA' },
    { entryId: 'sb-sat-6', batchId: 'b-sec-b', batchName: 'Section B (AI & DS)', deptId: 'dept-as', weekday: 6, period: 6, subjectCode: 'ECA', subjectName: 'Extra Curricular Activities', facultyId: null, facultyName: 'Faculty In-Charge', roomId: 'r-eca', roomCode: 'ARENA' }
  ],

  // Live Overrides & Reparations
  sessionOverrides: [
    {
      id: 'ovr-demo-1',
      entryId: 'sb-mon-2',
      sessionDate: new Date().toISOString().split('T')[0],
      kind: 'substitute',
      status: 'confirmed',
      substituteFacultyId: 'u-hod-ash',
      substituteFacultyName: 'Dr. Syed Firoz Haider',
      originalFacultyId: 'f-astha',
      originalFacultyName: 'Dr. Aastha Pareek',
      period: 2,
      subjectCode: 'CH101',
      subjectName: 'Engg. Chemistry',
      roomCode: 'SL-4',
      batchName: 'Section B (AI & DS - 1st Year)',
      reason: 'Auto-Assigned Best Match (94% Match): Syllabus continuity coverage',
      appliedAt: new Date().toISOString(),
      isAutoAssigned: true
    }
  ],
  absences: [],
  repairCases: [],
  repairOptions: [],
  substitutionRequests: [],
  notifications: [
    {
      id: 'notif-init-duty',
      userId: 'u-hod-ash',
      type: 'substitution_assigned',
      title: '⚡ Substitution Duty: Period 2 (CH101)',
      body: 'You are assigned to cover Engg. Chemistry in room SL-4 for Dr. Aastha Pareek (Syllabus Continuity).',
      data: {
        entryId: 'sb-mon-2',
        date: new Date().toISOString().split('T')[0],
        originalFacultyId: 'f-astha',
        originalFacultyName: 'Dr. Aastha Pareek',
        period: 2,
        subjectCode: 'CH101',
        subjectName: 'Engg. Chemistry',
        roomCode: 'SL-4',
        batchName: 'Section B (AI & DS - 1st Year)',
        matchPercentage: 94
      },
      readAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-init-1',
      userId: 'all',
      type: 'system_alert',
      title: '⚡ Timetable Engine Online',
      body: 'TimeTrix Autonomous Repair Engine is actively monitoring faculty attendance.',
      readAt: null,
      createdAt: new Date().toISOString()
    }
  ],
  leaves: [
    {
      id: 'leave-101',
      teacherId: 'f-astha',
      teacherName: 'Dr. Aastha Pareek',
      departmentId: 'dept-cse',
      departmentName: 'Applied Sciences',
      leaveDate: '2026-10-12',
      leaveType: 'Academic Duty Leave',
      reason: 'Attending State Engineering Curriculum Workshop',
      status: 'pending',
      appliedAt: '2026-10-09T10:15:00.000Z'
    }
  ],

  // Course Conduction & Attendance Retention Metrics
  courseConduction: [
    {
      id: 'cc-1',
      subjectCode: 'CH101',
      subjectName: 'Engg. Chemistry',
      facultyName: 'Dr. Aastha Pareek',
      facultyId: 'f-astha',
      batch: 'Sec A (CSE & CS) & Sec B (AI & DS)',
      totalScheduled: 36,
      regularConducted: 35,
      substitutedConducted: 1,
      missedUnresolved: 0,
      targetPercent: 100.0
    },
    {
      id: 'cc-2',
      subjectCode: 'MA101',
      subjectName: 'Engg. Mathematics',
      facultyName: 'Dr. A. H. Khan / Dr. Vishal Saxena',
      facultyId: 'f-khan',
      batch: 'B.Tech I Sem (Sec A & Sec B)',
      totalScheduled: 34,
      regularConducted: 33,
      substitutedConducted: 1,
      missedUnresolved: 0,
      targetPercent: 100.0
    },
    {
      id: 'cc-3',
      subjectCode: 'CS101',
      subjectName: 'Programming for Problem Solving',
      facultyName: 'Mr. Vikas Singh',
      facultyId: 'f-vikas',
      batch: 'B.Tech I Sem (Sec A & Sec B)',
      totalScheduled: 30,
      regularConducted: 29,
      substitutedConducted: 1,
      missedUnresolved: 0,
      targetPercent: 100.0
    },
    {
      id: 'cc-4',
      subjectCode: 'EC101',
      subjectName: 'Digital Electronics',
      facultyName: 'Mr. Happy Dabla / Dr. Syed Firoz Haider',
      facultyId: 'f-happy',
      batch: 'B.Tech I Sem (Sec A & Sec B)',
      totalScheduled: 26,
      regularConducted: 26,
      substitutedConducted: 0,
      missedUnresolved: 0,
      targetPercent: 100.0
    },
    {
      id: 'cc-5',
      subjectCode: 'CY101',
      subjectName: 'Cyber Security & Ethical Hacking',
      facultyName: 'Mr. Sikander Khan / Mr. Toofan Mukharjee',
      facultyId: 'f-sikander',
      batch: 'B.Tech I Sem (Sec A & Sec B)',
      totalScheduled: 24,
      regularConducted: 24,
      substitutedConducted: 0,
      missedUnresolved: 0,
      targetPercent: 100.0
    },
    {
      id: 'cc-6',
      subjectCode: 'HU101',
      subjectName: 'Communication Skills',
      facultyName: 'Dr. Pankaj Meel',
      facultyId: 'u-hod-cse',
      batch: 'B.Tech I Sem (Sec A & Sec B)',
      totalScheduled: 22,
      regularConducted: 22,
      substitutedConducted: 0,
      missedUnresolved: 0,
      targetPercent: 100.0
    }
  ],

  // System Settings (Directly mapped to Supabase 'settings' table)
  systemSettings: {
    engineScoringWeights: {
      freeSlot: 40,
      subjectExpertise: 35,
      syllabusCatchUp: 15,
      workloadFairness: 10
    },
    timingConfig: {
      sameDayCutoffTime: '08:30',
      substitutionTimeoutMinutes: 15,
      maxDailySubstitutions: 2
    }
  }
};
