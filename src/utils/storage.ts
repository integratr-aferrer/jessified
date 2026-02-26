import { Employee } from './types';

const EMPLOYEES_KEY = 'jessified_employees';

/**
 * Save employees to localStorage
 */
export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  } catch (error) {
    console.error('Failed to save employees to localStorage:', error);
  }
}

/**
 * Load employees from localStorage
 */
export function loadEmployees(): Employee[] {
  try {
    const stored = localStorage.getItem(EMPLOYEES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load employees from localStorage:', error);
  }
  
  // Return default employees if nothing stored
  return [
    { id: '1', name: 'Andrew Ferrer' },
    { id: '2', name: 'Carlo Alpis' }
  ];
}

/**
 * Clear employees from localStorage
 */
export function clearEmployees(): void {
  try {
    localStorage.removeItem(EMPLOYEES_KEY);
  } catch (error) {
    console.error('Failed to clear employees from localStorage:', error);
  }
}
