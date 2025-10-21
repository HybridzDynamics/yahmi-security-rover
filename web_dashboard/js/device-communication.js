/* Simple helper to build device endpoints for ESP32 and Raspberry Pi */
(function(){
    const DEFAULTS = {
        esp32: { protocol: 'http', port: 80 },
        raspberry_pi: { protocol: 'http', port: 5000 }
    };

    async function getConfig() {
        try {
            const res = await fetch('/api/config');
            return await res.json();
        } catch {
            return {};
        }
    }

    function buildBaseUrl(deviceType, ip, port) {
        const proto = DEFAULTS[deviceType]?.protocol || 'http';
        return `${proto}://${ip}:${port}`;
    }

    async function resolveDeviceBase() {
        const cfg = await getConfig();
        const deviceType = cfg.device_type || cfg.DEFAULT_DEVICE_TYPE || 'esp32';
        const ip = cfg.device_ip || cfg.DEFAULT_DEVICE_IP || '192.168.1.100';
        const port = cfg.device_port || cfg.DEFAULT_DEVICE_PORT || (deviceType === 'raspberry_pi' ? 5000 : 80);
        return { deviceType, base: buildBaseUrl(deviceType, ip, port) };
    }

    async function deviceFetch(path, options = {}) {
        const { base } = await resolveDeviceBase();
        const url = `${base}${path}`;
        return fetch(url, options);
    }

    window.DeviceComm = { resolveDeviceBase, deviceFetch };
})();


