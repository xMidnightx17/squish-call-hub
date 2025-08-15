// Simple browser-based notification sounds
export class NotificationSounds {
  private static audioContext: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Create a simple beep sound using Web Audio API
  private static createBeep(frequency: number, duration: number, volume: number = 0.1): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);

      oscillator.onended = () => resolve();
    });
  }

  // Create a cute chord progression
  private static async playChord(frequencies: number[], duration: number, volume: number = 0.08): Promise<void> {
    const promises = frequencies.map(freq => this.createBeep(freq, duration, volume));
    await Promise.all(promises);
  }

  // Cute incoming call ringtone (happy melody) 🎵
  static async playIncomingCall(): Promise<void> {
    try {
      // Happy ascending melody like a cute phone ringing
      await this.createBeep(523, 0.2, 0.12); // C5
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createBeep(659, 0.2, 0.12); // E5
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createBeep(784, 0.3, 0.12); // G5
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Repeat with slight variation
      await this.createBeep(523, 0.15, 0.10);
      await new Promise(resolve => setTimeout(resolve, 40));
      await this.createBeep(659, 0.15, 0.10);
      await new Promise(resolve => setTimeout(resolve, 40));
      await this.createBeep(880, 0.25, 0.12); // A5 - higher ending
      
    } catch (error) {
      console.warn('Could not play incoming call sound:', error);
    }
  }

  // Super cute call join sound (magical chime) ✨
  static async playCallJoin(): Promise<void> {
    try {
      // Magical ascending chime like fairy dust
      await this.createBeep(880, 0.12, 0.08);  // A5
      await new Promise(resolve => setTimeout(resolve, 30));
      await this.createBeep(1047, 0.12, 0.08); // C6
      await new Promise(resolve => setTimeout(resolve, 30));
      await this.createBeep(1319, 0.15, 0.10); // E6
      await new Promise(resolve => setTimeout(resolve, 30));
      await this.createBeep(1568, 0.18, 0.12); // G6
      
      // Cute harmonic ending
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.playChord([1047, 1319, 1568], 0.3, 0.06); // Happy chord
      
    } catch (error) {
      console.warn('Could not play call join sound:', error);
    }
  }

  // Gentle call leave sound (soft goodbye) 👋
  static async playCallLeave(): Promise<void> {
    try {
      // Gentle descending melody like a soft goodbye
      await this.createBeep(784, 0.15, 0.10); // G5
      await new Promise(resolve => setTimeout(resolve, 40));
      await this.createBeep(659, 0.15, 0.09); // E5
      await new Promise(resolve => setTimeout(resolve, 40));
      await this.createBeep(523, 0.20, 0.08); // C5
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Soft final note
      await this.createBeep(392, 0.25, 0.06); // G4 - gentle ending
      
    } catch (error) {
      console.warn('Could not play call leave sound:', error);
    }
  }

  // Call rejection sound (gentle disappointment)
  static async playCallRejected(): Promise<void> {
    try {
      // Gentle descending notes that aren't too harsh
      await this.createBeep(659, 0.12, 0.06); // E5
      await new Promise(resolve => setTimeout(resolve, 40));
      await this.createBeep(523, 0.12, 0.05); // C5
      await new Promise(resolve => setTimeout(resolve, 40));
      await this.createBeep(392, 0.15, 0.04); // G4
      
    } catch (error) {
      console.warn('Could not play call rejected sound:', error);
    }
  }

  // Call initiation sound (hopeful chime)
  static async playCallInitiated(): Promise<void> {
    try {
      // Optimistic ascending notes
      await this.createBeep(523, 0.1, 0.08); // C5
      await new Promise(resolve => setTimeout(resolve, 30));
      await this.createBeep(659, 0.1, 0.08); // E5
      await new Promise(resolve => setTimeout(resolve, 30));
      await this.createBeep(784, 0.12, 0.09); // G5
      
    } catch (error) {
      console.warn('Could not play call initiated sound:', error);
    }
  }

  // Message notification sound (cute pop)
  static async playMessageNotification(): Promise<void> {
    try {
      // Cute bubble pop sound
      await this.createBeep(1200, 0.08, 0.08);
      await new Promise(resolve => setTimeout(resolve, 20));
      await this.createBeep(1400, 0.06, 0.06);
    } catch (error) {
      console.warn('Could not play message notification sound:', error);
    }
  }

  // Call end sound (gentle farewell) - keeping for compatibility
  static async playCallEnd(): Promise<void> {
    // Redirect to the new call leave sound
    await this.playCallLeave();
  }

  // Call connect sound (success chime) - keeping for compatibility  
  static async playCallConnect(): Promise<void> {
    // Redirect to the new call join sound
    await this.playCallJoin();
  }
}

// Request notification permission on first use
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Show browser notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};
