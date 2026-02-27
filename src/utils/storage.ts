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
      const parsed = JSON.parse(stored);
      // Return the parsed array even if it's empty (user may have cleared it)
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load employees from localStorage:', error);
  }
  
  // Return default employees only on first load (nothing stored)
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
