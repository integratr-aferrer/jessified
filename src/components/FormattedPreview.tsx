import React from 'react';
import { Card } from './ui/Card';
import { PayrollRecord } from '../utils/types';
import { ExportButton } from './ExportButton';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface FormattedPreviewProps {
  data: PayrollRecord[];
}

export function FormattedPreview({ data }: FormattedPreviewProps) {
  // Group records by biometric ID for visual display
  const groupedData: { id: string; records: PayrollRecord[] }[] = [];
  let currentId = '';
  let currentGroup: PayrollRecord[] = [];
  
  data.forEach((record, index) => {
    if (record.biometricId !== currentId) {
      if (currentGroup.length > 0) {
        groupedData.push({ id: currentId, records: currentGroup });
      }
      currentId = record.biometricId;
      currentGroup = [record];
    } else {
      currentGroup.push(record);
    }
    
    // Push last group
    if (index === data.length - 1) {
      groupedData.push({ id: currentId, records: currentGroup });
    }
  });
  
  return (
    <Card
      title="Payroll Export Preview"
      description="Preview of formatted attendance records for payroll system"
      action={<ExportButton data={data} />}
    >
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Biometric ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Employee Name
              </th>
              <th scope="col" className="px-3 py-3 w-8"></th>
              <th scope="col" className="px-3 py-3 w-8"></th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                State
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                New State
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Exception
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Operation
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Clock className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-600">
                      No data to display
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Upload a FaceCheck file above to generate a preview.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              groupedData.map((group, groupIndex) =>
                group.records.map((record, recordIndex) => (
                  <motion.tr
                    key={`${group.id}-${recordIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (groupIndex * group.records.length + recordIndex) * 0.02 }}
                    className={groupIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">
                      {recordIndex === 0 ? record.biometricId : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {record.employeeName}
                    </td>
                    <td className="px-3 py-4"></td>
                    <td className="px-3 py-4"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {record.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {record.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {record.newState}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {record.exception}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {record.operation}
                    </td>
                  </motion.tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}