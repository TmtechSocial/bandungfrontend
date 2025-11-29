import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { getFirebaseApp } from "./firebaseApp.js";
import axios from "axios";

export async function registerFcmToken({ token, apiUrl, userId }) {
  // Cek apakah di browser dan FCM didukung
  if (typeof window === 'undefined') {
    console.log("FCM: Running in server environment, skipping FCM registration");
    return false;
  }

  try {
    // Cek apakah FCM didukung di browser ini
    const supported = await isSupported();
    if (!supported) {
      console.log("FCM: Browser doesn't support Firebase Messaging");
      return false;
    }

    // Cek apakah Notification API tersedia
    if (!('Notification' in window)) {
      console.log("FCM: Browser doesn't support notifications");
      return false;
    }

    const app = getFirebaseApp();
    const messaging = getMessaging(app);
    
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("FCM: Notification permission denied");
      return false;
    }

    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
    });

    console.log("fcm token sayaaa", fcmToken);

    if (!fcmToken) {
      console.log("FCM: Failed to get FCM token");
      return false;
    }

    console.log("userId", userId);
    if (!userId) {
      console.log("FCM: UserId is required");
      return false;
    }

    console.log("FCM: Registering token with backend");
    const response = await axios.post(`${apiUrl}register-fcm`, {
      token: fcmToken,
      userId,
    });

    console.log("FCM registration response:", response.data);
    return response.data.success;

  } catch (err) {
    console.error("FCM error after login:", err);
    return false;
  }
}
