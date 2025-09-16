import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface OAuthRequest {
  provider: string;
  code?: string;
  idToken?: string;
  accessToken?: string;
}

export interface OAuthResponse {
  success: boolean;
  token?: string;
  user?: UserInfo;
  message?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

class OAuthService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async authenticateWithGoogle(code: string): Promise<OAuthResponse> {
    try {
      const response = await this.api.post('/oauth/google', {
        provider: 'google',
        code,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google authentication failed',
      };
    }
  }

  async authenticateWithApple(idToken: string): Promise<OAuthResponse> {
    try {
      const response = await this.api.post('/oauth/apple', {
        provider: 'apple',
        idToken,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Apple authentication failed',
      };
    }
  }

  async authenticateWithFacebook(accessToken: string): Promise<OAuthResponse> {
    try {
      const response = await this.api.post('/oauth/facebook', {
        provider: 'facebook',
        accessToken,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Facebook authentication failed',
      };
    }
  }

  async authenticateWithAmazon(accessToken: string): Promise<OAuthResponse> {
    try {
      const response = await this.api.post('/oauth/amazon', {
        provider: 'amazon',
        accessToken,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Amazon authentication failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/logout');
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Store authentication data
  setAuthData(token: string, user: UserInfo): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

  // Get stored authentication data
  getAuthData(): { token: string | null; user: UserInfo | null } {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('userInfo');
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const { token } = this.getAuthData();
    return !!token;
  }
}

export const oAuthService = new OAuthService();
export default oAuthService;
