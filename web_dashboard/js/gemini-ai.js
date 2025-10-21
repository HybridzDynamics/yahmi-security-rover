// Professional Gemini AI Integration
// Handles AI detection, image analysis, and smart alerts

class GeminiAI {
    constructor() {
        this.apiKey = 'AIzaSyAy_99DoGZkw9cYOOgjahv4-YJeud0I90E';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
        this.dailyUsageCount = 0;
        this.dailyLimit = 1000;
        this.isInitialized = false;
        this.detectionHistory = [];
        this.alertThresholds = {
            animal: 0.7,
            human: 0.8,
            vehicle: 0.6,
            suspicious: 0.9
        };
        
        this.init();
    }

    async init() {
        try {
            await this.checkAPIKey();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Gemini AI initialized successfully');
        } catch (error) {
            console.error('Gemini AI initialization failed:', error);
            this.showError('AI initialization failed: ' + error.message);
        }
    }

    async checkAPIKey() {
        if (!this.apiKey || this.apiKey === 'your-api-key') {
            throw new Error('Gemini API key not configured');
        }
        
        // Test API key with a simple request
        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Hello, this is a test message."
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                throw new Error('API key validation failed');
            }
        } catch (error) {
            console.warn('API key validation failed:', error);
        }
    }

    setupEventListeners() {
        // Listen for detection mode changes
        document.querySelectorAll('input[name="detectionMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateDetectionMode(e.target.value);
            });
        });

        // Listen for AI toggle
        document.getElementById('aiEnabled')?.addEventListener('change', (e) => {
            this.handleAIToggle(e.target.checked);
        });
    }

    async analyzeImage(imageBase64, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Gemini AI not initialized');
        }

        if (this.dailyUsageCount >= this.dailyLimit) {
            throw new Error('Daily API limit reached');
        }

        try {
            const detectionMode = options.detectionMode || 'both';
            const sensitivity = options.sensitivity || 'medium';
            
            const prompt = this.buildDetectionPrompt(detectionMode, sensitivity);
            
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            this.dailyUsageCount++;
            
            const analysis = this.parseResponse(data, detectionMode);
            this.addToDetectionHistory(analysis);
            
            return analysis;

        } catch (error) {
            console.error('Gemini AI analysis failed:', error);
            throw error;
        }
    }

    buildDetectionPrompt(detectionMode, sensitivity) {
        const sensitivitySettings = {
            low: 'very low confidence threshold',
            medium: 'moderate confidence threshold',
            high: 'high confidence threshold'
        };

        const basePrompt = `Analyze this surveillance image and detect objects with ${sensitivitySettings[sensitivity] || 'moderate confidence threshold'}.`;

        let specificPrompt = '';
        
        switch (detectionMode) {
            case 'animal':
                specificPrompt = 'Focus on detecting animals (dogs, cats, birds, wildlife). Ignore humans and vehicles.';
                break;
            case 'human':
                specificPrompt = 'Focus on detecting humans and human activities. Ignore animals and vehicles.';
                break;
            case 'both':
                specificPrompt = 'Detect both animals and humans. Also look for vehicles and suspicious activities.';
                break;
            default:
                specificPrompt = 'Detect any objects of interest including animals, humans, and vehicles.';
        }

        const responseFormat = `
Provide a JSON response with the following structure:
{
  "detected_objects": ["list of detected objects"],
  "confidence": 0.0-1.0,
  "alert_level": "low/medium/high/critical",
  "description": "brief description of what was detected",
  "bounding_boxes": [
    {
      "object": "object name",
      "confidence": 0.0-1.0,
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0
    }
  ],
  "should_alert": true/false,
  "alert_reason": "reason for alert if applicable"
}

${basePrompt} ${specificPrompt}`;

        return responseFormat;
    }

    parseResponse(data, detectionMode) {
        try {
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                analysis.timestamp = new Date().toISOString();
                analysis.detectionMode = detectionMode;
                analysis.processed = true;
                
                // Validate and enhance analysis
                this.validateAnalysis(analysis);
                
                return analysis;
            } else {
                // Fallback parsing
                return this.createFallbackAnalysis(text, detectionMode);
            }
        } catch (error) {
            console.error('Response parsing failed:', error);
            return this.createFallbackAnalysis('Analysis failed', detectionMode);
        }
    }

    validateAnalysis(analysis) {
        // Ensure required fields exist
        if (!analysis.detected_objects) analysis.detected_objects = [];
        if (!analysis.confidence) analysis.confidence = 0.5;
        if (!analysis.alert_level) analysis.alert_level = 'medium';
        if (!analysis.description) analysis.description = 'No description available';
        if (!analysis.bounding_boxes) analysis.bounding_boxes = [];
        if (analysis.should_alert === undefined) {
            analysis.should_alert = this.shouldTriggerAlert(analysis);
        }
        
        // Validate confidence range
        analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));
        
        // Validate alert level
        const validAlertLevels = ['low', 'medium', 'high', 'critical'];
        if (!validAlertLevels.includes(analysis.alert_level)) {
            analysis.alert_level = 'medium';
        }
    }

    shouldTriggerAlert(analysis) {
        const confidence = analysis.confidence || 0;
        const objects = analysis.detected_objects || [];
        
        // Check if any detected objects meet alert criteria
        for (const object of objects) {
            const lowerObject = object.toLowerCase();
            
            // High priority objects
            if (lowerObject.includes('human') || lowerObject.includes('person')) {
                return confidence >= this.alertThresholds.human;
            }
            
            // Medium priority objects
            if (lowerObject.includes('animal') || lowerObject.includes('dog') || 
                lowerObject.includes('cat') || lowerObject.includes('bird')) {
                return confidence >= this.alertThresholds.animal;
            }
            
            // Vehicle detection
            if (lowerObject.includes('car') || lowerObject.includes('vehicle') || 
                lowerObject.includes('truck')) {
                return confidence >= this.alertThresholds.vehicle;
            }
        }
        
        // Default threshold
        return confidence >= 0.7;
    }

    createFallbackAnalysis(text, detectionMode) {
        return {
            detected_objects: ['unknown'],
            confidence: 0.3,
            alert_level: 'low',
            description: text.substring(0, 200),
            bounding_boxes: [],
            should_alert: false,
            alert_reason: 'Low confidence detection',
            timestamp: new Date().toISOString(),
            detectionMode: detectionMode,
            processed: true,
            fallback: true
        };
    }

    addToDetectionHistory(analysis) {
        this.detectionHistory.unshift(analysis);
        
        // Keep only last 50 detections
        if (this.detectionHistory.length > 50) {
            this.detectionHistory = this.detectionHistory.slice(0, 50);
        }
        
        // Update UI
        this.updateDetectionHistory();
    }

    updateDetectionHistory() {
        const detectionList = document.getElementById('detectionList');
        if (!detectionList) return;

        // Clear existing items
        detectionList.innerHTML = '';

        // Add recent detections
        this.detectionHistory.slice(0, 10).forEach(detection => {
            const item = document.createElement('div');
            item.className = `detection-item ${detection.alert_level}`;
            
            const time = new Date(detection.timestamp).toLocaleTimeString();
            const objects = detection.detected_objects?.join(', ') || 'Unknown';
            const confidence = Math.round((detection.confidence || 0) * 100);
            
            item.innerHTML = `
                <div class="detection-info">
                    <div class="detection-objects">${objects}</div>
                    <div class="detection-time">${time}</div>
                    <div class="detection-description">${detection.description || ''}</div>
                </div>
                <div class="detection-meta">
                    <div class="confidence">${confidence}%</div>
                    <div class="alert-level">${detection.alert_level}</div>
                </div>
            `;
            
            detectionList.appendChild(item);
        });
    }

    updateDetectionMode(mode) {
        console.log('Detection mode changed to:', mode);
        
        // Update alert thresholds based on mode
        switch (mode) {
            case 'animal':
                this.alertThresholds.animal = 0.6;
                this.alertThresholds.human = 1.0; // Disable human alerts
                break;
            case 'human':
                this.alertThresholds.human = 0.7;
                this.alertThresholds.animal = 1.0; // Disable animal alerts
                break;
            case 'both':
                this.alertThresholds.animal = 0.7;
                this.alertThresholds.human = 0.8;
                break;
        }
    }

    handleAIToggle(enabled) {
        console.log('AI Detection:', enabled ? 'enabled' : 'disabled');
        
        if (enabled) {
            this.showNotification('AI Detection enabled', 'success');
        } else {
            this.showNotification('AI Detection disabled', 'info');
        }
    }

    async getUsageStats() {
        return {
            dailyUsage: this.dailyUsageCount,
            dailyLimit: this.dailyLimit,
            remainingUsage: this.dailyLimit - this.dailyUsageCount,
            usagePercentage: (this.dailyUsageCount / this.dailyLimit) * 100,
            isInitialized: this.isInitialized
        };
    }

    async resetDailyUsage() {
        this.dailyUsageCount = 0;
        console.log('Daily usage count reset');
    }

    async getDetectionHistory(limit = 10) {
        return this.detectionHistory.slice(0, limit);
    }

    async clearDetectionHistory() {
        this.detectionHistory = [];
        this.updateDetectionHistory();
        console.log('Detection history cleared');
    }

    async exportDetectionHistory() {
        const data = {
            detections: this.detectionHistory,
            exportDate: new Date().toISOString(),
            totalDetections: this.detectionHistory.length,
            usageStats: await this.getUsageStats()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `detection-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showError(message) {
        console.error('Gemini AI Error:', message);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: #e74c3c;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Public API methods
    async analyzeImageWithOptions(imageBase64, options = {}) {
        return await this.analyzeImage(imageBase64, options);
    }

    async getDetectionStats() {
        const stats = {
            totalDetections: this.detectionHistory.length,
            alertCount: this.detectionHistory.filter(d => d.should_alert).length,
            averageConfidence: this.detectionHistory.reduce((sum, d) => sum + (d.confidence || 0), 0) / this.detectionHistory.length || 0,
            lastDetection: this.detectionHistory[0]?.timestamp || null,
            usageStats: await this.getUsageStats()
        };
        
        return stats;
    }

    async updateAlertThresholds(thresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...thresholds };
        console.log('Alert thresholds updated:', this.alertThresholds);
    }
}

// Initialize Gemini AI when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.geminiAI = new GeminiAI();
});

// Add CSS for detection history
const geminiStyle = document.createElement('style');
geminiStyle.textContent = `
    .detection-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 0.5rem;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #f39c12;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .detection-item.low {
        border-left-color: #17a2b8;
    }
    
    .detection-item.medium {
        border-left-color: #f39c12;
    }
    
    .detection-item.high {
        border-left-color: #e74c3c;
    }
    
    .detection-item.critical {
        border-left-color: #8e44ad;
        background: #fdf2f8;
    }
    
    .detection-info {
        flex: 1;
    }
    
    .detection-objects {
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 0.25rem;
    }
    
    .detection-time {
        font-size: 0.8rem;
        color: #6c757d;
        margin-bottom: 0.25rem;
    }
    
    .detection-description {
        font-size: 0.9rem;
        color: #495057;
    }
    
    .detection-meta {
        text-align: right;
    }
    
    .confidence {
        font-weight: bold;
        color: #27ae60;
        font-size: 1.1rem;
    }
    
    .alert-level {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: bold;
        margin-top: 0.25rem;
    }
    
    .alert-level.low {
        color: #17a2b8;
    }
    
    .alert-level.medium {
        color: #f39c12;
    }
    
    .alert-level.high {
        color: #e74c3c;
    }
    
    .alert-level.critical {
        color: #8e44ad;
    }
`;
document.head.appendChild(geminiStyle);
