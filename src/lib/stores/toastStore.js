// toastStore.js
import { writable } from 'svelte/store';

export const toasts = writable([]);

let toastId = 0;

export function addToast(message, type = 'info', duration = 3000) {
  const id = toastId++;
  const toast = { id, message, type, duration };
  
  toasts.update(toastList => [...toastList, toast]);
  
  // Auto remove after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
  
  return id;
}

export function removeToast(id) {
  toasts.update(toastList => toastList.filter(toast => toast.id !== id));
}

export const toast = {
  success: (message, duration) => addToast(message, 'success', duration),
  error: (message, duration) => addToast(message, 'error', duration),
  warning: (message, duration) => addToast(message, 'warning', duration),
  info: (message, duration) => addToast(message, 'info', duration),
};
