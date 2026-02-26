import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { DateRange } from '../utils/types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  totalRecords: number;
  filteredRecords: number;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  totalRecords,
  filteredRecords
}: DateRangeFilterProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDateRangeChange({
      ...dateRange,
      startDate: value ? new Date(value) : null
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDateRangeChange({
      ...dateRange,
      endDate: value ? new Date(value) : null
    });
  };

  const handleClear = () => {
    onDateRangeChange({
      startDate: null,
      endDate: null
    });
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isFiltering = dateRange.startDate || dateRange.endDate;

  return (
    <Card
      title="Date Range Filter"
      description="Filter attendance records by date range (optional)"
      action={
        isFiltering && (
          <Button onClick={handleClear} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={formatDateForInput(dateRange.startDate)}
              onChange={handleStartDateChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={formatDateForInput(dateRange.endDate)}
              onChange={handleEndDateChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {isFiltering && (
          <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <span className="font-medium">
                Showing {filteredRecords} of {totalRecords} records
              </span>
              {dateRange.startDate && dateRange.endDate && (
                <span className="text-slate-600 ml-1">
                  (from {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()})
                </span>
              )}
              {dateRange.startDate && !dateRange.endDate && (
                <span className="text-slate-600 ml-1">
                  (from {dateRange.startDate.toLocaleDateString()} onwards)
                </span>
              )}
              {!dateRange.startDate && dateRange.endDate && (
                <span className="text-slate-600 ml-1">
                  (up to {dateRange.endDate.toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
