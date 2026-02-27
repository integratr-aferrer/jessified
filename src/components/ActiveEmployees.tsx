import React, { useState } from 'react';
import { Plus, Trash2, UserPlus, Users, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Employee } from '../utils/types';
import { AnimatePresence, motion } from 'framer-motion';

interface ActiveEmployeesProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onRemoveEmployee: (id: string) => void;
  onUpdateEmployee: (originalId: string, updated: Employee) => void;
}
export function ActiveEmployees({
  employees,
  onAddEmployee,
  onRemoveEmployee,
  onUpdateEmployee
}: ActiveEmployeesProps) {
  // Add form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  
  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  // Collapse state - auto-collapse when 5 or more employees on initial render
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return employees.length >= 5;
  });

  // Success message state for Clear All action
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newId.trim() || !newName.trim()) {
      setError('Both ID and Name are required');
      return;
    }

    if (employees.some((emp) => emp.id === newId.trim())) {
      setError('Employee ID already exists');
      return;
    }

    onAddEmployee({
      id: newId.trim(),
      name: newName.trim()
    });

    setNewId('');
    setNewName('');
  };

  const handleStartEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditId(employee.id);
    setEditName(employee.name);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditId('');
    setEditName('');
    setEditError('');
  };

  const handleSaveEdit = (originalId: string) => {
    setEditError('');

    // Validate: Check if ID/Name are empty
    if (!editId.trim() || !editName.trim()) {
      setEditError('Both ID and Name are required');
      return;
    }

    // Validate: If ID changed, check if new ID already exists
    const idChanged = editId.trim() !== originalId;
    
    if (idChanged && employees.some(emp => emp.id === editId.trim())) {
      setEditError('Employee ID already exists');
      return;
    }

    // Save changes
    onUpdateEmployee(originalId, { 
      id: editId.trim(), 
      name: editName.trim() 
    });

    // Reset edit state
    handleCancelEdit();
  };

  const handleToggleCollapse = () => {
    // If collapsing while editing, cancel the edit
    if (!isCollapsed && editingId) {
      handleCancelEdit();
    }
    setIsCollapsed(!isCollapsed);
  };

  const handleClearAll = () => {
    if (employees.length === 0) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all employees? This action cannot be undone.'
    );

    if (confirmed) {
      // Cancel edit mode if active
      if (editingId) {
        handleCancelEdit();
      }

      // Clear all employees by removing them one by one
      employees.forEach(emp => onRemoveEmployee(emp.id));

      // Show success message
      setShowSuccessMessage(true);

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };
  return (
    <Card
      title="Active Employees"
      description="Manage employees to match with attendance IDs"
      action={
        <div className="flex items-center gap-3">
          <Button
            onClick={handleClearAll}
            disabled={employees.length === 0}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
          <button
            onClick={handleToggleCollapse}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md p-1"
            title={isCollapsed ? 'Expand employee list' : 'Collapse employee list'}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {employees.length} Active
            </div>
          </button>
        </div>
      }>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="employee-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.2, ease: 'easeIn', delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.2, ease: 'easeOut' }
              }
            }}
            style={{ overflow: 'hidden' }}
          >
            <form
              onSubmit={handleAdd}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">

              <div className="flex-1 w-full">
                <Input
                  label="Employee ID"
                  placeholder="e.g. 001"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)} />

              </div>
              <div className="flex-[2] w-full">
                <Input
                  label="Full Name"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)} />

              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={!newId || !newName}>

                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </form>

            {error && <p className="text-red-500 text-sm mb-4 -mt-4 px-1">{error}</p>}

            {showSuccessMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 font-medium">
                  All employees have been removed.
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">

                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">

                Name
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            <AnimatePresence>
              {employees.length === 0 ?
              <tr>
                  <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-slate-500 text-sm">

                    <div className="flex flex-col items-center justify-center">
                      <UserPlus className="h-8 w-8 text-slate-300 mb-2" />
                      <p>No employees added yet.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Add employees above to identify them in reports.
                      </p>
                    </div>
                  </td>
                </tr> :

              employees.map((employee) => {
                const isEditing = editingId === employee.id;
                
                return (
                  <motion.tr
                    key={employee.id}
                    initial={{
                      opacity: 0,
                      x: -20
                    }}
                    animate={{
                      opacity: 1,
                      x: 0
                    }}
                    exit={{
                      opacity: 0,
                      x: -20
                    }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50 transition-colors">

                    {isEditing ? (
                      <>
                        {/* Edit Mode: Input fields */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <input
                              type="text"
                              value={editId}
                              onChange={(e) => setEditId(e.target.value)}
                              className="w-full px-3 py-2 text-sm font-medium text-slate-900 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="ID"
                            />
                            {editError && (
                              <div className="absolute z-10 mt-1 p-2 bg-red-50 border border-red-200 rounded-md shadow-lg text-xs text-red-700 whitespace-nowrap">
                                {editError}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Full Name"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(employee.id)}
                              className="text-primary-600 hover:text-primary-700 transition-colors p-1 rounded-md hover:bg-primary-50"
                              title="Save changes">
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                              title="Cancel editing">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Display Mode: Show text */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">
                          {employee.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(employee)}
                              className="text-secondary-600 hover:text-secondary-700 transition-colors p-1 rounded-md hover:bg-secondary-50"
                              title="Edit employee">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onRemoveEmployee(employee.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                              title="Remove employee">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </motion.tr>
                );
              })
              }
            </AnimatePresence>
          </tbody>
        </table>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>);

}