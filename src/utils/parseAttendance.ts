import { Employee, ProcessedAttendance, RawAttendanceRecord, FaceCheckRecord, PayrollRecord, DateRange } from './types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export function parseRawData(input: string): RawAttendanceRecord[] {
  const lines = input.trim().split('\n');
  const records: RawAttendanceRecord[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Expected format: 2024-01-15 08:02:33 | ID:001 | MATCH:95.2% | IN
    const parts = line.split('|').map((p) => p.trim());

    if (parts.length >= 4) {
      try {
        const timestampStr = parts[0];
        const idPart = parts[1]; // ID:001
        const matchPart = parts[2]; // MATCH:95.2%
        const directionPart = parts[3].toUpperCase(); // IN or OUT

        const employeeId = idPart.replace('ID:', '').trim();
        const matchScore = matchPart.replace('MATCH:', '').trim();
        const direction = directionPart === 'IN' ? 'IN' : 'OUT';
        const timestamp = new Date(timestampStr);

        if (!isNaN(timestamp.getTime())) {
          records.push({
            timestamp,
            employeeId,
            matchScore,
            direction,
            originalLine: line
          });
        }
      } catch (e) {
        console.warn('Failed to parse line:', line, e);
      }
    }
  }

  return records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function processAttendance(
rawRecords: RawAttendanceRecord[],
employees: Employee[])
: ProcessedAttendance[] {
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]));
  const groupedByDateAndId = new Map<string, RawAttendanceRecord[]>();

  // Group records by "YYYY-MM-DD_ID"
  for (const record of rawRecords) {
    const dateKey = record.timestamp.toISOString().split('T')[0];
    const key = `${dateKey}_${record.employeeId}`;

    if (!groupedByDateAndId.has(key)) {
      groupedByDateAndId.set(key, []);
    }
    groupedByDateAndId.get(key)?.push(record);
  }

  const results: ProcessedAttendance[] = [];

  groupedByDateAndId.forEach((records, key) => {
    const [dateStr, employeeId] = key.split('_');

    // Find earliest IN and latest OUT
    const inRecords = records.filter((r) => r.direction === 'IN');
    const outRecords = records.filter((r) => r.direction === 'OUT');

    const firstIn =
    inRecords.length > 0 ?
    inRecords.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )[0] :
    null;

    const lastOut =
    outRecords.length > 0 ?
    outRecords.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0] :
    null;

    // Format times
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const timeIn = firstIn ? formatTime(firstIn.timestamp) : null;
    const timeOut = lastOut ? formatTime(lastOut.timestamp) : null;

    // Use match score from the IN record, or OUT record if IN is missing
    const matchScore = firstIn?.matchScore || lastOut?.matchScore || 'N/A';

    results.push({
      date: dateStr,
      employeeId,
      employeeName: employeeMap.get(employeeId) || 'Unknown',
      timeIn,
      timeOut,
      matchScore,
      status: timeIn && timeOut ? 'Present' : 'Incomplete'
    });
  });

  // Sort by date then employee ID
  return results.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.employeeId.localeCompare(b.employeeId);
  });
}

