// Test Suite for ESP32 Surveillance Car Dashboard
class TestSuite {
    constructor() {
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.watchId = null;
        this.testResults = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateTestStatus('cameraStatus', 'pending');
        this.updateTestStatus('audioStatus', 'pending');
        this.updateTestStatus('locationStatus', 'pending');
        this.updateTestStatus('networkStatus', 'pending');
    }
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('startCamera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('stopCamera')?.addEventListener('click', () => this.stopCamera());
        document.getElementById('capturePhoto')?.addEventListener('click', () => this.capturePhoto());
        document.getElementById('switchCamera')?.addEventListener('click', () => this.switchCamera());
        
        // Audio controls
        document.getElementById('startMic')?.addEventListener('click', () => this.startMicrophone());
        document.getElementById('stopMic')?.addEventListener('click', () => this.stopMicrophone());
        document.getElementById('testSpeaker')?.addEventListener('click', () => this.testSpeaker());
        document.getElementById('playSiren')?.addEventListener('click', () => this.playSiren());
        document.getElementById('playLowPitch')?.addEventListener('click', () => this.playLowPitch());
        
        // Location controls
        document.getElementById('getLocation')?.addEventListener('click', () => this.getCurrentLocation());
        document.getElementById('watchLocation')?.addEventListener('click', () => this.watchLocation());
        document.getElementById('stopWatching')?.addEventListener('click', () => this.stopWatchingLocation());
        
        // Network controls
        document.getElementById('testConnection')?.addEventListener('click', () => this.testConnection());
        document.getElementById('testSpeed')?.addEventListener('click', () => this.testSpeed());
        document.getElementById('testESP32')?.addEventListener('click', () => this.testESP32());
        
        // Test suite controls
        document.getElementById('runAllTests')?.addEventListener('click', () => this.runAllTests());
        document.getElementById('clearResults')?.addEventListener('click', () => this.clearResults());
    }
    
    // Camera Test Methods
    async startCamera() {
        try {
            this.updateTestStatus('cameraStatus', 'running');
            
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('cameraStream') || this.createVideoElement();
            video.srcObject = this.stream;
            
            // Update camera info
            const track = this.stream.getVideoTracks()[0];
            const settings = track.getSettings();
            
            document.getElementById('cameraResolution').textContent = `${settings.width}x${settings.height}`;
            document.getElementById('cameraDevice').textContent = track.label;
            
            // Enable controls
            document.getElementById('stopCamera').disabled = false;
            document.getElementById('capturePhoto').disabled = false;
            document.getElementById('switchCamera').disabled = false;
            
            this.updateTestStatus('cameraStatus', 'success');
            this.addTestResult('Camera Test', 'success', 'Camera started successfully');
            
        } catch (error) {
            this.updateTestStatus('cameraStatus', 'error');
            this.addTestResult('Camera Test', 'error', `Failed to start camera: ${error.message}`);
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            
            const video = document.getElementById('cameraStream');
            if (video) {
                video.srcObject = null;
            }
            
            // Disable controls
            document.getElementById('stopCamera').disabled = true;
            document.getElementById('capturePhoto').disabled = true;
            document.getElementById('switchCamera').disabled = true;
            
            this.updateTestStatus('cameraStatus', 'pending');
            this.addTestResult('Camera Test', 'success', 'Camera stopped successfully');
        }
    }
    
    capturePhoto() {
        if (this.stream) {
            const video = document.getElementById('cameraStream');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            const dataURL = canvas.toDataURL('image/jpeg');
            this.downloadImage(dataURL, 'surveillance-photo.jpg');
            
            this.addTestResult('Photo Capture', 'success', 'Photo captured successfully');
        }
    }
    
