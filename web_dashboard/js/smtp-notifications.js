// SMTP Email Notifications System
class SMTPNotifications {
    constructor() {
        this.isEnabled = false;
        this.smtpConfig = null;
        this.recipients = [];
        this.templates = {};
        this.notificationQueue = [];
        this.isProcessing = false;
        
        // Notification types
        this.notificationTypes = {
            HUMAN_DETECTION: 'human_detection',
            ANIMAL_DETECTION: 'animal_detection',
            SYSTEM_ALERT: 'system_alert',
            BATTERY_LOW: 'battery_low',
            CONNECTION_LOST: 'connection_lost',
            PATROL_COMPLETE: 'patrol_complete',
            ERROR_ALERT: 'error_alert'
        };
        
        // Priority levels
        this.priorities = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };
        
        this.init();
    }
    
    init() {
        this.loadConfiguration();
        this.setupEventListeners();
        this.startNotificationProcessor();
    }
    
    setupEventListeners() {
        // Email settings
        document.getElementById('emailEnabled')?.addEventListener('change', (e) => {
            this.isEnabled = e.target.checked;
            this.updateEmailStatus();
        });
        
        // SMTP configuration
        document.getElementById('smtpHost')?.addEventListener('input', (e) => {
            this.smtpConfig.host = e.target.value;
            this.saveConfiguration();
        });
        
        document.getElementById('smtpPort')?.addEventListener('input', (e) => {
            this.smtpConfig.port = parseInt(e.target.value);
            this.saveConfiguration();
        });
        
        document.getElementById('smtpUser')?.addEventListener('input', (e) => {
            this.smtpConfig.user = e.target.value;
            this.saveConfiguration();
        });
        
        document.getElementById('smtpPassword')?.addEventListener('input', (e) => {
            this.smtpConfig.password = e.target.value;
            this.saveConfiguration();
        });
        
        document.getElementById('smtpSecure')?.addEventListener('change', (e) => {
            this.smtpConfig.secure = e.target.checked;
            this.saveConfiguration();
        });
        
        // Recipients
        document.getElementById('addRecipientBtn')?.addEventListener('click', () => {
            this.addRecipient();
        });
        
        document.getElementById('testEmailBtn')?.addEventListener('click', () => {
            this.sendTestEmail();
        });
        
        // Notification settings
        document.getElementById('enableHumanAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('human_detection', e.target.checked);
        });
        
        document.getElementById('enableAnimalAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('animal_detection', e.target.checked);
        });
        
        document.getElementById('enableSystemAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('system_alert', e.target.checked);
        });
        
        document.getElementById('enableBatteryAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('battery_low', e.target.checked);
        });
    }
    
    loadConfiguration() {
        // Load from localStorage
        const savedConfig = localStorage.getItem('smtp_config');
        if (savedConfig) {
            this.smtpConfig = JSON.parse(savedConfig);
        } else {
            this.smtpConfig = {
                host: '',
                port: 587,
                user: '',
                password: '',
                secure: false,
                from: '',
                fromName: 'Surveillance Car'
            };
        }
        
        // Load recipients
        const savedRecipients = localStorage.getItem('email_recipients');
        if (savedRecipients) {
            this.recipients = JSON.parse(savedRecipients);
        }
        
        // Load notification settings
        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
            this.notificationSettings = JSON.parse(savedSettings);
        } else {
            this.notificationSettings = {
                human_detection: true,
                animal_detection: true,
                system_alert: true,
                battery_low: true,
                connection_lost: true,
                patrol_complete: false,
                error_alert: true
            };
        }
        
        this.loadEmailTemplates();
    }
    
    loadEmailTemplates() {
        this.templates = {
            [this.notificationTypes.HUMAN_DETECTION]: {
                subject: '🚨 HUMAN DETECTED - Surveillance Alert',
                template: `
                    <h2>Human Detection Alert</h2>
                    <p><strong>Time:</strong> {{timestamp}}</p>
                    <p><strong>Location:</strong> {{location}}</p>
                    <p><strong>Confidence:</strong> {{confidence}}%</p>
                    <p><strong>Description:</strong> {{description}}</p>
                    <p><strong>Actions Taken:</strong></p>
                    <ul>
                        <li>Siren activated</li>
                        <li>Email notification sent</li>
                        <li>Telegram alert sent</li>
                        <li>Detection logged to database</li>
                    </ul>
                    <p>Please check the surveillance dashboard for more details.</p>
                    <p><em>This is an automated message from the Surveillance Car system.</em></p>
                `
            },
            [this.notificationTypes.ANIMAL_DETECTION]: {
                subject: '🐾 Animal Detected - Surveillance Alert',
                template: `
                    <h2>Animal Detection Alert</h2>
                    <p><strong>Time:</strong> {{timestamp}}</p>
                    <p><strong>Location:</strong> {{location}}</p>
                    <p><strong>Confidence:</strong> {{confidence}}%</p>
                    <p><strong>Description:</strong> {{description}}</p>
                    <p><strong>Actions Taken:</strong></p>
                    <ul>
                        <li>Low pitch sound played</li>
                        <li>Detection logged to database</li>
                    </ul>
                    <p>Please check the surveillance dashboard for more details.</p>
                    <p><em>This is an automated message from the Surveillance Car system.</em></p>
                `
            },
            [this.notificationTypes.SYSTEM_ALERT]: {
                subject: '⚠️ System Alert - Surveillance Car',
                template: `
                    <h2>System Alert</h2>
                    <p><strong>Time:</strong> {{timestamp}}</p>
                    <p><strong>Alert Type:</strong> {{alertType}}</p>
                    <p><strong>Message:</strong> {{message}}</p>
                    <p><strong>System Status:</strong></p>
                    <ul>
                        <li>Battery: {{battery}}%</li>
                        <li>Connection: {{connection}}</li>
                        <li>Uptime: {{uptime}}</li>
                    </ul>
                    <p>Please check the surveillance dashboard for more details.</p>
                    <p><em>This is an automated message from the Surveillance Car system.</em></p>
                `
            },
            [this.notificationTypes.BATTERY_LOW]: {
                subject: '🔋 Battery Low - Surveillance Car',
                template: `
                    <h2>Battery Low Alert</h2>
                    <p><strong>Time:</strong> {{timestamp}}</p>
                    <p><strong>Battery Level:</strong> {{battery}}%</p>
                    <p><strong>Voltage:</strong> {{voltage}}V</p>
                    <p><strong>Estimated Time Remaining:</strong> {{timeRemaining}}</p>
                    <p><strong>Recommended Actions:</strong></p>
                    <ul>
                        <li>Return to charging station</li>
                        <li>Reduce power consumption</li>
                        <li>Check battery connections</li>
                    </ul>
                    <p>Please check the surveillance dashboard for more details.</p>
                    <p><em>This is an automated message from the Surveillance Car system.</em></p>
                `
            },
            [this.notificationTypes.CONNECTION_LOST]: {
                subject: '📡 Connection Lost - Surveillance Car',
                template: `
                    <h2>Connection Lost Alert</h2>
                    <p><strong>Time:</strong> {{timestamp}}</p>
                    <p><strong>Last Known Location:</strong> {{location}}</p>
                    <p><strong>Connection Type:</strong> {{connectionType}}</p>
                    <p><strong>Duration:</strong> {{duration}}</p>
                    <p><strong>Attempting to Reconnect:</strong> {{reconnectAttempts}}</p>
                    <p>Please check the surveillance car and network connection.</p>
                    <p><em>This is an automated message from the Surveillance Car system.</em></p>
                `
            }
        };
    }
    
    async sendNotification(type, data, priority = this.priorities.MEDIUM) {
        if (!this.isEnabled || !this.isNotificationEnabled(type)) {
            return false;
        }
        
        const notification = {
            id: this.generateId(),
            type: type,
            data: data,
            priority: priority,
            timestamp: new Date().toISOString(),
            attempts: 0,
            maxAttempts: 3,
            status: 'pending'
        };
        
        this.notificationQueue.push(notification);
        this.processNotificationQueue();
        
        return notification.id;
    }
    
    async sendHumanDetectionAlert(detection) {
        const data = {
            timestamp: new Date(detection.timestamp).toLocaleString(),
            location: detection.location || 'Unknown',
            confidence: Math.round(detection.confidence * 100),
            description: detection.description || 'Human detected by AI system',
            boundingBox: detection.boundingBox
        };
        
        return await this.sendNotification(
            this.notificationTypes.HUMAN_DETECTION,
            data,
            this.priorities.CRITICAL
        );
    }
    
    async sendAnimalDetectionAlert(detection) {
        const data = {
            timestamp: new Date(detection.timestamp).toLocaleString(),
            location: detection.location || 'Unknown',
            confidence: Math.round(detection.confidence * 100),
            description: detection.description || 'Animal detected by AI system',
            boundingBox: detection.boundingBox
        };
        
        return await this.sendNotification(
            this.notificationTypes.ANIMAL_DETECTION,
            data,
            this.priorities.MEDIUM
        );
    }
    
    async sendSystemAlert(alertType, message, systemData = {}) {
        const data = {
            timestamp: new Date().toLocaleString(),
            alertType: alertType,
            message: message,
            battery: systemData.battery || 'Unknown',
            connection: systemData.connection || 'Unknown',
            uptime: systemData.uptime || 'Unknown'
        };
        
        return await this.sendNotification(
            this.notificationTypes.SYSTEM_ALERT,
            data,
            this.priorities.HIGH
        );
    }
    
    async sendBatteryLowAlert(batteryData) {
        const data = {
            timestamp: new Date().toLocaleString(),
            battery: batteryData.percentage || 'Unknown',
            voltage: batteryData.voltage || 'Unknown',
            timeRemaining: this.calculateTimeRemaining(batteryData.percentage)
        };
        
        return await this.sendNotification(
            this.notificationTypes.BATTERY_LOW,
            data,
            this.priorities.HIGH
        );
    }
    
    async sendConnectionLostAlert(connectionData) {
        const data = {
            timestamp: new Date().toLocaleString(),
            location: connectionData.location || 'Unknown',
            connectionType: connectionData.type || 'WiFi',
            duration: connectionData.duration || 'Unknown',
            reconnectAttempts: connectionData.attempts || 0
        };
        
        return await this.sendNotification(
            this.notificationTypes.CONNECTION_LOST,
            data,
            this.priorities.CRITICAL
        );
    }
    
    async processNotificationQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            
            try {
                await this.sendEmail(notification);
                notification.status = 'sent';
                this.logNotification('Email sent successfully', 'info', notification);
            } catch (error) {
                notification.attempts++;
                notification.status = 'failed';
                
                if (notification.attempts < notification.maxAttempts) {
                    // Retry after delay
                    setTimeout(() => {
                        this.notificationQueue.push(notification);
                        this.processNotificationQueue();
                    }, 5000 * notification.attempts); // Exponential backoff
                } else {
                    this.logNotification('Email failed after max attempts: ' + error.message, 'error', notification);
                }
            }
        }
        
        this.isProcessing = false;
    }
    
    async sendEmail(notification) {
        if (!this.smtpConfig.host || !this.smtpConfig.user || !this.smtpConfig.password) {
            throw new Error('SMTP configuration incomplete');
        }
        
        if (this.recipients.length === 0) {
            throw new Error('No email recipients configured');
        }
        
        const template = this.templates[notification.type];
        if (!template) {
            throw new Error('Email template not found for type: ' + notification.type);
        }
        
        const emailData = {
            from: `${this.smtpConfig.fromName} <${this.smtpConfig.from || this.smtpConfig.user}>`,
            to: this.recipients.map(r => r.email).join(', '),
            subject: this.replaceTemplateVariables(template.subject, notification.data),
            html: this.replaceTemplateVariables(template.template, notification.data),
            text: this.stripHtml(this.replaceTemplateVariables(template.template, notification.data))
        };
        
        // Send via server-side API
        const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                smtpConfig: this.smtpConfig,
                emailData: emailData
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send email');
        }
        
        return true;
    }
    
    async sendTestEmail() {
        if (!this.smtpConfig.host || !this.smtpConfig.user || !this.smtpConfig.password) {
            this.showAlert('Configuration Error', 'Please configure SMTP settings first.');
            return;
        }
        
        if (this.recipients.length === 0) {
            this.showAlert('Configuration Error', 'Please add at least one email recipient.');
            return;
        }
        
        try {
            const testNotification = {
                type: this.notificationTypes.SYSTEM_ALERT,
                data: {
                    timestamp: new Date().toLocaleString(),
                    alertType: 'Test Email',
                    message: 'This is a test email from the Surveillance Car system.',
                    battery: '100%',
                    connection: 'Connected',
                    uptime: '1 hour'
                },
                priority: this.priorities.LOW
            };
            
            await this.sendEmail(testNotification);
            this.showAlert('Test Email Sent', 'Test email sent successfully to all recipients.');
        } catch (error) {
            this.showAlert('Test Email Failed', 'Failed to send test email: ' + error.message);
        }
    }
    
    replaceTemplateVariables(template, data) {
        let result = template;
        
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return result;
    }
    
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    calculateTimeRemaining(batteryPercentage) {
        if (!batteryPercentage || batteryPercentage < 0) {
            return 'Unknown';
        }
        
        // Rough estimation based on battery percentage
        const minutesPerPercent = 2; // Assume 2 minutes per percent
        const remainingMinutes = batteryPercentage * minutesPerPercent;
        
        if (remainingMinutes < 60) {
            return `${Math.round(remainingMinutes)} minutes`;
        } else {
            const hours = Math.floor(remainingMinutes / 60);
            const minutes = Math.round(remainingMinutes % 60);
            return `${hours}h ${minutes}m`;
        }
    }
    
    addRecipient() {
        const emailInput = document.getElementById('recipientEmail');
        const nameInput = document.getElementById('recipientName');
        
        if (!emailInput || !nameInput) return;
        
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        
        if (!email || !this.isValidEmail(email)) {
            this.showAlert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        const recipient = {
            id: this.generateId(),
            email: email,
            name: name || email,
            addedAt: new Date().toISOString()
        };
        
        this.recipients.push(recipient);
        this.saveConfiguration();
        this.updateRecipientsList();
        
        // Clear inputs
        emailInput.value = '';
        nameInput.value = '';
    }
    
    removeRecipient(recipientId) {
        this.recipients = this.recipients.filter(r => r.id !== recipientId);
        this.saveConfiguration();
        this.updateRecipientsList();
    }
    
    updateRecipientsList() {
        const container = document.getElementById('recipientsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.recipients.forEach(recipient => {
            const recipientElement = document.createElement('div');
            recipientElement.className = 'recipient-item';
            recipientElement.innerHTML = `
                <div class="recipient-info">
                    <strong>${recipient.name}</strong>
                    <span>${recipient.email}</span>
                </div>
                <button class="btn btn-danger btn-sm" onclick="window.smtpNotifications.removeRecipient('${recipient.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(recipientElement);
        });
    }
    
    updateNotificationSetting(type, enabled) {
        this.notificationSettings[type] = enabled;
        this.saveConfiguration();
    }
    
    isNotificationEnabled(type) {
        return this.notificationSettings[type] || false;
    }
    
    updateEmailStatus() {
        const statusElement = document.getElementById('emailStatus');
        if (statusElement) {
            if (this.isEnabled) {
                statusElement.className = 'status-indicator connected';
                statusElement.querySelector('span').textContent = 'Email Enabled';
            } else {
                statusElement.className = 'status-indicator disconnected';
                statusElement.querySelector('span').textContent = 'Email Disabled';
            }
        }
    }
    
    startNotificationProcessor() {
        // Process notification queue every 30 seconds
        setInterval(() => {
            this.processNotificationQueue();
        }, 30000);
    }
    
    saveConfiguration() {
        localStorage.setItem('smtp_config', JSON.stringify(this.smtpConfig));
        localStorage.setItem('email_recipients', JSON.stringify(this.recipients));
        localStorage.setItem('notification_settings', JSON.stringify(this.notificationSettings));
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    logNotification(message, level, notification) {
        if (window.systemLogs) {
            window.systemLogs.addLog(message, level, 'email', notification);
        }
    }
    
    showAlert(title, message) {
        if (window.dashboard) {
            window.dashboard.showAlert(title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    // Public methods for external use
    getConfiguration() {
        return {
            smtpConfig: this.smtpConfig,
            recipients: this.recipients,
            notificationSettings: this.notificationSettings,
            isEnabled: this.isEnabled
        };
    }
    
    getNotificationHistory() {
        return this.notificationQueue.filter(n => n.status === 'sent');
    }
    
    getPendingNotifications() {
        return this.notificationQueue.filter(n => n.status === 'pending');
    }
}

// Initialize SMTP Notifications
document.addEventListener('DOMContentLoaded', () => {
    window.smtpNotifications = new SMTPNotifications();
});
