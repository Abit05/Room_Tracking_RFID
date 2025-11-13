import { Room, TapResponse, RoomActivity, RoomsResponse } from '../context/types';
import { EmployeeInRoom } from '../context/types';

const API_BASE_URL = 'http://192.168.137.1:3000'; 

class ApiService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getRooms(): Promise<RoomsResponse> {
    try {
      console.log('🏢 Fetching available rooms...');
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/rooms`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Rooms fetched:', data.rooms?.length || 0, 'rooms');
      return data;
    } catch (error: any) {
      console.error('❌ Rooms fetch error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      } else if (error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
      } else {
        throw new Error(`Failed to fetch rooms: ${error.message}`);
      }
    }
  }

  async getRoomStatus(roomId?: number): Promise<Room> {
    try {
      const url = roomId 
        ? `${API_BASE_URL}/rooms/${roomId}/status`
        : `${API_BASE_URL}/room/status`;
      
      console.log('🔄 Fetching room status for room ID:', roomId || 'current');
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Room status fetched:', data.room?.name);
      return data.room;
    } catch (error: any) {
      console.error('❌ Room status error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      } else if (error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
      } else {
        throw new Error(`Failed to fetch room status: ${error.message}`);
      }
    }
  }

  async processTap(uid: string, roomId?: number): Promise<TapResponse> {
    try {
      console.log('👆 Processing tap for UID:', uid, 'Room ID:', roomId);
      
      const requestBody: any = { uid };
      if (roomId) {
        requestBody.room_id = roomId;
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/room/tap`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      let tapData: TapResponse;
      
      try {
        tapData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(tapData.message || `HTTP ${response.status}: Tap failed`);
      }

      console.log('✅ Tap processed successfully:', tapData.action, 'in', tapData.room.name);
      return tapData;
    } catch (error: any) {
      console.error('❌ Tap processing error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to process tap');
      } else if (error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
      } else {
        throw error;
      }
    }
  }

  async getRoomActivity(roomId?: number): Promise<{ activities: RoomActivity[] }> {
    try {
      const url = roomId 
        ? `${API_BASE_URL}/rooms/${roomId}/activity`
        : `${API_BASE_URL}/room/activity`;
      
      console.log('📋 Fetching room activity logs for room ID:', roomId || 'all rooms');
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Room activity logs fetched:', data.activities?.length || 0, 'items');
      return data;
    } catch (error: any) {
      console.error('❌ Room activity fetch error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      } else if (error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
      } else {
        throw new Error(`Failed to fetch room activity: ${error.message}`);
      }
    }
  }

  async getEmployeesInRoom(roomId: number): Promise<{ employees: EmployeeInRoom[] }> {
    try {
      console.log('👥 Fetching employees in room ID:', roomId);
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/rooms/${roomId}/employees`);
      
      console.log('📊 Employees response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
        }
        
        console.error('❌ Employees endpoint error:', errorMessage);
        
        if (response.status === 404) {
          console.log('⚠️ Employees endpoint not found (404)');
          return { employees: [] };
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Employees in room fetched:', data.employees?.length || 0, 'employees');
      return data;
    } catch (error: any) {
      console.error('❌ Employees in room fetch error:', error);
      console.error('❌ Error details:', error.message);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      } else if (error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
      } else {
        console.log('⚠️ Error fetching employees, returning empty array');
        return { employees: [] };
      }
    }
  }

  async registerEmployee(uid: string, first_name: string, last_name: string): Promise<any> {
    try {
      console.log('Sending registration request:', { uid, first_name, last_name });
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/employees/register`, {
        method: 'POST',
        body: JSON.stringify({ 
          uid, 
          first_name, 
          last_name 
        }),
      });

      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      return data;

    } catch (error: any) {
      console.error('API Service - Registration error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server not responding');
      } else if (error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}`);
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - check your connection and server status');
      } else {
        throw error;
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  getApiBaseUrl(): string {
    return API_BASE_URL;
  }
}

export const apiService = new ApiService();