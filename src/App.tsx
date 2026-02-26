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
  generatePayrollData,
  autoAddEmployees
} from './utils/parseAttendance';
import { loadEmployees, saveEmployees } from './utils/storage';
import { sortEmployeesById } from './utils/sortEmployees';
import { Info, X } from 'lucide-react';

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
  
  // State for auto-added employees notification
  const [autoAddedEmployees, setAutoAddedEmployees] = useState<Employee[]>([]);
  const [showAutoAddBanner, setShowAutoAddBanner] = useState(false);

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
    
    // Auto-add unmatched employees
    const { unmatched } = matchEmployeeNames(records, employees);
    
    if (unmatched.length > 0) {
      console.log('[AUTO-ADD] Found unmatched employees:', unmatched);
      const newEmployees = autoAddEmployees(unmatched, employees);
      console.log('[AUTO-ADD] Auto-adding employees with IDs:', newEmployees);
      setEmployees(prev => [...prev, ...newEmployees]);
      setAutoAddedEmployees(newEmployees);
      setShowAutoAddBanner(true);
      
      // Auto-hide banner after 10 seconds
      setTimeout(() => setShowAutoAddBanner(false), 10000);
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

        {/* Auto-Added Employees Info Banner */}
        {showAutoAddBanner && autoAddedEmployees.length > 0 && (
          <section>
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-secondary-800">
                      {autoAddedEmployees.length} New Employee{autoAddedEmployees.length !== 1 ? 's' : ''} Auto-Added
                    </h3>
                    <div className="mt-2 text-sm text-secondary-700">
                      <p className="mb-1">The following employees were automatically assigned Biometric IDs and added to your Active Employees list:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {autoAddedEmployees.map(emp => (
                          <li key={emp.id}>
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-secondary-600 ml-1">(Biometric ID: {emp.id})</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-secondary-600">
                        All their records are included in the export. You can edit their IDs in the Active Employees section above if needed.
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAutoAddBanner(false)}
                  className="flex-shrink-0 ml-4 text-secondary-400 hover:text-secondary-600 transition-colors"
                  aria-label="Dismiss notification"
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