export function generateCSV(data: ProcessedAttendance[]): string {
  const headers = [
  'Date',
  'Employee ID',
  'Name',
  'Time In',
  'Time Out',
  'Match Score',
  'Status'];

  const rows = data.map((row) => [
  row.date,
  row.employeeId,
  row.employeeName,
  row.timeIn || '--:--:--',
  row.timeOut || '--:--:--',
  row.matchScore,
  row.status]
  );

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ===== NEW FACECHECK PARSERS =====

/**
 * Detect file format based on extension
 */
export function detectFileFormat(file: File): 'excel' | 'csv' {
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  return extension === '.csv' ? 'csv' : 'excel';
}

/**
 * Parse Excel file (.xlsx, .xls) from FaceCheck
 */
export async function parseExcelFile(file: File): Promise<FaceCheckRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const records: FaceCheckRecord[] = [];
        
        // Parse rows (skip empty rows)
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          
          // Skip empty rows or rows with insufficient data
          if (!row || row.length < 2) continue;
          
          // Only extract timestamp (column A, index 0) and name (column B, index 1)
          const timestampStr = row[0]?.toString().trim() || '';
          const employeeName = row[1]?.toString().trim() || '';
          
          // Skip if missing critical data
          if (!timestampStr || !employeeName) continue;
          
          // Skip rows that are clearly invalid (like just a number "6")
          if (timestampStr.length < 10 || employeeName.length < 2) continue;
          
          try {
            // Parse timestamp - FaceCheck format: "2026-02-24 07:31:55"
            const timestamp = parseTimestamp(timestampStr);
            
            if (!timestamp || isNaN(timestamp.getTime())) {
              console.warn(`Invalid timestamp on row ${i + 1}:`, timestampStr);
              continue;
            }
            
            records.push({
              status: '',
              timestamp,
              employeeName,
              recognitionInfo: '',
              imageFilename: ''
            });
          } catch (err) {
            console.warn(`Failed to parse row ${i + 1}:`, err);
            continue;
          }
        }
        
        resolve(records);
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + (err instanceof Error ? err.message : 'Unknown error')));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse CSV file from FaceCheck
 */
export async function parseCSVFile(file: File): Promise<FaceCheckRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const rawData: any[][] = results.data as any[][];
          const records: FaceCheckRecord[] = [];
          
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            
            if (!row || row.length < 2) continue;
            
            // Only extract timestamp (column A, index 0) and name (column B, index 1)
            const timestampStr = row[0]?.toString().trim() || '';
            const employeeName = row[1]?.toString().trim() || '';
            
            if (!timestampStr || !employeeName) continue;
            if (timestampStr.length < 10 || employeeName.length < 2) continue;
            
            try {
              const timestamp = parseTimestamp(timestampStr);
              
              if (!timestamp || isNaN(timestamp.getTime())) {
                console.warn(`Invalid timestamp on row ${i + 1}:`, timestampStr);
                continue;
              }
              
              records.push({
                status: '',
                timestamp,
                employeeName,
                recognitionInfo: '',
                imageFilename: ''
              });
            } catch (err) {
              console.warn(`Failed to parse row ${i + 1}:`, err);
              continue;
            }
          }
          
          resolve(records);
        } catch (err) {
          reject(new Error('Failed to parse CSV file: ' + (err instanceof Error ? err.message : 'Unknown error')));
        }
      },
      error: (error) => {
        reject(new Error('Failed to parse CSV: ' + error.message));
      }
    });
  });
}

/**
 * Parse timestamp string to Date object
 * Supports formats: "2026-02-24 07:31:55", "2026-02-24T07:31:55", etc.
 */
function parseTimestamp(timestampStr: string): Date {
  // Replace space with T for ISO format compatibility
  const isoStr = timestampStr.replace(' ', 'T');
  return new Date(isoStr);
}

/**
 * Normalize employee name for case-insensitive matching
 * Converts to lowercase, trims, and collapses multiple spaces
 */
export function normalizeEmployeeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get the next available numeric Biometric ID
 * If highest ID is "2", returns "3"
 * If IDs are non-numeric or mixed, starts from 1
 */
export function getNextAvailableId(existingEmployees: Employee[]): string {
  const numericIds = existingEmployees
    .map(emp => parseInt(emp.id))
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return '1';
  }
  
  const maxId = Math.max(...numericIds);
  return (maxId + 1).toString();
}

/**
 * Automatically add unmatched employees with sequential IDs
 * Returns: Array of newly added employees
 */
