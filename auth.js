/**
 * Authentication System - Frontend JavaScript
 * Works with both HTTP and HTTPS backends
 */

class AuthSystem {
    constructor() {
        this.apiBaseUrl = this.determineApiBaseUrl();
        this.csrfToken = null;
        this.init();
    }

    // Initialize the authentication system
    init() {
        // Load CSRF token
        this.loadCSRFToken();
        
        // Set up form submissions
        this.setupForms();
        
        // Check authentication status
        this.checkAuthStatus();
    }

    // Determine API base URL based on current protocol
    determineApiBaseUrl() {
        // Try to use HTTPS first, fallback to HTTP if needed
        const host = 'veryuniqueusrnm.rf.gd/framework/';
        return window.location.protocol === 'https:' 
            ? `https://${host}`
            : `http://${host}`;
    }

    // Load CSRF token from the server
    async loadCSRFToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}get_csrf.php`, {
                credentials: 'include' // Important for cookies
            });
            
            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrf_token;
            }
        } catch (error) {
            console.error('Failed to load CSRF token:', error);
        }
    }

    // Set up form submissions
    setupForms() {
        // Register form
        if (document.getElementById('registerForm')) {
            document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Login form
        if (document.getElementById('loginForm')) {
            document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Forgot password form
        if (document.getElementById('resetForm')) {
            document.getElementById('resetForm').addEventListener('submit', (e) => this.handlePasswordReset(e));
        }
    }

    // Check authentication status
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}check_auth.php`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && window.location.pathname.includes('login.html')) {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    // Handle registration
    async handleRegister(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('success', 'Registration successful!');
                this.showBackupKeys(data.backup_keys);
            } else {
                this.showMessage('error', data.errors.join(', '));
            }
        } catch (error) {
            this.showMessage('error', 'An error occurred. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = 'dashboard.html';
            } else {
                this.showMessage('error', data.error || 'Invalid credentials');
            }
        } catch (error) {
            this.showMessage('error', 'An error occurred. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Handle password reset
    async handlePasswordReset(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const username = document.getElementById('username').value;
        const backupKey = document.getElementById('backupKey').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}forgot_password.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    username, 
                    backup_key: backupKey, 
                    new_password: newPassword 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('success', 'Password reset successfully!');
                document.getElementById('resetForm').reset();
            } else {
                this.showMessage('error', data.error || 'Reset failed');
            }
        } catch (error) {
            this.showMessage('error', 'An error occurred. Please try again.');
        } finally {
            this.show(false);
        }
    }

    // Show backup keys after registration
    showBackupKeys(keys) {
        const container = document.getElementById('keysContainer');
        const textarea = document.getElementById('backupKeys');
        
        if (container && textarea) {
            container.style.display = 'block';
            textarea.value = keys.join('\n');
            
            // Set up download button
            document.getElementById('downloadKeys').addEventListener('click', () => {
                const blob = new Blob([textarea.value], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'backup_keys.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }

    // Show loading state
    showLoading(show) {
        const buttons = document.querySelectorAll('form button[type="submit"]');
        buttons.forEach(button => {
            button.disabled = show;
            button.innerHTML = show ? '<span class="spinner"></span> Processing...' : button.dataset.originalText;
        });
    }

    // Show messages
    showMessage(type, message) {
        const element = document.getElementById(type === 'success' ? 'success' : 'error');
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            
            if (type === 'error') {
                document.getElementById('success').style.display = 'none';
            } else {
                document.getElementById('error').style.display = 'none';
            }
        }
    }
}

// Initialize the auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
    
    // Store original button text
    document.querySelectorAll('form button[type="submit"]').forEach(button => {
        button.dataset.originalText = button.innerHTML;
    });
});