import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import { Platform, AppState } from 'react-native';

class NFCService {
  private nfcListeners: Array<{ event: string; listener: Function }> = [];
  private statusCallbacks: Array<(status: { hasNfc: boolean; enabled: boolean }) => void> = [];

  async initialize(): Promise<{ hasNfc: boolean; enabled: boolean }> {
    try {
      const supported = await NfcManager.isSupported();
      
      if (!supported) {
        return { hasNfc: false, enabled: false };
      }

      await NfcManager.start();
      const enabled = await NfcManager.isEnabled();
      
      return { hasNfc: true, enabled };
    } catch (error) {
      console.error('NFC initialization error:', error);
      return { hasNfc: false, enabled: false };
    }
  }

  async checkNfcStatus(): Promise<{ hasNfc: boolean; enabled: boolean }> {
    try {
      const hasNfc = await NfcManager.isSupported();
      let enabled = false;
      
      if (hasNfc) {
        enabled = await NfcManager.isEnabled();
      }
      
      return { hasNfc, enabled };
    } catch (error) {
      console.error('Error checking NFC status:', error);
      return { hasNfc: false, enabled: false };
    }
  }

  addNfcStateListener(callback: (status: { hasNfc: boolean; enabled: boolean }) => void): () => void {
    this.statusCallbacks.push(callback);

    if (Platform.OS === 'android') {
      const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('App became active, checking NFC status...');
          const status = await this.checkNfcStatus();
          callback(status);
        }
      });

      const intervalId = setInterval(async () => {
        const status = await this.checkNfcStatus();
        callback(status);
      }, 5000);

      return () => {
        appStateSubscription.remove();
        clearInterval(intervalId);
        this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
      };
    } else {
      const intervalId = setInterval(async () => {
        const status = await this.checkNfcStatus();
        callback(status);
      }, 3000);

      return () => {
        clearInterval(intervalId);
        this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
      };
    }
  }

  private async notifyStatusChange() {
    const status = await this.checkNfcStatus();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in NFC status callback:', error);
      }
    });
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
      const currentStatus = await this.checkNfcStatus();
      if (!currentStatus.enabled) {
        throw new Error('NFC is not enabled');
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);

      await NfcManager.registerTagEvent();
      
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
        console.log('NFC Tag Discovered:', tag);
        
        if (tag && tag.id) {
          const uid = this.convertUidToString(tag.id);
          console.log('Converted UID:', uid);
          onTagDiscovered(uid);
        }
      });

      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        console.log('NFC Session Closed');
        onSessionClosed();
      });

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
        console.log('NFC already unregistered');
      });
      console.log('✅ NFC scanning stopped');
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
      throw error;
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up NFC listeners...');
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    this.nfcListeners = [];
    this.statusCallbacks = [];
    NfcManager.cancelTechnologyRequest().catch(() => {
      console.log('NFC cleanup completed');
    });
  }
}

export const nfcService = new NFCService();