// Collabthon API Client
class CollabthonAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/v1';
        this.token = localStorage.getItem('access_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method: 'GET',
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async refreshToken(refreshToken) {
        const response = await this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateUser(userData) {
        return this.request('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // User endpoints
    async getUsers(limit = 20, skip = 0) {
        return this.request(`/users/?limit=${limit}&skip=${skip}`);
    }

    async getUser(userId) {
        return this.request(`/users/${userId}`);
    }

    async searchUsers(query) {
        return this.request(`/users/search/${encodeURIComponent(query)}`);
    }

    // Profile endpoints
    async getMyProfile() {
        return this.request('/users/me/profile');
    }

    async createMyProfile(profileData) {
        return this.request('/users/me/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    }

    async updateMyProfile(profileData) {
        return this.request('/users/me/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getProfiles(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        });
        
        return this.request(`/profiles/?${params.toString()}`);
    }

    async getProfile(profileId) {
        return this.request(`/profiles/${profileId}`);
    }

    async searchProfiles(query, limit = 20) {
        return this.request(`/profiles/search/${encodeURIComponent(query)}?limit=${limit}`);
    }

    async getPopularSkills() {
        return this.request('/profiles/skills/popular');
    }

    async getColleges() {
        return this.request('/profiles/colleges');
    }

    async getMajors() {
        return this.request('/profiles/majors');
    }

    // Project endpoints
    async getProjects(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        });
        
        return this.request(`/projects/?${params.toString()}`);
    }

    async createProject(projectData) {
        return this.request('/projects/', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async getProject(projectId) {
        return this.request(`/projects/${projectId}`);
    }

    async updateProject(projectId, projectData) {
        return this.request(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(projectId) {
        return this.request(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    }

    async searchProjects(query, limit = 20) {
        return this.request(`/projects/search/${encodeURIComponent(query)}?limit=${limit}`);
    }

    async getMyProjects() {
        return this.request('/projects/my/projects');
    }

    async getProjectStats() {
        return this.request('/projects/stats');
    }

    // Collaboration endpoints
    async createCollaborationRequest(requestData) {
        return this.request('/collaborations/', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    async getSentRequests(status, limit = 50, skip = 0) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            skip: skip.toString()
        });
        
        if (status) {
            params.append('status', status);
        }
        
        return this.request(`/collaborations/sent?${params.toString()}`);
    }

    async getReceivedRequests(status, limit = 50, skip = 0) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            skip: skip.toString()
        });
        
        if (status) {
            params.append('status', status);
        }
        
        return this.request(`/collaborations/received?${params.toString()}`);
    }

    async getCollaborationRequest(requestId) {
        return this.request(`/collaborations/${requestId}`);
    }

    async acceptCollaborationRequest(requestId) {
        return this.request(`/collaborations/${requestId}/accept`, {
            method: 'PUT'
        });
    }

    async rejectCollaborationRequest(requestId) {
        return this.request(`/collaborations/${requestId}/reject`, {
            method: 'PUT'
        });
    }

    async cancelCollaborationRequest(requestId) {
        return this.request(`/collaborations/${requestId}`, {
            method: 'DELETE'
        });
    }

    async getCollaborationStats() {
        return this.request('/collaborations/stats');
    }

    // Subscription endpoints
    async getSubscriptionPlans() {
        return this.request('/subscriptions/plans');
    }

    async getMySubscription() {
        return this.request('/subscriptions/my');
    }

    async subscribeToPlan(plan) {
        return this.request(`/subscriptions/subscribe/${plan}`, {
            method: 'POST'
        });
    }

    async cancelSubscription() {
        return this.request('/subscriptions/cancel', {
            method: 'POST'
        });
    }

    async checkFeatureAccess(userId, feature) {
        return this.request(`/subscriptions/check/${userId}/${feature}`);
    }

    async getSubscriptionStats() {
        return this.request('/subscriptions/admin/stats');
    }
}

// Global API instance
const api = new CollabthonAPI();

// Authentication state management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                this.currentUser = await api.getCurrentUser();
                this.isAuthenticated = true;
                this.updateUI();
            } catch (error) {
                console.log('Token expired or invalid, clearing...');
                this.logout();
            }
        }
    }

    async login(credentials) {
        try {
            const response = await api.login(credentials);
            this.currentUser = await api.getCurrentUser();
            this.isAuthenticated = true;
            this.updateUI();
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {
            const response = await api.register(userData);
            return { success: true, user: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        api.clearToken();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();
        window.location.hash = '#home';
    }

    updateUI() {
        const authButtons = document.querySelectorAll('.auth-button');
        const userMenu = document.querySelector('.user-menu');
        
        if (this.isAuthenticated) {
            authButtons.forEach(btn => btn.style.display = 'none');
            if (userMenu) {
                userMenu.style.display = 'flex';
                const userName = userMenu.querySelector('.user-name');
                if (userName && this.currentUser) {
                    userName.textContent = this.currentUser.username;
                }
            }
        } else {
            authButtons.forEach(btn => btn.style.display = 'block');
            if (userMenu) {
                userMenu.style.display = 'none';
            }
        }
    }
}

// Global auth manager instance
const auth = new AuthManager();