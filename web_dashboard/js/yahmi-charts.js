/**
 * Yahmi Security Rover - Advanced Charts and Analytics
 * Professional data visualization for surveillance system
 */

class YahmiCharts {
    constructor() {
        this.charts = {};
        this.dataBuffers = {
            performance: { cpu: [], memory: [], timestamp: [] },
            detection: { person: [], vehicle: [], animal: [], other: [] },
            network: { signal: [], speed: [], latency: [] },
            battery: { level: [], voltage: [], temperature: [] }
        };
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Yahmi Charts...');
        this.initializeAllCharts();
        this.startDataCollection();
    }

    initializeAllCharts() {
        // Performance Chart
        this.initializePerformanceChart();
        
        // Detection Analytics
        this.initializeDetectionChart();
        
        // Network Monitoring
        this.initializeNetworkChart();
        
        // Battery Analytics
        this.initializeBatteryChart();
        
        // System Health
        this.initializeSystemHealthChart();
        
        // Security Events
        this.initializeSecurityEventsChart();
    }

    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(20),
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: new Array(20).fill(0),
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Memory Usage (%)',
                    data: new Array(20).fill(0),
                    borderColor: '#38a169',
                    backgroundColor: 'rgba(56, 161, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Temperature (°C)',
                    data: new Array(20).fill(0),
                    borderColor: '#ed8936',
                    backgroundColor: 'rgba(237, 137, 54, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#4a90e2',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Usage (%)'
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 3,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    initializeDetectionChart() {
        const ctx = document.getElementById('detectionChart');
        if (!ctx) return;

        this.charts.detection = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Person', 'Vehicle', 'Animal', 'Object', 'Unknown'],
                datasets: [{
                    label: 'Detections',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#4a90e2',
                        '#38a169',
                        '#ed8936',
                        '#e53e3e',
                        '#9f7aea'
                    ],
                    borderColor: [
                        '#2d5a87',
                        '#2f855a',
                        '#dd6b20',
                        '#c53030',
                        '#805ad5'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value} detections`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Detection Type'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    initializeNetworkChart() {
        const ctx = document.getElementById('networkChart');
        if (!ctx) return;

        this.charts.network = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(15),
                datasets: [{
                    label: 'Signal Strength (dBm)',
                    data: new Array(15).fill(-50),
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Network Speed (Mbps)',
                    data: new Array(15).fill(0),
                    borderColor: '#38a169',
                    backgroundColor: 'rgba(56, 161, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                }
            }
        });
    }

    initializeBatteryChart() {
        const ctx = document.getElementById('batteryChart');
        if (!ctx) return;

        this.charts.battery = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(30),
                datasets: [{
                    label: 'Battery Level (%)',
                    data: new Array(30).fill(100),
                    borderColor: '#38a169',
                    backgroundColor: 'rgba(56, 161, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Voltage (V)',
                    data: new Array(30).fill(12.6),
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Battery Level (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Voltage (V)'
                        },
                        min: 10,
                        max: 15,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    initializeSystemHealthChart() {
        const ctx = document.getElementById('systemHealthChart');
        if (!ctx) return;

        this.charts.systemHealth = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['System', 'AI Processing', 'Video', 'Network', 'Sensors'],
                datasets: [{
                    data: [25, 20, 30, 15, 10],
                    backgroundColor: [
                        '#4a90e2',
                        '#38a169',
                        '#ed8936',
                        '#e53e3e',
                        '#9f7aea'
                    ],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                const label = context.label;
                                const value = context.parsed;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    initializeSecurityEventsChart() {
        const ctx = document.getElementById('securityEventsChart');
        if (!ctx) return;

        this.charts.securityEvents = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago'],
                datasets: [{
                    label: 'Security Events',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(74, 144, 226, 0.8)',
                    borderColor: '#4a90e2',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Events'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    startDataCollection() {
        // Update performance data every 5 seconds
        setInterval(() => {
            this.updatePerformanceData();
        }, 5000);

        // Update detection data every 10 seconds
        setInterval(() => {
            this.updateDetectionData();
        }, 10000);

        // Update network data every 3 seconds
        setInterval(() => {
            this.updateNetworkData();
        }, 3000);

        // Update battery data every 2 seconds
        setInterval(() => {
            this.updateBatteryData();
        }, 2000);
    }

    updatePerformanceData() {
        if (!this.charts.performance) return;

        const chart = this.charts.performance;
        const now = new Date();
        
        // Simulate or fetch real data
        const cpuUsage = Math.random() * 100;
        const memoryUsage = Math.random() * 100;
        const temperature = 25 + Math.random() * 20;

        // Update data buffers
        this.dataBuffers.performance.cpu.push(cpuUsage);
        this.dataBuffers.performance.memory.push(memoryUsage);
        this.dataBuffers.performance.timestamp.push(now);

        // Keep only last 20 data points
        if (this.dataBuffers.performance.cpu.length > 20) {
            this.dataBuffers.performance.cpu.shift();
            this.dataBuffers.performance.memory.shift();
            this.dataBuffers.performance.timestamp.shift();
        }

        // Update chart
        chart.data.datasets[0].data = [...this.dataBuffers.performance.cpu];
        chart.data.datasets[1].data = [...this.dataBuffers.performance.memory];
        chart.data.datasets[2].data = [...this.dataBuffers.performance.temperature || []];
        chart.data.labels = this.dataBuffers.performance.timestamp.map(t => t.toLocaleTimeString());
        
        chart.update('none');
    }

    updateDetectionData() {
        if (!this.charts.detection) return;

        // Simulate detection data
        const detections = {
            person: Math.floor(Math.random() * 10),
            vehicle: Math.floor(Math.random() * 5),
            animal: Math.floor(Math.random() * 3),
            object: Math.floor(Math.random() * 8),
            unknown: Math.floor(Math.random() * 2)
        };

        this.charts.detection.data.datasets[0].data = [
            detections.person,
            detections.vehicle,
            detections.animal,
            detections.object,
            detections.unknown
        ];

        this.charts.detection.update('none');
    }

    updateNetworkData() {
        if (!this.charts.network) return;

        const chart = this.charts.network;
        const now = new Date();
        
        // Simulate network data
        const signalStrength = -30 - Math.random() * 40;
        const networkSpeed = Math.random() * 100;

        // Update data buffers
        this.dataBuffers.network.signal.push(signalStrength);
        this.dataBuffers.network.speed.push(networkSpeed);
        this.dataBuffers.network.timestamp.push(now);

        // Keep only last 15 data points
        if (this.dataBuffers.network.signal.length > 15) {
            this.dataBuffers.network.signal.shift();
            this.dataBuffers.network.speed.shift();
            this.dataBuffers.network.timestamp.shift();
        }

        // Update chart
        chart.data.datasets[0].data = [...this.dataBuffers.network.signal];
        chart.data.datasets[1].data = [...this.dataBuffers.network.speed];
        chart.data.labels = this.dataBuffers.network.timestamp.map(t => t.toLocaleTimeString());
        
        chart.update('none');
    }

    updateBatteryData() {
        if (!this.charts.battery) return;

        const chart = this.charts.battery;
        const now = new Date();
        
        // Simulate battery data
        const batteryLevel = Math.max(0, 100 - Math.random() * 0.1);
        const voltage = 10 + (batteryLevel / 100) * 5;

        // Update data buffers
        this.dataBuffers.battery.level.push(batteryLevel);
        this.dataBuffers.battery.voltage.push(voltage);
        this.dataBuffers.battery.timestamp.push(now);

        // Keep only last 30 data points
        if (this.dataBuffers.battery.level.length > 30) {
            this.dataBuffers.battery.level.shift();
            this.dataBuffers.battery.voltage.shift();
            this.dataBuffers.battery.timestamp.shift();
        }

        // Update chart
        chart.data.datasets[0].data = [...this.dataBuffers.battery.level];
        chart.data.datasets[1].data = [...this.dataBuffers.battery.voltage];
        chart.data.labels = this.dataBuffers.battery.timestamp.map(t => t.toLocaleTimeString());
        
        chart.update('none');
    }

    updateSystemHealthData(data) {
        if (!this.charts.systemHealth) return;

        const chart = this.charts.systemHealth;
        
        // Update system health data
        chart.data.datasets[0].data = [
            data.system || 25,
            data.ai || 20,
            data.video || 30,
            data.network || 15,
            data.sensors || 10
        ];

        chart.update('none');
    }

    updateSecurityEventsData(events) {
        if (!this.charts.securityEvents) return;

        const chart = this.charts.securityEvents;
        
        // Update security events data
        chart.data.datasets[0].data = events || [0, 0, 0, 0, 0, 0, 0];

        chart.update('none');
    }

    generateTimeLabels(count) {
        const labels = [];
        const now = new Date();
        
        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 30000); // 30 seconds intervals
            labels.push(time.toLocaleTimeString());
        }
        
        return labels;
    }

    // Public methods for external updates
    updateChart(chartName, data) {
        if (this.charts[chartName]) {
            this.charts[chartName].data = data;
            this.charts[chartName].update();
        }
    }

    addDataPoint(chartName, datasetIndex, value) {
        if (this.charts[chartName]) {
            const chart = this.charts[chartName];
            chart.data.datasets[datasetIndex].data.push(value);
            
            // Keep only last 20 data points
            if (chart.data.datasets[datasetIndex].data.length > 20) {
                chart.data.datasets[datasetIndex].data.shift();
            }
            
            chart.update('none');
        }
    }

    exportChart(chartName) {
        if (this.charts[chartName]) {
            const link = document.createElement('a');
            link.download = `yahmi-${chartName}-chart.png`;
            link.href = this.charts[chartName].toBase64Image();
            link.click();
        }
    }

    exportAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.exportChart(chartName);
        });
    }

    resetChart(chartName) {
        if (this.charts[chartName]) {
            const chart = this.charts[chartName];
            chart.data.datasets.forEach(dataset => {
                dataset.data = new Array(dataset.data.length).fill(0);
            });
            chart.update();
        }
    }

    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });
    }
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.yahmiCharts = new YahmiCharts();
});