export function autoAddEmployees(
  unmatchedNames: string[], 
  existingEmployees: Employee[]
): Employee[] {
  const newEmployees: Employee[] = [];
  let currentEmployees = [...existingEmployees];
  
  // Get unique normalized names to prevent duplicates within the unmatched list
  const uniqueNames = new Map<string, string>();
  unmatchedNames.forEach(name => {
    const normalized = normalizeEmployeeName(name);
    if (!uniqueNames.has(normalized)) {
      uniqueNames.set(normalized, name); // Store original name with proper casing
    }
  });
  
  // Add each unique unmatched employee
  uniqueNames.forEach((originalName) => {
    const newId = getNextAvailableId(currentEmployees);
    const newEmployee: Employee = {
      id: newId,
      name: originalName
    };
    newEmployees.push(newEmployee);
    currentEmployees.push(newEmployee); // Update for next ID calculation
  });
  
  return newEmployees;
}

/**
 * Match employee names from FaceCheck records to Biometric IDs
 * Returns a map of normalizedEmployeeName → biometricId
 * Uses normalized (case-insensitive) matching
 */
export function matchEmployeeNames(
  records: FaceCheckRecord[], 
  employees: Employee[]
): { matched: Map<string, string>; unmatched: string[] } {
  const matched = new Map<string, string>();
  const unmatchedSet = new Set<string>();
  
  // Create normalized name lookup
  const employeeNameMap = new Map<string, string>();
  employees.forEach(emp => {
    const normalizedName = normalizeEmployeeName(emp.name);
    employeeNameMap.set(normalizedName, emp.id);
  });
  
  // Match each record's employee name
  records.forEach(record => {
    const normalizedName = normalizeEmployeeName(record.employeeName);
    
    // Debug logging for "Face" bug investigation
    if (record.employeeName.length < 5 || !record.employeeName.includes(' ')) {
      console.warn('[DEBUG] Suspicious employee name detected:', {
        original: record.employeeName,
        normalized: normalizedName,
        length: record.employeeName.length,
        timestamp: record.timestamp
      });
    }
    
    if (employeeNameMap.has(normalizedName)) {
      // Use normalized name as key for consistent lookups
      matched.set(normalizedName, employeeNameMap.get(normalizedName)!);
    } else {
      unmatchedSet.add(record.employeeName);
    }
  });
  
  return {
    matched,
    unmatched: Array.from(unmatchedSet)
  };
}

/**
 * Filter records by date range
 */
export function filterByDateRange(records: FaceCheckRecord[], range: DateRange): FaceCheckRecord[] {
  return records.filter(record => {
    const recordDate = new Date(record.timestamp);
    recordDate.setHours(0, 0, 0, 0); // Compare dates only, ignore time
    
    if (range.startDate) {
      const startDate = new Date(range.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (recordDate < startDate) return false;
    }
    
    if (range.endDate) {
      const endDate = new Date(range.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (recordDate > endDate) return false;
    }
    
    return true;
  });
}

/**
 * Group records by employee (biometric ID)
 */
export function groupByEmployee(
  records: FaceCheckRecord[], 
  employeeMap: Map<string, string>
): Map<string, FaceCheckRecord[]> {
  const grouped = new Map<string, FaceCheckRecord[]>();
  
  records.forEach(record => {
    // Normalize the employee name before lookup to match Map keys
    const normalizedName = normalizeEmployeeName(record.employeeName);
    const biometricId = employeeMap.get(normalizedName);
    
    if (biometricId) {
      if (!grouped.has(biometricId)) {
        grouped.set(biometricId, []);
      }
      grouped.get(biometricId)!.push(record);
    }
  });
  
  // Preserve original order from FaceCheck input (no sorting)
  // Records will appear in the exact order they were in the uploaded file
  
  return grouped;
}

/**
 * Format timestamp to payroll format: "M/D/YYYY H:MM AM/PM"
 */
function formatPayrollTimestamp(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  
  return `${month}/${day}/${year} ${hours}:${minutesStr} ${ampm}`;
}

/**
 * Generate payroll data from grouped records
 */
export function generatePayrollData(groupedRecords: Map<string, FaceCheckRecord[]>, employees: Employee[]): PayrollRecord[] {
  const payrollRecords: PayrollRecord[] = [];
  
  // Create biometric ID to name lookup map
  const idToNameMap = new Map<string, string>();
  employees.forEach(emp => {
    idToNameMap.set(emp.id, emp.name);
  });
  
  // Sort biometric IDs numerically/alphabetically
  const sortedIds = Array.from(groupedRecords.keys()).sort((a, b) => {
    // Try numeric sort first
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    // Fall back to string sort
    return a.localeCompare(b);
  });
  
  // Track unique timestamps per employee to prevent duplicates
  const uniqueTimestamps = new Map<string, Set<string>>();
  
  sortedIds.forEach(biometricId => {
    const records = groupedRecords.get(biometricId)!;
    
    // Sort records: descending by date (latest first), then ascending by time within same day (earliest first)
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      
      // Get date-only strings for comparison (removes time component)
      const dateOnlyA = dateA.toDateString(); // e.g., "Mon Feb 24 2026"
      const dateOnlyB = dateB.toDateString();
      
      if (dateOnlyA !== dateOnlyB) {
        // Different dates: sort descending (latest date first)
        return dateB.getTime() - dateA.getTime();
      } else {
        // Same date: sort ascending (earliest time first)
        return dateA.getTime() - dateB.getTime();
      }
    });
    
    uniqueTimestamps.set(biometricId, new Set());
    
    sortedRecords.forEach(record => {
      const formattedTime = formatPayrollTimestamp(record.timestamp);
      const timestampSet = uniqueTimestamps.get(biometricId)!;
      
      // Only add if not duplicate
      if (!timestampSet.has(formattedTime)) {
        timestampSet.add(formattedTime);
        
        payrollRecords.push({
          biometricId,
          employeeName: idToNameMap.get(biometricId) || 'Unknown',
          time: formattedTime,
          state: '', // Empty as per requirements
          newState: '',
          exception: '',
          operation: ''
        });
      }
    });
  });
  
  return payrollRecords;
}

