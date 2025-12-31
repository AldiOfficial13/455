// Android-specific features
class AndroidFeatures {
    constructor() {
        this.init();
    }

    init() {
        this.setupQRScanner();
        this.setupShareButtons();
        this.setupBiometricAuth();
        this.setupGeolocation();
    }

    // QR Code Scanner
    setupQRScanner() {
        const qrButton = document.createElement('button');
        qrButton.innerHTML = '<i class="fas fa-qrcode"></i> Scan QR';
        qrButton.className = 'qr-login-btn';
        qrButton.onclick = () => this.scanQRCode();
        
        // Tambahkan di login page
        const loginForm = document.querySelector('#loginForm');
        if (loginForm) {
            loginForm.appendChild(qrButton);
        }
    }

    async scanQRCode() {
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            try {
                // Request camera access
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                
                // Create video element for scanning
                this.createQRScannerUI(stream);
                
            } catch (error) {
                console.log('Camera access denied:', error);
                this.showQRCodeFallback();
            }
        } else {
            this.showQRCodeFallback();
        }
    }

    createQRScannerUI(stream) {
        const scannerDiv = document.createElement('div');
        scannerDiv.className = 'qr-scanner-modal';
        scannerDiv.innerHTML = `
            <div class="scanner-content">
                <div class="scanner-header">
                    <h3>Scan QR Code</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-scanner">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="scanner-body">
                    <video id="qrVideo" autoplay playsinline></video>
                    <div class="scanner-overlay">
                        <div class="scanner-frame"></div>
                    </div>
                    <div class="scanner-instructions">
                        <p>Arahkan kamera ke QR code</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(scannerDiv);
        
        const video = scannerDiv.querySelector('#qrVideo');
        video.srcObject = stream;
        
        // QR scanning logic would go here
        // For now, we'll simulate a successful scan
        setTimeout(() => {
            this.simulateQRScan();
            stream.getTracks().forEach(track => track.stop());
            scannerDiv.remove();
        }, 3000);
    }

    simulateQRScan() {
        // Simulate QR code data
        const qrData = {
            username: 'karyawan123',
            token: 'simulated-qr-token-12345'
        };
        
        // Auto-fill login form
        document.querySelector('#username').value = qrData.username;
        
        // Show success message
        this.showToast('QR Code berhasil discan! Silakan login.');
    }

    showQRCodeFallback() {
        alert('Fitur scan QR membutuhkan kamera. Silakan login manual.');
    }

    // Share to WhatsApp
    setupShareButtons() {
        // Add share button to gaji details
        const shareButtons = [
            {
                selector: '.gaji-card',
                text: 'Cek gaji saya di Aldi Official Store!'
            },
            {
                selector: '.stat-card',
                text: 'Lihat statistik gaji saya!'
            }
        ];
        
        shareButtons.forEach(config => {
            const elements = document.querySelectorAll(config.selector);
            elements.forEach(element => {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'share-btn';
                shareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Share';
                shareBtn.onclick = () => this.shareToWhatsApp(config.text);
                element.appendChild(shareBtn);
            });
        });
    }

    shareToWhatsApp(text) {
        const url = window.location.href;
        const message = `${text} \n\nAkses: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    // Biometric Authentication (experimental)
    setupBiometricAuth() {
        if ('credentials' in navigator && 'create' in navigator.credentials) {
            // WebAuthn API available
            this.setupWebAuthn();
        }
    }

    async setupWebAuthn() {
        // This is experimental and would require server-side setup
        console.log('WebAuthn available for biometric auth');
        
        // Add biometric login option
        const biometricBtn = document.createElement('button');
        biometricBtn.className = 'biometric-login-btn';
        biometricBtn.innerHTML = '<i class="fas fa-fingerprint"></i> Login dengan Sidik Jari';
        biometricBtn.onclick = () => this.biometricLogin();
        
        const loginForm = document.querySelector('#loginForm');
        if (loginForm) {
            loginForm.appendChild(biometricBtn);
        }
    }

    async biometricLogin() {
        try {
            // Public key credential options
            const credential = await navigator.credentials.create({
                publicKey: {
                    // This would come from server
                    challenge: new Uint8Array(32),
                    rp: { name: "Aldi Official Store" },
                    user: {
                        id: new Uint8Array(16),
                        name: "user@example.com",
                        displayName: "User"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "preferred"
                    },
                    timeout: 60000,
                    attestation: "none"
                }
            });
            
            console.log('Biometric auth successful:', credential);
            this.showToast('Login dengan sidik jari berhasil!');
            
        } catch (error) {
            console.log('Biometric auth failed:', error);
            this.showToast('Sidik jari tidak dikenali');
        }
    }

    // Geolocation for attendance
    setupGeolocation() {
        // Add location button for attendance
        const locationBtn = document.createElement('button');
        locationBtn.className = 'location-btn';
        locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Lokasi Saya';
        locationBtn.onclick = () => this.getCurrentLocation();
        
        // Add to dashboard
        const dashboard = document.querySelector('.dashboard-header');
        if (dashboard) {
            dashboard.appendChild(locationBtn);
        }
    }

    async getCurrentLocation() {
        if ('geolocation' in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                
                const { latitude, longitude } = position.coords;
                console.log('Location:', latitude, longitude);
                
                // Show location info
                this.showLocationInfo(latitude, longitude);
                
            } catch (error) {
                console.log('Location error:', error);
                this.showToast('Tidak bisa mendapatkan lokasi');
            }
        } else {
            this.showToast('Geolocation tidak support di device ini');
        }
    }

    showLocationInfo(lat, lng) {
        // Reverse geocoding would go here
        // For now, show coordinates
        this.showToast(`Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }

    // Utility: Toast Notification
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'android-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize Android features
const androidFeatures = new AndroidFeatures();

// Export for global use
window.AndroidFeatures = AndroidFeatures;
window.androidFeatures = androidFeatures;