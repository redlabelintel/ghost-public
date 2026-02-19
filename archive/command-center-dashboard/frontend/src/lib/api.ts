const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Dashboard endpoints
  async getDashboardOverview(timeRange: string = "24h") {
    return this.request(`/api/v1/dashboard/overview?timeRange=${timeRange}`);
  }

  async getMetrics(filters: any = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/api/v1/dashboard/metrics?${queryString}`);
  }

  async getWidgetData(widgetId: string) {
    return this.request(`/api/v1/dashboard/widgets/${widgetId}/data`);
  }

  // Real-time metrics
  async getRealTimeMetrics() {
    return this.request("/api/v1/metrics/realtime");
  }

  async getSessionCosts() {
    return this.request("/api/v1/metrics/sessions/costs");
  }

  async getApiResponseTimes() {
    return this.request("/api/v1/metrics/api/response-times");
  }

  // Projects
  async getProjectStatus() {
    return this.request("/api/v1/projects/status");
  }

  async getProjectDetails(projectId: string) {
    return this.request(`/api/v1/projects/${projectId}`);
  }

  // Resources
  async getResourceUtilization() {
    return this.request("/api/v1/resources/utilization");
  }

  async getSystemHealth() {
    return this.request("/api/v1/system/health");
  }

  // Alerts
  async getAlerts(status: string = "active") {
    return this.request(`/api/v1/alerts?status=${status}`);
  }

  async acknowledgeAlert(alertId: string) {
    return this.request(`/api/v1/alerts/${alertId}/acknowledge`, {
      method: "POST",
    });
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; user: any }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    
    this.setToken(response.access_token);
    return response;
  }

  async logout() {
    try {
      await this.request("/api/v1/auth/logout", { method: "POST" });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.request("/api/v1/auth/me");
  }

  // Export functionality
  async exportDashboardData(format: "csv" | "json" = "csv") {
    return this.request(`/api/v1/dashboard/export?format=${format}`, {
      method: "POST",
    });
  }
}

// Global API client instance
export const apiClient = new ApiClient();