import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'rawaes_session_token';

// expo-secure-store only wraps native Keychain/Keystore — on web there's
// nothing to wrap, so this falls back to localStorage there, same pattern
// used elsewhere in the app for native/web platform splits.
export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
