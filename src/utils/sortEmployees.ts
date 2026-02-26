import { Employee } from './types';

/**
 * Sort employees by ID in numeric ascending order
 * If IDs are numeric, sort as numbers (1, 2, 3, 10, 11...)
 * Otherwise, sort alphabetically (A, B, C...)
 */
export function sortEmployeesById(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => {
    const aNum = parseInt(a.id);
    const bNum = parseInt(b.id);
    
    // Both numeric: sort as numbers
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    // At least one non-numeric: alphabetical sort
    return a.id.localeCompare(b.id);
  });
}
