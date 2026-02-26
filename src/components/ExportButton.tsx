import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/Button';
import { PayrollRecord } from '../utils/types';
import { generatePayrollExcel } from '../utils/parseAttendance';

interface ExportButtonProps {
  data: PayrollRecord[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;
    
    // Generate filename with date range
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `payroll_export_${date}.xlsx`;
    
    // Use the utility function to generate and download Excel file
    generatePayrollExcel(data, filename);
  };

  return (
    <Button
      onClick={handleExport}
      disabled={data.length === 0}
      variant="primary"
      className="w-full sm:w-auto"
    >
      <Download className="w-4 h-4 mr-2" />
      Export to Excel
    </Button>
  );
}