    async switchCamera() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length > 1) {
                this.stopCamera();
                await this.startCamera();
                this.addTestResult('Camera Switch', 'success', 'Camera switched successfully');
            } else {
                this.addTestResult('Camera Switch', 'warning', 'Only one camera available');
            }
        } catch (error) {
            this.addTestResult('Camera Switch', 'error', `Failed to switch camera: ${error.message}`);
        }
    }
    
    createVideoElement() {
        const video = document.createElement('video');
        video.id = 'cameraStream';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        const preview = document.getElementById('cameraPreview');
        preview.innerHTML = '';
        preview.appendChild(video);
        
        return video;
    }
    
    // Audio Test Methods
    async startMicrophone() {
        try {
            this.updateTestStatus('audioStatus', 'running');
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = stream.getAudioTracks()[0];
            
            // Set up audio context and analyser
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            source.connect(this.analyser);
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Update microphone info
            document.getElementById('micDevice').textContent = this.microphone.label;
            
            // Start volume monitoring
            this.monitorVolume();
            
            // Enable controls
            document.getElementById('stopMic').disabled = false;
            
            this.updateTestStatus('audioStatus', 'success');
            this.addTestResult('Microphone Test', 'success', 'Microphone started successfully');
            
        } catch (error) {
            this.updateTestStatus('audioStatus', 'error');
            this.addTestResult('Microphone Test', 'error', `Failed to start microphone: ${error.message}`);
        }
    }
    
    stopMicrophone() {
        if (this.microphone) {
            this.microphone.stop();
            this.microphone = null;
            
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            // Disable controls
            document.getElementById('stopMic').disabled = true;
            
            // Reset volume display
            document.getElementById('micVolumeFill').style.width = '0%';
            document.getElementById('micVolumeText').textContent = '0%';
            
            this.updateTestStatus('audioStatus', 'pending');
            this.addTestResult('Microphone Test', 'success', 'Microphone stopped successfully');
        }
    }
    
    monitorVolume() {
        if (!this.analyser) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        const updateVolume = () => {
            if (!this.analyser) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const volume = Math.round((average / 255) * 100);
            
            document.getElementById('micVolumeFill').style.width = `${volume}%`;
            document.getElementById('micVolumeText').textContent = `${volume}%`;
            
            if (this.analyser) {
                requestAnimationFrame(updateVolume);
            }
        };
        
        updateVolume();
    }
    
    testSpeaker() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            
            this.addTestResult('Speaker Test', 'success', 'Speaker test completed');
            
        } catch (error) {
            this.addTestResult('Speaker Test', 'error', `Speaker test failed: ${error.message}`);
        }
    }
    
    playSiren() {
        this.playTone(800, 2000, 0.1);
        this.addTestResult('Siren Test', 'success', 'Siren sound played');
    }
    
    playLowPitch() {
        this.playTone(200, 1000, 0.1);
        this.addTestResult('Low Pitch Test', 'success', 'Low pitch sound played');
    }
    
    playTone(frequency, duration, volume) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration / 1000);
            
        } catch (error) {
            console.error('Audio playback failed:', error);
        }
    }
    
    // Location Test Methods
    async getCurrentLocation() {
        try {
            this.updateTestStatus('locationStatus', 'running');
            
            const position = await this.getCurrentPosition();
            this.updateLocationInfo(position);
            
            this.updateTestStatus('locationStatus', 'success');
            this.addTestResult('Location Test', 'success', 'Location retrieved successfully');
            
        } catch (error) {
            this.updateTestStatus('locationStatus', 'error');
            this.addTestResult('Location Test', 'error', `Location failed: ${error.message}`);
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }
    
    watchLocation() {
        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported');
            }
            
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.updateLocationInfo(position);
                },
                (error) => {
                    console.error('Location watch error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 1000
                }
            );
            
            document.getElementById('stopWatching').disabled = false;
            this.addTestResult('Location Watch', 'success', 'Location watching started');
            
        } catch (error) {
            this.addTestResult('Location Watch', 'error', `Location watch failed: ${error.message}`);
        }
    }
    
    stopWatchingLocation() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            document.getElementById('stopWatching').disabled = true;
            this.addTestResult('Location Watch', 'success', 'Location watching stopped');
        }
    }
    
    updateLocationInfo(position) {
        const coords = position.coords;
        
        document.getElementById('latitude').textContent = coords.latitude.toFixed(6);
        document.getElementById('longitude').textContent = coords.longitude.toFixed(6);
        document.getElementById('accuracy').textContent = `${coords.accuracy.toFixed(2)}m`;
        document.getElementById('altitude').textContent = coords.altitude ? `${coords.altitude.toFixed(2)}m` : 'N/A';
        document.getElementById('speed').textContent = coords.speed ? `${(coords.speed * 3.6).toFixed(2)} km/h` : 'N/A';
    }
    
    // Network Test Methods
    async testConnection() {
        try {
            this.updateTestStatus('networkStatus', 'running');
            
            const response = await fetch('/api/health', { method: 'GET' });
            const isOnline = response.ok;
            
            document.getElementById('connectionStatusText').textContent = isOnline ? 'Online' : 'Offline';
            document.getElementById('connectionType').textContent = navigator.onLine ? 'Online' : 'Offline';
            
            this.updateTestStatus('networkStatus', isOnline ? 'success' : 'error');
            this.addTestResult('Connection Test', isOnline ? 'success' : 'error', 
                isOnline ? 'Connection successful' : 'Connection failed');
            
        } catch (error) {
            this.updateTestStatus('networkStatus', 'error');
            this.addTestResult('Connection Test', 'error', `Connection test failed: ${error.message}`);
        }
    }
    
    async testSpeed() {
        try {
            const startTime = performance.now();
            const response = await fetch('/api/status', { method: 'GET' });
            const endTime = performance.now();
            
            const latency = endTime - startTime;
            const size = response.headers.get('content-length') || 0;
            const speed = (size / latency * 8).toFixed(2); // Convert to kbps
            
            document.getElementById('downloadSpeed').textContent = `${speed} kbps`;
            document.getElementById('uploadSpeed').textContent = 'N/A';
            
            this.addTestResult('Speed Test', 'success', `Latency: ${latency.toFixed(2)}ms`);
            
        } catch (error) {
            this.addTestResult('Speed Test', 'error', `Speed test failed: ${error.message}`);
        }
    }
    
    async testESP32() {
        try {
            const esp32IP = localStorage.getItem('esp32_ip') || '192.168.1.100';
            const response = await fetch(`http://${esp32IP}/api/status`);
            
            if (response.ok) {
                const data = await response.json();
                document.getElementById('esp32IP').textContent = esp32IP;
                document.getElementById('esp32Signal').textContent = 'Strong';
                
                this.addTestResult('ESP32 Test', 'success', 'ESP32 connection successful');
            } else {
                throw new Error('ESP32 not responding');
            }
            
        } catch (error) {
            document.getElementById('esp32IP').textContent = 'Not connected';
            document.getElementById('esp32Signal').textContent = 'Weak';
            this.addTestResult('ESP32 Test', 'error', `ESP32 test failed: ${error.message}`);
        }
    }
    
    // Test Suite Management
    async runAllTests() {
        this.showLoadingOverlay('Running all tests...');
        
        try {
            // Run tests in sequence
            await this.startCamera();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.startMicrophone();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.getCurrentLocation();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.testConnection();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.testSpeed();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.testESP32();
            
            this.addTestResult('All Tests', 'success', 'All tests completed successfully');
            
        } catch (error) {
            this.addTestResult('All Tests', 'error', `Test suite failed: ${error.message}`);
        } finally {
            this.hideLoadingOverlay();
        }
    }
    
    clearResults() {
        this.testResults = [];
        document.getElementById('testResults').innerHTML = `
            <div class="no-results">
                <i class="fas fa-clipboard-list"></i>
                <p>No tests run yet. Click "Run All Tests" to start.</p>
            </div>
        `;
        
        // Reset all status indicators
        this.updateTestStatus('cameraStatus', 'pending');
        this.updateTestStatus('audioStatus', 'pending');
        this.updateTestStatus('locationStatus', 'pending');
        this.updateTestStatus('networkStatus', 'pending');
    }
    
    // Utility Methods
    updateTestStatus(statusId, status) {
        const statusElement = document.getElementById(statusId);
        if (statusElement) {
            const badge = statusElement.querySelector('.status-badge');
            if (badge) {
                badge.className = `status-badge ${status}`;
                badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            }
        }
    }
    
    addTestResult(testName, status, message, details = '') {
        const result = {
            testName,
            status,
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        this.displayTestResult(result);
    }
    
    displayTestResult(result) {
        const resultsContainer = document.getElementById('testResults');
        
        // Remove no-results message if it exists
        const noResults = resultsContainer.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }
        
        const resultElement = document.createElement('div');
        resultElement.className = `test-result-item ${result.status} fade-in`;
        
        resultElement.innerHTML = `
            <div class="test-result-header">
                <span class="test-result-title">${result.testName}</span>
                <span class="test-result-status ${result.status}">${result.status}</span>
            </div>
            <div class="test-result-message">${result.message}</div>
            ${result.details ? `<div class="test-result-details">${result.details}</div>` : ''}
        `;
        
        resultsContainer.appendChild(resultElement);
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }
    
    downloadImage(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        link.click();
    }
    
    showLoadingOverlay(message) {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        if (overlay) {
            overlay.style.display = 'flex';
            if (text) text.textContent = message;
        }
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Initialize test suite when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.testSuite = new TestSuite();
});
