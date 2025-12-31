import { Room, TapResponse, RoomActivity, RoomsResponse } from '../context/types';
import { EmployeeInRoom } from '../context/types';

const API_BASE_URL = 'http://192.168.137.1:3000';

class ApiService {
  private async fetchApi(url: string, options: RequestInit = {}, timeout = 10000) {
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
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request timeout - server took too long to respond');
    } else if (error.message?.includes('Network request failed')) {
      return new Error(`Cannot connect to server at ${API_BASE_URL}`);
    } else if (error.message?.includes('Failed to fetch')) {
      return new Error(`Cannot connect to server at ${API_BASE_URL}. Please check if the server is running.`);
    }
    return error;
  }

  private enhanceRoom(room: Room): Room {
    return {
      ...room,
    };
  }

  async getEmployees(): Promise<{ employees: any[] }> {
    return await this.fetchApi(`${API_BASE_URL}/employees`);
  }

  async getRooms(): Promise<RoomsResponse> {
    const data = await this.fetchApi(`${API_BASE_URL}/rooms`);
    
    if (data.rooms?.length) {
      data.rooms = data.rooms.map((room: Room) => this.enhanceRoom(room));
    }
    
    return data;
  }

  async getRoomStatus(roomId?: number): Promise<Room> {
    const url = roomId 
      ? `${API_BASE_URL}/rooms/${roomId}/status`
      : `${API_BASE_URL}/room/status`;
    
    const data = await this.fetchApi(url);
    return data.room ? this.enhanceRoom(data.room) : data;
  }

  async processTap(uid: string, roomId?: number): Promise<TapResponse> {
    const requestBody: any = { uid };
    if (roomId) requestBody.room_id = roomId;

    return await this.fetchApi(`${API_BASE_URL}/room/tap`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async getRoomActivity(roomId?: number): Promise<{ activities: RoomActivity[] }> {
    const url = roomId 
      ? `${API_BASE_URL}/rooms/${roomId}/activity`
      : `${API_BASE_URL}/room/activity`;
    
    return await this.fetchApi(url);
  }

  async getEmployeesInRoom(roomId: number): Promise<{ 
    employees: EmployeeInRoom[];
  }> {
    try {
      const data = await this.fetchApi(`${API_BASE_URL}/rooms/${roomId}/employees`);

      return { employees: data.employees || [], ...data };
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return { employees: [] };
      }
      throw error;
    }
  }

  async registerEmployee(uid: string, first_name: string, last_name: string): Promise<any> {
    return await this.fetchApi(`${API_BASE_URL}/employees/register`, {
      method: 'POST',
      body: JSON.stringify({ uid, first_name, last_name }),
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.fetchApi(`${API_BASE_URL}/health`, {}, 5000);
      return true;
    } catch {
      return false;
    }
  }

  getApiBaseUrl(): string {
    return API_BASE_URL;
  }
}

export const apiService = new ApiService();