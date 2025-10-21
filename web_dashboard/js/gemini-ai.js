// Gemini AI Integration for Animal/Human Detection
class GeminiAI {
    constructor() {
        this.apiKey = null;
        this.model = 'gemini-1.5-flash';
        this.isEnabled = false;
        this.detectionThreshold = 0.7;
        this.detectionTypes = ['human', 'animal', 'vehicle', 'object'];
        this.lastDetection = null;
        this.detectionHistory = [];
        this.maxHistorySize = 100;
        
        // Detection settings
        this.settings = {
            enableHumanDetection: true,
            enableAnimalDetection: true,
            enableVehicleDetection: false,
            enableObjectDetection: false,
            confidenceThreshold: 0.7,
            maxDetectionsPerFrame: 5,
            detectionCooldown: 1000, // 1 second
            imageQuality: 'medium', // low, medium, high
            imageFormat: 'jpeg'
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.initializeAPI();
    }
    
    setupEventListeners() {
        // AI toggle
        document.getElementById('aiEnabled')?.addEventListener('change', (e) => {
            this.toggleAI(e.target.checked);
        });
        
        // Detection mode
        document.querySelectorAll('input[name="detectionMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setDetectionMode(e.target.value);
            });
        });
        
        // Confidence threshold
        document.getElementById('confidenceThreshold')?.addEventListener('input', (e) => {
            this.settings.confidenceThreshold = parseFloat(e.target.value);
            this.updateSettings();
        });
        
        // Detection types
        document.getElementById('enableHumanDetection')?.addEventListener('change', (e) => {
            this.settings.enableHumanDetection = e.target.checked;
            this.updateSettings();
        });
        
        document.getElementById('enableAnimalDetection')?.addEventListener('change', (e) => {
            this.settings.enableAnimalDetection = e.target.checked;
            this.updateSettings();
        });
        
        document.getElementById('enableVehicleDetection')?.addEventListener('change', (e) => {
            this.settings.enableVehicleDetection = e.target.checked;
            this.updateSettings();
        });
        
        document.getElementById('enableObjectDetection')?.addEventListener('change', (e) => {
            this.settings.enableObjectDetection = e.target.checked;
            this.updateSettings();
        });
    }
    
    async initializeAPI() {
        try {
            // Load API key from settings or environment
            this.apiKey = await this.getAPIKey();
            
            if (!this.apiKey) {
                console.warn('Gemini API key not found. AI detection will be disabled.');
                this.showAPIKeyWarning();
                return;
            }
            
            // Test API connection
            await this.testAPIConnection();
            console.log('Gemini AI initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Gemini AI:', error);
            this.showError('Failed to initialize AI system: ' + error.message);
        }
    }
    
    async getAPIKey() {
        // Try to get from localStorage first
        let apiKey = localStorage.getItem('gemini_api_key');
        
        if (!apiKey) {
            // Try to get from server
            try {
                const response = await fetch('/api/ai/config');
                if (response.ok) {
                    const config = await response.json();
                    apiKey = config.apiKey;
                }
            } catch (error) {
                console.warn('Could not fetch API key from server:', error);
            }
        }
        
        return apiKey;
    }
    
    async testAPIConnection() {
        const testPrompt = "Test connection";
        
        try {
            const response = await this.callGeminiAPI(testPrompt);
            return response.success;
        } catch (error) {
            throw new Error('API connection test failed: ' + error.message);
        }
    }
    
    async analyzeImage(imageData, imageType = 'jpeg') {
        if (!this.isEnabled || !this.apiKey) {
            throw new Error('AI detection is not enabled or API key is missing');
        }
        
        try {
            // Convert image to base64
            const base64Image = await this.imageToBase64(imageData, imageType);
            
            // Create detection prompt
            const prompt = this.createDetectionPrompt();
            
            // Call Gemini API
            const response = await this.callGeminiAPI(prompt, base64Image);
            
            if (response.success) {
                const detections = this.parseDetectionResponse(response.data);
                this.processDetections(detections);
                return detections;
            } else {
                throw new Error(response.error || 'Detection failed');
            }
            
        } catch (error) {
            console.error('Image analysis failed:', error);
            this.addDetectionLog('Image analysis failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    createDetectionPrompt() {
        const enabledTypes = [];
        
        if (this.settings.enableHumanDetection) enabledTypes.push('human');
        if (this.settings.enableAnimalDetection) enabledTypes.push('animal');
        if (this.settings.enableVehicleDetection) enabledTypes.push('vehicle');
        if (this.settings.enableObjectDetection) enabledTypes.push('object');
        
        return `Analyze this surveillance camera image and detect any ${enabledTypes.join(', ')}. 
        
        For each detection, provide:
        1. Object type (${enabledTypes.join(', ')})
        2. Confidence level (0.0 to 1.0)
        3. Bounding box coordinates (x, y, width, height)
        4. Description of the object
        
        Only return detections with confidence >= ${this.settings.confidenceThreshold}.
        Maximum ${this.settings.maxDetectionsPerFrame} detections per image.
        
        Return the results in JSON format:
        {
            "detections": [
                {
                    "type": "human|animal|vehicle|object",
                    "confidence": 0.95,
                    "boundingBox": {"x": 100, "y": 50, "width": 80, "height": 120},
                    "description": "Person walking"
                }
            ]
        }`;
    }
    
    async callGeminiAPI(prompt, imageData = null) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: []
            }]
        };
        
        // Add text prompt
        requestBody.contents[0].parts.push({
            text: prompt
        });
        
        // Add image if provided
        if (imageData) {
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: `image/${imageData.includes('data:') ? imageData.split(';')[0].split(':')[1] : 'jpeg'}`,
                    data: imageData.includes('data:') ? imageData.split(',')[1] : imageData
                }
            });
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const content = data.candidates[0].content.parts[0].text;
                
                try {
                    // Try to parse as JSON
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsedData = JSON.parse(jsonMatch[0]);
                        return {
                            success: true,
                            data: parsedData
                        };
                    } else {
                        // Fallback: try to extract information from text
                        return {
                            success: true,
                            data: this.parseTextResponse(content)
                        };
                    }
                } catch (parseError) {
                    console.warn('Failed to parse JSON response, using text parsing:', parseError);
                    return {
                        success: true,
                        data: this.parseTextResponse(content)
                    };
                }
            } else {
                throw new Error('Invalid response format from Gemini API');
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    parseTextResponse(text) {
        // Fallback parser for when JSON parsing fails
        const detections = [];
        
        // Look for detection patterns in the text
        const lines = text.split('\n');
        let currentDetection = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('type:') || trimmedLine.includes('Type:')) {
                if (currentDetection) {
                    detections.push(currentDetection);
                }
                currentDetection = {
                    type: this.extractValue(trimmedLine, ['type:', 'Type:']),
                    confidence: 0.8, // Default confidence
                    boundingBox: { x: 0, y: 0, width: 100, height: 100 },
                    description: ''
                };
            } else if (trimmedLine.includes('confidence:') || trimmedLine.includes('Confidence:')) {
                if (currentDetection) {
                    currentDetection.confidence = parseFloat(this.extractValue(trimmedLine, ['confidence:', 'Confidence:'])) || 0.8;
                }
            } else if (trimmedLine.includes('description:') || trimmedLine.includes('Description:')) {
                if (currentDetection) {
                    currentDetection.description = this.extractValue(trimmedLine, ['description:', 'Description:']);
                }
            }
        }
        
        if (currentDetection) {
            detections.push(currentDetection);
        }
        
        return { detections };
    }
    
    extractValue(line, patterns) {
        for (const pattern of patterns) {
            const index = line.indexOf(pattern);
            if (index !== -1) {
                return line.substring(index + pattern.length).trim();
            }
        }
        return '';
    }
    
    parseDetectionResponse(response) {
        if (!response.detections || !Array.isArray(response.detections)) {
            return [];
        }
        
        return response.detections.filter(detection => {
            return detection.confidence >= this.settings.confidenceThreshold &&
                   this.isDetectionTypeEnabled(detection.type);
        });
    }
    
    isDetectionTypeEnabled(type) {
        switch (type.toLowerCase()) {
            case 'human':
                return this.settings.enableHumanDetection;
            case 'animal':
                return this.settings.enableAnimalDetection;
            case 'vehicle':
                return this.settings.enableVehicleDetection;
            case 'object':
                return this.settings.enableObjectDetection;
            default:
                return false;
        }
    }
    
    processDetections(detections) {
        if (detections.length === 0) return;
        
        // Add to detection history
        detections.forEach(detection => {
            this.addDetectionToHistory(detection);
        });
        
        // Trigger alerts for high-priority detections
        detections.forEach(detection => {
            if (detection.type === 'human' && detection.confidence > 0.8) {
                this.triggerHumanDetectionAlert(detection);
            } else if (detection.type === 'animal' && detection.confidence > 0.7) {
                this.triggerAnimalDetectionAlert(detection);
            }
        });
        
        // Update UI
        this.updateDetectionUI(detections);
        
        // Log detection
        this.addDetectionLog(`Detected ${detections.length} objects`, 'info');
    }
    
    addDetectionToHistory(detection) {
        const detectionRecord = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: detection.type,
            confidence: detection.confidence,
            boundingBox: detection.boundingBox,
            description: detection.description
        };
        
        this.detectionHistory.unshift(detectionRecord);
        
        // Keep only recent detections
        if (this.detectionHistory.length > this.maxHistorySize) {
            this.detectionHistory = this.detectionHistory.slice(0, this.maxHistorySize);
        }
        
        this.lastDetection = detectionRecord;
    }
    
    triggerHumanDetectionAlert(detection) {
        // Show visual alert
        this.showDetectionOverlay(detection.boundingBox, 'HUMAN', detection.confidence);
        
        // Show modal alert
        this.showDetectionAlert('Human Detected', 
            `A human has been detected with ${Math.round(detection.confidence * 100)}% confidence.`);
        
        // Trigger audio alert
        this.playSirenAlert();
        
        // Send notifications
        this.sendHumanDetectionNotifications(detection);
        
        // Log the detection
        this.addDetectionLog('HUMAN DETECTED - High priority alert triggered', 'critical');
    }
    
    triggerAnimalDetectionAlert(detection) {
        // Show visual alert
        this.showDetectionOverlay(detection.boundingBox, 'ANIMAL', detection.confidence);
        
        // Show modal alert
        this.showDetectionAlert('Animal Detected', 
            `An animal has been detected with ${Math.round(detection.confidence * 100)}% confidence.`);
        
        // Trigger audio alert
        this.playLowPitchAlert();
        
        // Log the detection
        this.addDetectionLog('ANIMAL DETECTED - Alert triggered', 'warning');
    }
    
    async sendHumanDetectionNotifications(detection) {
        // Send email notification
        try {
            await fetch('/api/notifications/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'human_detection',
                    detection: detection,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send email notification:', error);
        }
        
        // Send Telegram notification
        try {
            await fetch('/api/notifications/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'human_detection',
                    detection: detection,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send Telegram notification:', error);
        }
    }
    
    showDetectionOverlay(boundingBox, type, confidence) {
        const overlay = document.getElementById('aiDetectionOverlay');
        const box = document.getElementById('detectionBox');
        const label = document.getElementById('detectionLabel');
        
        if (overlay && box && label) {
            box.style.left = boundingBox.x + 'px';
            box.style.top = boundingBox.y + 'px';
            box.style.width = boundingBox.width + 'px';
            box.style.height = boundingBox.height + 'px';
            box.style.display = 'block';
            
            label.textContent = `${type} (${Math.round(confidence * 100)}%)`;
            label.style.left = boundingBox.x + 'px';
            label.style.top = (boundingBox.y - 25) + 'px';
            label.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
                box.style.display = 'none';
                label.style.display = 'none';
            }, 5000);
        }
    }
    
    showDetectionAlert(title, message) {
        const modal = document.getElementById('detectionAlertModal');
        const titleElement = document.getElementById('detectionAlertTitle');
        const messageElement = document.getElementById('detectionAlertMessage');
        
        if (modal && titleElement && messageElement) {
            titleElement.textContent = title;
            messageElement.textContent = message;
            modal.style.display = 'block';
        }
    }
    
    playSirenAlert() {
        // Send audio command for siren
        if (window.dashboard) {
            window.dashboard.sendAudioCommand('play', 3); // Siren sound
        }
    }
    
    playLowPitchAlert() {
        // Send audio command for low pitch
        if (window.dashboard) {
            window.dashboard.sendAudioCommand('play', 2); // Low pitch sound
        }
    }
    
    updateDetectionUI(detections) {
        // Update detection history in UI
        const detectionList = document.getElementById('detectionList');
        if (detectionList) {
            // Clear existing items
            detectionList.innerHTML = '';
            
            // Add recent detections
            this.detectionHistory.slice(0, 10).forEach(detection => {
                const detectionItem = document.createElement('div');
                detectionItem.className = `detection-item ${detection.type}`;
                
                const timestamp = new Date(detection.timestamp).toLocaleTimeString();
                detectionItem.innerHTML = `
                    <div class="detection-info">
                        <strong>${detection.type.toUpperCase()}</strong>
                        <span class="confidence">${Math.round(detection.confidence * 100)}%</span>
                    </div>
                    <div class="detection-time">${timestamp}</div>
                `;
                
                detectionList.appendChild(detectionItem);
            });
        }
    }
    
    addDetectionLog(message, level = 'info') {
        if (window.systemLogs) {
            window.systemLogs.addAILog(message, level);
        }
    }
    
    async imageToBase64(imageData, imageType = 'jpeg') {
        if (typeof imageData === 'string') {
            return imageData;
        }
        
        // Convert image data to base64
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const base64 = canvas.toDataURL(`image/${imageType}`);
                resolve(base64);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = imageData;
        });
    }
    
    toggleAI(enabled) {
        this.isEnabled = enabled;
        this.updateAIStatus();
        
        if (enabled) {
            this.startAIDetection();
        } else {
            this.stopAIDetection();
        }
    }
    
    setDetectionMode(mode) {
        this.detectionMode = mode;
        this.updateSettings();
    }
    
    startAIDetection() {
        this.addDetectionLog('AI detection started', 'info');
        console.log('AI detection started');
    }
    
    stopAIDetection() {
        this.addDetectionLog('AI detection stopped', 'info');
        console.log('AI detection stopped');
    }
    
    updateAIStatus() {
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            if (this.isEnabled) {
                statusElement.className = 'status-indicator ai-active';
                statusElement.querySelector('span').textContent = 'AI: On';
            } else {
                statusElement.className = 'status-indicator ai-inactive';
                statusElement.querySelector('span').textContent = 'AI: Off';
            }
        }
    }
    
    updateSettings() {
        // Save settings to localStorage
        localStorage.setItem('gemini_ai_settings', JSON.stringify(this.settings));
        
        // Send settings to server
        this.sendSettingsToServer();
    }
    
    async sendSettingsToServer() {
        try {
            await fetch('/api/ai/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.settings)
            });
        } catch (error) {
            console.error('Failed to save AI settings:', error);
        }
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('gemini_ai_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }
    
    showAPIKeyWarning() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>API Key Required</h3>
                <p>Gemini AI API key is required for animal/human detection.</p>
                <div class="form-group">
                    <label for="apiKeyInput">API Key:</label>
                    <input type="password" id="apiKeyInput" placeholder="Enter your Gemini API key">
                </div>
                <div class="modal-actions">
                    <button id="saveApiKeyBtn" class="btn btn-primary">Save</button>
                    <button id="cancelApiKeyBtn" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
            const apiKey = document.getElementById('apiKeyInput').value;
            if (apiKey) {
                this.apiKey = apiKey;
                localStorage.setItem('gemini_api_key', apiKey);
                this.initializeAPI();
                document.body.removeChild(modal);
            }
        });
        
        document.getElementById('cancelApiKeyBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    showError(message) {
        if (window.dashboard) {
            window.dashboard.showAlert('AI Error', message);
        } else {
            console.error(message);
        }
    }
    
    getDetectionHistory() {
        return this.detectionHistory;
    }
    
    getLastDetection() {
        return this.lastDetection;
    }
    
    getSettings() {
        return this.settings;
    }
}

// Initialize Gemini AI
document.addEventListener('DOMContentLoaded', () => {
    window.geminiAI = new GeminiAI();
});
