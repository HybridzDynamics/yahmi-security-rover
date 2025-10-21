// Telegram Bot Integration for Surveillance Car Alerts
class TelegramBot {
    constructor() {
        this.botToken = null;
        this.chatId = null;
        this.isEnabled = false;
        this.botUsername = null;
        this.webhookUrl = null;
        this.notificationSettings = {};
        this.messageQueue = [];
        this.isProcessing = false;
        
        // Message types
        this.messageTypes = {
            HUMAN_DETECTION: 'human_detection',
            ANIMAL_DETECTION: 'animal_detection',
            SYSTEM_ALERT: 'system_alert',
            BATTERY_LOW: 'battery_low',
            CONNECTION_LOST: 'connection_lost',
            PATROL_STATUS: 'patrol_status',
            ERROR_ALERT: 'error_alert',
            STATUS_UPDATE: 'status_update'
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
        this.startMessageProcessor();
        this.initializeBot();
    }
    
    setupEventListeners() {
        // Bot configuration
        document.getElementById('telegramEnabled')?.addEventListener('change', (e) => {
            this.isEnabled = e.target.checked;
            this.updateTelegramStatus();
        });
        
        document.getElementById('botToken')?.addEventListener('input', (e) => {
            this.botToken = e.target.value;
            this.saveConfiguration();
        });
        
        document.getElementById('chatId')?.addEventListener('input', (e) => {
            this.chatId = e.target.value;
            this.saveConfiguration();
        });
        
        // Test bot connection
        document.getElementById('testTelegramBtn')?.addEventListener('click', () => {
            this.testBotConnection();
        });
        
        // Get bot info
        document.getElementById('getBotInfoBtn')?.addEventListener('click', () => {
            this.getBotInfo();
        });
        
        // Notification settings
        document.getElementById('enableTelegramHumanAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('human_detection', e.target.checked);
        });
        
        document.getElementById('enableTelegramAnimalAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('animal_detection', e.target.checked);
        });
        
