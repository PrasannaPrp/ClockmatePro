/**
 * Centralized TypeScript interfaces and types for ClockMate.
 * Ensures consistent data modeling across the frontend.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  companyId: number;
}

export interface Stat {
  totalEmployees: number;
  activeToday: number;
  pendingApprovals: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  clock_in_time: string;
  clock_out_time: string | null;
  lat: number;
  lng: number;
}
