import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ActiveEmployees } from './components/ActiveEmployees';
import { FileUpload } from './components/FileUpload';
import { DateRangeFilter } from './components/DateRangeFilter';
import { FormattedPreview } from './components/FormattedPreview';
import { Employee, FaceCheckRecord, PayrollRecord, DateRange } from './utils/types';
import { 
  detectFileFormat, 
  parseExcelFile, 
  parseCSVFile,
  matchEmployeeNames,
  filterByDateRange,
  groupByEmployee,
  generatePayrollData
} from './utils/parseAttendance';
import { loadEmployees, saveEmployees } from './utils/storage';
import { sortEmployeesById } from './utils/sortEmployees';
import { X, AlertTriangle } from 'lucide-react';

export function App() {
  // State for employees (load from localStorage)
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  
  // State for uploaded FaceCheck records
  const [faceCheckRecords, setFaceCheckRecords] = useState<FaceCheckRecord[]>([]);
  
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  
  // State for processed payroll data
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  
  // State for unmatched employees warning
  const [unmatchedEmployeeNames, setUnmatchedEmployeeNames] = useState<string[]>([]);
  const [showUnmatchedWarning, setShowUnmatchedWarning] = useState(false);

  // Save employees to localStorage whenever they change
  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  // Process data whenever records, employees, or date range changes
  useEffect(() => {
    if (faceCheckRecords.length === 0) {
      setPayrollData([]);
      return;
    }

    // Step 1: Match employee names to IDs
    const { matched } = matchEmployeeNames(faceCheckRecords, employees);

    // Step 2: Filter by date range
    const filteredRecords = filterByDateRange(faceCheckRecords, dateRange);

    // Step 3: Group by employee
    const groupedRecords = groupByEmployee(filteredRecords, matched);

    // Step 4: Generate payroll format
    const payroll = generatePayrollData(groupedRecords, employees);
    setPayrollData(payroll);
  }, [faceCheckRecords, employees, dateRange]);

  const handleAddEmployee = (employee: Employee) => {
    setEmployees((prev) => {
      const newList = [...prev, employee];
      // Auto-sort after adding
      return sortEmployeesById(newList);
    });
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateEmployee = (originalId: string, updated: Employee) => {
    setEmployees((prev) => {
      // Replace employee with originalId with updated employee
      const updatedList = prev.map(emp => 
        emp.id === originalId ? updated : emp
      );
      
      // Auto-sort after updating
      return sortEmployeesById(updatedList);
    });
  };

  const handleFileUploaded = (records: FaceCheckRecord[]) => {
    setFaceCheckRecords(records);
    
    // Check for unmatched employees and show warning
    const { unmatched } = matchEmployeeNames(records, employees);
    
    if (unmatched.length > 0) {
      console.log('[WARNING] Found unmatched employees:', unmatched);
      setUnmatchedEmployeeNames(unmatched);
      setShowUnmatchedWarning(true);
      
      // Auto-hide warning after 15 seconds
      setTimeout(() => setShowUnmatchedWarning(false), 15000);
    } else {
      // Clear any existing warning if all employees matched
      setUnmatchedEmployeeNames([]);
      setShowUnmatchedWarning(false);
    }
  };

  const handleParseFile = async (file: File): Promise<FaceCheckRecord[]> => {
    const format = detectFileFormat(file);
    
    if (format === 'excel') {
      return await parseExcelFile(file);
    } else {
      return await parseCSVFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Employee Management Section */}
        <section>
          <ActiveEmployees
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onRemoveEmployee={handleRemoveEmployee}
            onUpdateEmployee={handleUpdateEmployee}
          />
        </section>

        {/* File Upload Section */}
        <section>
          <FileUpload
            onFileUploaded={handleFileUploaded}
            onParseFile={handleParseFile}
          />
        </section>

        {/* Unmatched Employees Warning Banner */}
        {showUnmatchedWarning && unmatchedEmployeeNames.length > 0 && (
          <section>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {unmatchedEmployeeNames.length} Employee{unmatchedEmployeeNames.length !== 1 ? 's' : ''} Not Found
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-1">The following employees from the uploaded file are not in your Active Employees list:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {unmatchedEmployeeNames.map((name, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{name}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-yellow-600">
                        Their records will not be included in the export. Add them to Active Employees above to include their data.
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUnmatchedWarning(false)}
                  className="flex-shrink-0 ml-4 text-yellow-400 hover:text-yellow-600 transition-colors"
                  aria-label="Dismiss warning"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Date Range Filter Section */}
        {faceCheckRecords.length > 0 && (
          <section>
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              totalRecords={faceCheckRecords.length}
              filteredRecords={filterByDateRange(faceCheckRecords, dateRange).length}
            />
          </section>
        )}

        {/* Preview & Export Section */}
        <section>
          <FormattedPreview data={payrollData} />
        </section>
      </main>
    </div>
  );
}