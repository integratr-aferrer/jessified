export interface Employee {
  id: string;
  name: string;
}

export interface RawAttendanceRecord {
  timestamp: Date;
  employeeId: string;
  matchScore: string;
  direction: 'IN' | 'OUT';
  originalLine: string;
}

export interface ProcessedAttendance {
  date: string;
  employeeId: string;
  employeeName: string;
  timeIn: string | null;
  timeOut: string | null;
  matchScore: string; // Keep as string to preserve % or convert to number if needed
  status: 'Present' | 'Incomplete' | 'Absent';
}

// FaceCheck input format
export interface FaceCheckRecord {
  status: string;           // "success"
  timestamp: Date;          // parsed from "2026-02-24 07:31:55"
  employeeName: string;     // "Andrew Ferrer"
  recognitionInfo: string;  // "Default recogr Default"
  imageFilename: string;    // "18.jpeg"
}

// Payroll output format
export interface PayrollRecord {
  biometricId: string;      // Employee ID from mapping
  employeeName: string;     // Employee name
  time: string;             // "12/29/2025 8:00 AM"
  state: string;            // "" (empty) or "CHECK"
  newState: string;         // "" (empty)
  exception: string;        // "" (empty)
  operation: string;        // "" (empty)
}

// Date range filter
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}