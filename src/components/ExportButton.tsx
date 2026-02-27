import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/Button';
import { PayrollRecord } from '../utils/types';
import { generatePayrollExcel } from '../utils/parseAttendance';

interface ExportButtonProps {
  data: PayrollRecord[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (data.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Generate filename with date range
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `payroll_export_${date}.xlsx`;
      
      // Use the utility function to generate and download Excel file (now async)
      await generatePayrollExcel(data, filename);
    } catch (error) {
      console.error('Failed to export Excel file:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={data.length === 0 || isExporting}
      variant="primary"
      className="w-full sm:w-auto"
      isLoading={isExporting}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export to Excel'}
    </Button>
  );
}