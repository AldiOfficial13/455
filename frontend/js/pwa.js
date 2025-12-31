// Progressive Web App Registration
class PWAManager {
  constructor() {
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupNetworkStatus();
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    }
  }

  // Setup Install Prompt
  setupInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button
      this.showInstallButton(deferredPrompt);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallButton();
    });
  }

  // Show Install Button
  showInstallButton(deferredPrompt) {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
    installButton.className = 'install-button';
    
    installButton.onclick = async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
    };
    
    document.body.appendChild(installButton);
  }

  // Hide Install Button
  hideInstallButton() {
    const button = document.getElementById('installButton');
    if (button) button.remove();
  }

  // Setup Offline Detection
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.showNetworkStatus('Online', '#4CAF50');
    });
    
    window.addEventListener('offline', () => {
      this.showNetworkStatus('Offline', '#f44336');
    });
  }

  // Network Status
  setupNetworkStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'networkStatus';
    statusDiv.className = 'network-status';
    document.body.appendChild(statusDiv);
  }

  showNetworkStatus(status, color) {
    const statusDiv = document.getElementById('networkStatus');
    statusDiv.innerHTML = `
      <i class="fas fa-wifi"></i> ${status}
    `;
    statusDiv.style.backgroundColor = color;
    statusDiv.classList.add('show');
    
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }

  // Show Update Notification
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <i class="fas fa-sync-alt"></i>
        <span>Update tersedia!</span>
        <button onclick="location.reload()">Refresh</button>
      </div>
    `;
    document.body.appendChild(notification);
  }

  // Check if running as PWA
  isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  // Android specific features
  setupAndroidFeatures() {
    if (this.isRunningAsPWA()) {
      this.setupBackButton();
      this.setupPullToRefresh();
      this.setupVibration();
    }
  }

  // Handle Android back button
  setupBackButton() {
    window.addEventListener('load', () => {
      window.history.pushState({ noBackExitsApp: true }, '');
    });
    
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.noBackExitsApp) {
        window.history.pushState({ noBackExitsApp: true }, '');
      }
    });
  }

  // Pull to refresh
  setupPullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      this.handlePullToRefresh();
    });
  }

  handlePullToRefresh() {
    const pullDistance = touchEndY - touchStartY;
    if (pullDistance > 150 && window.scrollY === 0) {
      location.reload();
    }
  }

  // Vibration feedback
  setupVibration() {
    // Add vibration to buttons
    document.querySelectorAll('button, .btn, .btn-primary').forEach(button => {
      button.addEventListener('click', () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      });
    });
  }

  // Share functionality
  async shareData(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback untuk browser yang tidak support
      this.fallbackShare(data);
    }
  }

  fallbackShare(data) {
    const url = data.url || window.location.href;
    const text = data.text || '';
    
    // WhatsApp share
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Camera access for QR code
  async accessCamera() {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        return stream;
      } catch (error) {
        console.log('Camera access denied:', error);
        return null;
      }
    }
    return null;
  }

  // Full screen mode
  enterFullscreen() {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }

  // Battery status (untuk hemat baterai)
  async getBatteryStatus() {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    }
    return null;
  }
}

// Initialize PWA
const pwaManager = new PWAManager();

// Export untuk digunakan di file lain
window.PWAManager = PWAManager;
window.pwaManager = pwaManager;