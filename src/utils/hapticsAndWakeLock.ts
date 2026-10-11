// Mobile Screen WakeLock API & Haptic Vibration Utility

class MobileDeviceManager {
  private wakeLockSentinel: any = null;
  private isWakeLockRequested: boolean = false;
  private listeners: Set<(isActive: boolean) => void> = new Set();

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isWakeLockRequested) {
          this.acquireWakeLock();
        }
      });
    }
  }

  // Subscribe to wake lock state changes
  subscribeWakeLock(callback: (isActive: boolean) => void) {
    this.listeners.add(callback);
    callback(this.isWakeLockActive());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const active = this.isWakeLockActive();
    this.listeners.forEach((fn) => fn(active));
  }

  isWakeLockActive(): boolean {
    return Boolean(this.wakeLockSentinel && !this.wakeLockSentinel.released);
  }

  async acquireWakeLock(): Promise<boolean> {
    this.isWakeLockRequested = true;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const nav = navigator as any;
        this.wakeLockSentinel = await nav.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.notify();
        });
        this.notify();
        return true;
      } catch (err) {
        console.warn('Screen WakeLock request error:', err);
        this.notify();
        return false;
      }
    }
    return false;
  }

  async releaseWakeLock(): Promise<void> {
    this.isWakeLockRequested = false;
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch (err) {
        console.warn('Screen WakeLock release error:', err);
      }
    }
    this.notify();
  }

  // Haptic feedback via Vibration API
  triggerHaptic(type: 'tap' | 'select' | 'nav' | 'success' | 'warning' | 'error' = 'tap') {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    try {
      switch (type) {
        case 'tap':
          navigator.vibrate(8);
          break;
        case 'select':
          navigator.vibrate(15);
          break;
        case 'nav':
          navigator.vibrate(10);
          break;
        case 'success':
          navigator.vibrate([20, 40, 30]);
          break;
        case 'warning':
          navigator.vibrate([40, 60, 40]);
          break;
        case 'error':
          navigator.vibrate([60, 50, 60]);
          break;
      }
    } catch {
      // Ignore vibration error on non-supporting devices
    }
  }
}

export const mobileDevice = new MobileDeviceManager();
