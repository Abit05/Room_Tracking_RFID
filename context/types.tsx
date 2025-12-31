export interface RoomActivity {
  id: number;
  employee_uid: string;
  employee_name: string;
  room_name: string;
  action: 'enter' | 'exit';
  timestamp: string;
  room_id?: number;
}

export interface RoomsResponse {
  rooms: Room[];
}

export interface Room {
  id: number;
  name: string;
  description: string;
  current_count: number;
  created_at: string;
  is_full?: boolean;
}

export interface Employee {
  id: number;
  name: string;
  uid: string;
}

export interface TapResponse {
  message: string;
  action: 'enter' | 'exit';
  employee: Employee;
  room: Room;
  timestamp: string;
}

export interface NFCStatus {
  hasNfc: boolean | null;
  enabled: boolean | null;
}

export interface EmployeeInRoom {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_uid: string;
  room_id: number;
  room_name: string;
  entered_at: string;
  duration?: string;
}