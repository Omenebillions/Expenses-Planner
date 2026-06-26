/// <reference types="vite/client" />

interface Window {
  ReactNativeWebView?: {
    postMessage(msg: string): void;
  };
}