/**
 * Generate Excel file for payroll system with ExcelJS
 */
export async function generatePayrollExcel(data: PayrollRecord[], filename: string = 'payroll_export.xlsx'): Promise<void> {
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');
  
  // Define columns with headers and widths
  worksheet.columns = [
    { header: 'Biometric ID', key: 'biometricId', width: 12 },
    { header: 'Employee Name', key: 'employeeName', width: 18 },
    { header: 'Time', key: 'time', width: 20 }
  ];
  
  // Add data rows
  data.forEach((record) => {
    worksheet.addRow({
      biometricId: record.biometricId,
      employeeName: record.employeeName,
      time: record.time
    });
  });
  
  // Generate Excel file as buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Create blob and download file
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Parse Excel file containing employee data
 * Format: Column A = ID, Column B = Name (no headers, just pure data)
 */
export async function parseEmployeeExcelFile(file: File): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const employees: Employee[] = [];
        
        // Parse rows (no header, start from row 0)
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          
          // Skip empty rows
          if (!row || row.length < 2) continue;
          
          // Column A = ID (index 0), Column B = Name (index 1)
          const id = row[0]?.toString().trim() || '';
          const name = row[1]?.toString().trim() || '';
          
          // Skip if either is empty
          if (!id || !name) continue;
          
          employees.push({ id, name });
        }
        
        resolve(employees);
      } catch (err) {
        reject(new Error('Failed to parse employee Excel file: ' + (err instanceof Error ? err.message : 'Unknown error')));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Generate template Excel file for employee upload
 * Format: Column A = ID, Column B = Name (no headers, just sample data)
 */
export async function generateEmployeeTemplate(filename: string = 'employee_template.xlsx'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');
  
  // Sample data (no headers, just data)
  const sampleEmployees = [
    ['1', 'Andrew Ferrer'],
    ['2', 'Carlo Alpis'],
    ['3', 'John Doe']
  ];
  
  // Add rows
  sampleEmployees.forEach(emp => {
    worksheet.addRow(emp);
  });
  
  // Set column widths
  worksheet.getColumn(1).width = 12;  // Column A - ID
  worksheet.getColumn(2).width = 20;  // Column B - Name
  
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}