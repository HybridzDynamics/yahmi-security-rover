/**
 * Yahmi Security Rover - Authentication Manager
 * Handles user authentication, authorization, and session management
 */

class YahmiAuth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.token = localStorage.getItem('yahmi_token');
        this.refreshToken = localStorage.getItem('yahmi_refresh_token');
        
        this.init();
    }

    init() {
        console.log('🔐 Initializing Yahmi Authentication...');
        
        // Check for existing token
        if (this.token) {
            this.validateToken();
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Password reset form
        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }
    }

    async validateToken() {
        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.isAuthenticated = true;
                this.updateUI();
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.clearTokens();
            return false;
        }
    }

    async login(username, password, rememberMe = false) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, rememberMe })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.refreshToken = data.refreshToken;
                this.user = data.user;
                this.isAuthenticated = true;

                // Store tokens
                localStorage.setItem('yahmi_token', this.token);
                if (this.refreshToken) {
                    localStorage.setItem('yahmi_refresh_token', this.refreshToken);
                }

                this.updateUI();
                this.showNotification('Login successful', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Login failed: ' + error.message, 'error');
            return false;
        }
    }

    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Registration successful', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Registration failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Registration failed:', error);
            this.showNotification('Registration failed: ' + error.message, 'error');
            return false;
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            this.clearTokens();
            this.user = null;
            this.isAuthenticated = false;
            this.updateUI();
            this.showNotification('Logged out successfully', 'info');
        }
    }

    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('yahmi_token', this.token);
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            return false;
        }
    }

    async resetPassword(email) {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Password reset email sent', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Password reset failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Password reset failed:', error);
            this.showNotification('Password reset failed: ' + error.message, 'error');
            return false;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Password changed successfully', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Password change failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Password change failed:', error);
            this.showNotification('Password change failed: ' + error.message, 'error');
            return false;
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                this.user = data.user;
                this.showNotification('Profile updated successfully', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Profile update failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            this.showNotification('Profile update failed: ' + error.message, 'error');
            return false;
        }
    }

    hasPermission(permission) {
        if (!this.isAuthenticated || !this.user) return false;
        if (this.user.role === 'admin') return true;
        return this.user.permissions[permission] || false;
    }

    hasRole(role) {
        if (!this.isAuthenticated || !this.user) return false;
        return this.user.role === role;
    }

    canAccessDevice(deviceId) {
        if (!this.isAuthenticated || !this.user) return false;
        if (this.user.role === 'admin') return true;
        return this.user.deviceAccess.some(access => 
            access.deviceId === deviceId && 
            (!access.expiresAt || access.expiresAt > new Date())
        );
    }

    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('yahmi_token');
        localStorage.removeItem('yahmi_refresh_token');
    }

    updateUI() {
        // Update navigation based on authentication status
        const authElements = document.querySelectorAll('.auth-required');
        const guestElements = document.querySelectorAll('.guest-only');
        
        authElements.forEach(element => {
            element.style.display = this.isAuthenticated ? 'block' : 'none';
        });
        
        guestElements.forEach(element => {
            element.style.display = this.isAuthenticated ? 'none' : 'block';
        });

        // Update user info
        if (this.isAuthenticated && this.user) {
            const userElements = document.querySelectorAll('.user-name');
            userElements.forEach(element => {
                element.textContent = this.user.firstName + ' ' + this.user.lastName;
            });

            const roleElements = document.querySelectorAll('.user-role');
            roleElements.forEach(element => {
                element.textContent = this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1);
            });
        }
    }

    // Event handlers
    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';

        await this.login(username, password, rememberMe);
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName')
        };

        await this.register(userData);
    }

    async handlePasswordReset(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');

        await this.resetPassword(email);
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.yahmiDashboard && window.yahmiDashboard.showNotification) {
            window.yahmiDashboard.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    // Auto-refresh token before expiration
    startTokenRefresh() {
        setInterval(async () => {
            if (this.isAuthenticated && this.token) {
                try {
                    const tokenData = JSON.parse(atob(this.token.split('.')[1]));
                    const expirationTime = tokenData.exp * 1000;
                    const currentTime = Date.now();
                    const timeUntilExpiry = expirationTime - currentTime;

                    // Refresh token if it expires in less than 5 minutes
                    if (timeUntilExpiry < 5 * 60 * 1000) {
                        await this.refreshAccessToken();
                    }
                } catch (error) {
                    console.error('Token refresh check failed:', error);
                }
            }
        }, 60000); // Check every minute
    }
}

// Initialize authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.yahmiAuth = new YahmiAuth();
    
    // Start token refresh timer
    window.yahmiAuth.startTokenRefresh();
});