        document.getElementById('enableTelegramSystemAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('system_alert', e.target.checked);
        });
        
        document.getElementById('enableTelegramBatteryAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('battery_low', e.target.checked);
        });
        
        document.getElementById('enableTelegramConnectionAlerts')?.addEventListener('change', (e) => {
            this.updateNotificationSetting('connection_lost', e.target.checked);
        });
    }
    
    loadConfiguration() {
        // Load bot token
        this.botToken = localStorage.getItem('telegram_bot_token') || '';
        
        // Load chat ID
        this.chatId = localStorage.getItem('telegram_chat_id') || '';
        
        // Load notification settings
        const savedSettings = localStorage.getItem('telegram_notification_settings');
        if (savedSettings) {
            this.notificationSettings = JSON.parse(savedSettings);
        } else {
            this.notificationSettings = {
                human_detection: true,
                animal_detection: true,
                system_alert: true,
                battery_low: true,
                connection_lost: true,
                patrol_status: false,
                error_alert: true,
                status_update: false
            };
        }
        
        // Load enabled state
        this.isEnabled = localStorage.getItem('telegram_enabled') === 'true';
    }
    
    async initializeBot() {
        if (!this.botToken) {
            console.warn('Telegram bot token not configured');
            return;
        }
        
        try {
            await this.getBotInfo();
            this.setupWebhook();
            console.log('Telegram bot initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Telegram bot:', error);
            this.showError('Telegram bot initialization failed: ' + error.message);
        }
    }
    
    async getBotInfo() {
        if (!this.botToken) {
            throw new Error('Bot token not configured');
        }
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
            const data = await response.json();
            
            if (data.ok) {
                this.botUsername = data.result.username;
                this.updateBotInfo(data.result);
                return data.result;
            } else {
                throw new Error(data.description || 'Failed to get bot info');
            }
        } catch (error) {
            console.error('Failed to get bot info:', error);
            throw error;
        }
    }
    
    async setupWebhook() {
        if (!this.botToken || !this.webhookUrl) {
            return;
        }
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: this.webhookUrl,
                    allowed_updates: ['message']
                })
            });
            
            const data = await response.json();
            if (!data.ok) {
                console.warn('Failed to set webhook:', data.description);
            }
        } catch (error) {
            console.error('Failed to setup webhook:', error);
        }
    }
    
    async sendMessage(type, data, priority = this.priorities.MEDIUM) {
        if (!this.isEnabled || !this.botToken || !this.chatId) {
            return false;
        }
        
        if (!this.isNotificationEnabled(type)) {
            return false;
        }
        
        const message = {
            id: this.generateId(),
            type: type,
            data: data,
            priority: priority,
            timestamp: new Date().toISOString(),
            attempts: 0,
            maxAttempts: 3,
            status: 'pending'
        };
        
        this.messageQueue.push(message);
        this.processMessageQueue();
        
        return message.id;
    }
    
    async sendHumanDetectionAlert(detection) {
        const data = {
            timestamp: new Date(detection.timestamp).toLocaleString(),
            location: detection.location || 'Unknown',
            confidence: Math.round(detection.confidence * 100),
            description: detection.description || 'Human detected by AI system',
            boundingBox: detection.boundingBox
        };
        
        return await this.sendMessage(
            this.messageTypes.HUMAN_DETECTION,
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
        
        return await this.sendMessage(
            this.messageTypes.ANIMAL_DETECTION,
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
        
        return await this.sendMessage(
            this.messageTypes.SYSTEM_ALERT,
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
        
        return await this.sendMessage(
            this.messageTypes.BATTERY_LOW,
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
        
        return await this.sendMessage(
            this.messageTypes.CONNECTION_LOST,
            data,
            this.priorities.CRITICAL
        );
    }
    
    async sendPatrolStatusUpdate(patrolData) {
        const data = {
            timestamp: new Date().toLocaleString(),
            status: patrolData.status || 'Unknown',
            progress: patrolData.progress || 0,
            location: patrolData.location || 'Unknown',
            nextWaypoint: patrolData.nextWaypoint || 'Unknown',
            estimatedCompletion: patrolData.estimatedCompletion || 'Unknown'
        };
        
        return await this.sendMessage(
            this.messageTypes.PATROL_STATUS,
            data,
            this.priorities.LOW
        );
    }
    
    async processMessageQueue() {
        if (this.isProcessing || this.messageQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            
            try {
                await this.sendTelegramMessage(message);
                message.status = 'sent';
                this.logMessage('Telegram message sent successfully', 'info', message);
            } catch (error) {
                message.attempts++;
                message.status = 'failed';
                
                if (message.attempts < message.maxAttempts) {
                    // Retry after delay
                    setTimeout(() => {
                        this.messageQueue.push(message);
                        this.processMessageQueue();
                    }, 5000 * message.attempts); // Exponential backoff
                } else {
                    this.logMessage('Telegram message failed after max attempts: ' + error.message, 'error', message);
                }
            }
        }
        
        this.isProcessing = false;
    }
    
    async sendTelegramMessage(message) {
        if (!this.botToken || !this.chatId) {
            throw new Error('Bot token or chat ID not configured');
        }
        
        const text = this.formatMessage(message);
        const parseMode = this.getParseMode(message.type);
        
        const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: this.chatId,
                text: text,
                parse_mode: parseMode,
                disable_web_page_preview: true
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(data.description || 'Failed to send message');
        }
        
        return data.result;
    }
    
    formatMessage(message) {
        const type = message.type;
        const data = message.data;
        
        switch (type) {
            case this.messageTypes.HUMAN_DETECTION:
                return this.formatHumanDetectionMessage(data);
            case this.messageTypes.ANIMAL_DETECTION:
                return this.formatAnimalDetectionMessage(data);
            case this.messageTypes.SYSTEM_ALERT:
                return this.formatSystemAlertMessage(data);
            case this.messageTypes.BATTERY_LOW:
                return this.formatBatteryLowMessage(data);
            case this.messageTypes.CONNECTION_LOST:
                return this.formatConnectionLostMessage(data);
            case this.messageTypes.PATROL_STATUS:
                return this.formatPatrolStatusMessage(data);
            default:
                return this.formatGenericMessage(data);
        }
    }
    
    formatHumanDetectionMessage(data) {
        return `🚨 *HUMAN DETECTED* 🚨

🕐 *Time:* ${data.timestamp}
📍 *Location:* ${data.location}
🎯 *Confidence:* ${data.confidence}%
📝 *Description:* ${data.description}

⚡ *Actions Taken:*
• Siren activated
• Email notification sent
• Telegram alert sent
• Detection logged to database

🔍 Check the surveillance dashboard for more details.

_This is an automated message from the Surveillance Car system._`;
    }
    
    formatAnimalDetectionMessage(data) {
        return `🐾 *Animal Detected* 🐾

🕐 *Time:* ${data.timestamp}
📍 *Location:* ${data.location}
🎯 *Confidence:* ${data.confidence}%
📝 *Description:* ${data.description}

⚡ *Actions Taken:*
• Low pitch sound played
• Detection logged to database

🔍 Check the surveillance dashboard for more details.

_This is an automated message from the Surveillance Car system._`;
    }
    
    formatSystemAlertMessage(data) {
        return `⚠️ *System Alert* ⚠️

🕐 *Time:* ${data.timestamp}
🚨 *Alert Type:* ${data.alertType}
📝 *Message:* ${data.message}

📊 *System Status:*
• Battery: ${data.battery}
• Connection: ${data.connection}
• Uptime: ${data.uptime}

🔍 Check the surveillance dashboard for more details.

_This is an automated message from the Surveillance Car system._`;
    }
    
    formatBatteryLowMessage(data) {
        return `🔋 *Battery Low Alert* 🔋

🕐 *Time:* ${data.timestamp}
⚡ *Battery Level:* ${data.battery}%
🔌 *Voltage:* ${data.voltage}V
⏰ *Estimated Time Remaining:* ${data.timeRemaining}

💡 *Recommended Actions:*
• Return to charging station
• Reduce power consumption
• Check battery connections

🔍 Check the surveillance dashboard for more details.

_This is an automated message from the Surveillance Car system._`;
    }
    
    formatConnectionLostMessage(data) {
        return `📡 *Connection Lost Alert* 📡

🕐 *Time:* ${data.timestamp}
📍 *Last Known Location:* ${data.location}
📶 *Connection Type:* ${data.connectionType}
⏱️ *Duration:* ${data.duration}
🔄 *Reconnect Attempts:* ${data.reconnectAttempts}

⚠️ Please check the surveillance car and network connection.

_This is an automated message from the Surveillance Car system._`;
    }
    
    formatPatrolStatusMessage(data) {
        return `🛣️ *Patrol Status Update* 🛣️

🕐 *Time:* ${data.timestamp}
📊 *Status:* ${data.status}
📍 *Location:* ${data.location}
🎯 *Progress:* ${data.progress}%
➡️ *Next Waypoint:* ${data.nextWaypoint}
⏰ *Estimated Completion:* ${data.estimatedCompletion}

_This is an automated message from the Surveillance Car system._`;
    }
    
    formatGenericMessage(data) {
        return `📢 *System Notification*

🕐 *Time:* ${data.timestamp || new Date().toLocaleString()}
📝 *Message:* ${data.message || 'System notification'}

_This is an automated message from the Surveillance Car system._`;
    }
    
    getParseMode(messageType) {
        // Use Markdown for most messages
        return 'Markdown';
    }
    
    calculateTimeRemaining(batteryPercentage) {
        if (!batteryPercentage || batteryPercentage < 0) {
            return 'Unknown';
        }
        
        const minutesPerPercent = 2;
        const remainingMinutes = batteryPercentage * minutesPerPercent;
        
        if (remainingMinutes < 60) {
            return `${Math.round(remainingMinutes)} minutes`;
        } else {
            const hours = Math.floor(remainingMinutes / 60);
            const minutes = Math.round(remainingMinutes % 60);
            return `${hours}h ${minutes}m`;
        }
    }
    
    async testBotConnection() {
        if (!this.botToken) {
            this.showAlert('Configuration Error', 'Please enter a bot token first.');
            return;
        }
        
        if (!this.chatId) {
            this.showAlert('Configuration Error', 'Please enter a chat ID first.');
            return;
        }
        
        try {
            const testMessage = {
                type: this.messageTypes.SYSTEM_ALERT,
                data: {
                    timestamp: new Date().toLocaleString(),
                    alertType: 'Test Message',
                    message: 'This is a test message from the Surveillance Car system.',
                    battery: '100%',
                    connection: 'Connected',
                    uptime: '1 hour'
                },
                priority: this.priorities.LOW
            };
            
            await this.sendTelegramMessage(testMessage);
            this.showAlert('Test Message Sent', 'Test message sent successfully to Telegram.');
        } catch (error) {
            this.showAlert('Test Message Failed', 'Failed to send test message: ' + error.message);
        }
    }
    
    updateNotificationSetting(type, enabled) {
        this.notificationSettings[type] = enabled;
        this.saveConfiguration();
    }
    
    isNotificationEnabled(type) {
        return this.notificationSettings[type] || false;
    }
    
    updateTelegramStatus() {
        const statusElement = document.getElementById('telegramStatus');
        if (statusElement) {
            if (this.isEnabled) {
                statusElement.className = 'status-indicator connected';
                statusElement.querySelector('span').textContent = 'Telegram Enabled';
            } else {
                statusElement.className = 'status-indicator disconnected';
                statusElement.querySelector('span').textContent = 'Telegram Disabled';
            }
        }
    }
    
    updateBotInfo(botInfo) {
        const botInfoElement = document.getElementById('botInfo');
        if (botInfoElement) {
            botInfoElement.innerHTML = `
                <div class="bot-info">
                    <h4>Bot Information</h4>
                    <div class="bot-details">
                        <div class="bot-detail">
                            <strong>Name:</strong> ${botInfo.first_name}
                        </div>
                        <div class="bot-detail">
                            <strong>Username:</strong> @${botInfo.username}
                        </div>
                        <div class="bot-detail">
                            <strong>ID:</strong> ${botInfo.id}
                        </div>
                        <div class="bot-detail">
                            <strong>Can Join Groups:</strong> ${botInfo.can_join_groups ? 'Yes' : 'No'}
                        </div>
                        <div class="bot-detail">
                            <strong>Can Read All Group Messages:</strong> ${botInfo.can_read_all_group_messages ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    startMessageProcessor() {
        // Process message queue every 30 seconds
        setInterval(() => {
            this.processMessageQueue();
        }, 30000);
    }
    
    saveConfiguration() {
        localStorage.setItem('telegram_bot_token', this.botToken);
        localStorage.setItem('telegram_chat_id', this.chatId);
        localStorage.setItem('telegram_notification_settings', JSON.stringify(this.notificationSettings));
        localStorage.setItem('telegram_enabled', this.isEnabled.toString());
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    logMessage(message, level, telegramMessage) {
        if (window.systemLogs) {
            window.systemLogs.addLog(message, level, 'telegram', telegramMessage);
        }
    }
    
    showAlert(title, message) {
        if (window.dashboard) {
            window.dashboard.showAlert(title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    showError(message) {
        if (window.dashboard) {
            window.dashboard.showAlert('Telegram Error', message);
        } else {
            console.error(message);
        }
    }
    
    // Public methods for external use
    getConfiguration() {
        return {
            botToken: this.botToken,
            chatId: this.chatId,
            notificationSettings: this.notificationSettings,
            isEnabled: this.isEnabled,
            botUsername: this.botUsername
        };
    }
    
    getMessageHistory() {
        return this.messageQueue.filter(m => m.status === 'sent');
    }
    
    getPendingMessages() {
        return this.messageQueue.filter(m => m.status === 'pending');
    }
    
    // Handle incoming webhook messages
    handleWebhookUpdate(update) {
        if (update.message) {
            this.handleIncomingMessage(update.message);
        }
    }
    
    handleIncomingMessage(message) {
        // Handle incoming messages from users
        const chatId = message.chat.id;
        const text = message.text;
        const from = message.from;
        
        console.log('Received message:', { chatId, text, from });
        
        // Process commands
        if (text.startsWith('/')) {
            this.handleCommand(text, chatId, from);
        }
    }
    
    handleCommand(command, chatId, from) {
        const cmd = command.toLowerCase();
        
        switch (cmd) {
            case '/start':
                this.sendCommandResponse(chatId, 'Welcome to the Surveillance Car bot! Use /help for available commands.');
                break;
            case '/help':
                this.sendCommandResponse(chatId, this.getHelpMessage());
                break;
            case '/status':
                this.sendSystemStatus(chatId);
                break;
            case '/battery':
                this.sendBatteryStatus(chatId);
                break;
            case '/location':
                this.sendLocationStatus(chatId);
                break;
            default:
                this.sendCommandResponse(chatId, 'Unknown command. Use /help for available commands.');
        }
    }
    
    async sendCommandResponse(chatId, text) {
        try {
            await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch (error) {
            console.error('Failed to send command response:', error);
        }
    }
    
    getHelpMessage() {
        return `🤖 *Surveillance Car Bot Commands*

/start - Start the bot
/help - Show this help message
/status - Get system status
/battery - Get battery status
/location - Get current location

📱 *Available Notifications:*
• Human detection alerts
• Animal detection alerts
• System alerts
• Battery low warnings
• Connection status updates

🔧 *Configuration:*
Configure notification settings in the web dashboard.`;
    }
    
    async sendSystemStatus(chatId) {
        // Get current system status and send to user
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                const status = await response.json();
                const message = this.formatSystemStatusMessage(status);
                await this.sendCommandResponse(chatId, message);
            }
        } catch (error) {
            await this.sendCommandResponse(chatId, 'Failed to get system status.');
        }
    }
    
    formatSystemStatusMessage(status) {
        return `📊 *System Status*

🕐 *Time:* ${new Date().toLocaleString()}
🔋 *Battery:* ${status.battery || 'Unknown'}%
📶 *Connection:* ${status.connection || 'Unknown'}
⏱️ *Uptime:* ${status.uptime || 'Unknown'}
💾 *Free Heap:* ${status.freeHeap || 'Unknown'} bytes
🌡️ *CPU Frequency:* ${status.cpuFreq || 'Unknown'} MHz

_Last updated: ${new Date().toLocaleString()}_`;
    }
}

// Initialize Telegram Bot
document.addEventListener('DOMContentLoaded', () => {
    window.telegramBot = new TelegramBot();
});
