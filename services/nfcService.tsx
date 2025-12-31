import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import { Platform, AppState } from 'react-native';

class NFCService {
  private statusCallbacks: Array<(status: { hasNfc: boolean; enabled: boolean }) => void> = [];

  async initialize(): Promise<{ hasNfc: boolean; enabled: boolean }> {
    try {
      const hasNfc = await NfcManager.isSupported();
      
      if (!hasNfc) {
        return { hasNfc: false, enabled: false };
      }

      await NfcManager.start();
      const enabled = await NfcManager.isEnabled();
      
      return { hasNfc, enabled };
    } catch (error) {
      console.error('NFC initialization error:', error);
      return { hasNfc: false, enabled: false };
    }
  }

  async checkNfcStatus(): Promise<{ hasNfc: boolean; enabled: boolean }> {
    try {
      const hasNfc = await NfcManager.isSupported();
      const enabled = hasNfc ? await NfcManager.isEnabled() : false;
      
      return { hasNfc, enabled };
    } catch (error) {
      console.error('Error checking NFC status:', error);
      return { hasNfc: false, enabled: false };
    }
  }

  addNfcStateListener(callback: (status: { hasNfc: boolean; enabled: boolean }) => void): () => void {
    this.statusCallbacks.push(callback);

    const checkAndNotify = async () => {
      const status = await this.checkNfcStatus();
      callback(status);
    };

    const intervalId = setInterval(checkAndNotify, Platform.OS === 'android' ? 5000 : 3000);

    const appStateSubscription = Platform.OS === 'android' 
      ? AppState.addEventListener('change', (nextAppState) => {
          if (nextAppState === 'active') {
            checkAndNotify();
          }
        })
      : null;

    return () => {
      clearInterval(intervalId);
      appStateSubscription?.remove();
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  convertUidToString(uid: any): string {
    try {
      if (typeof uid === 'string') {
        return uid.replace(/[:\\s-]/g, '').toUpperCase();
      } else if (Array.isArray(uid)) {
        return uid.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      } else if (typeof uid === 'object' && uid.value) {
        return this.convertUidToString(uid.value);
      } else {
        return String(uid).replace(/[:\\s-]/g, '').toUpperCase();
      }
    } catch (error) {
      console.error('Error converting UID:', error);
      return 'unknown';
    }
  }

  async startScanning(
    onTagDiscovered: (uid: string) => void,
    onSessionClosed: () => void
  ): Promise<void> {
    try {
      const { enabled } = await this.checkNfcStatus();
      if (!enabled) {
        throw new Error('NFC is not enabled');
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);

      await NfcManager.registerTagEvent();
      
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
        if (tag?.id) {
          const uid = this.convertUidToString(tag.id);
          onTagDiscovered(uid);
        }
      });

      NfcManager.setEventListener(NfcEvents.SessionClosed, onSessionClosed);

    } catch (error) {
      console.error('NFC scan error:', error);
      throw new Error('Failed to start NFC scanning');
    }
  }

  async stopScanning(): Promise<void> {
    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);
      await NfcManager.unregisterTagEvent().catch(() => {
      });
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
      throw error;
    }
  }

  cleanup(): void {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    this.statusCallbacks = [];
    NfcManager.cancelTechnologyRequest().catch(() => {
    });
  }
}

export const nfcService = new NFCService();