// Browser compatibility layer for Chrome/Firefox
export const browserAPI: typeof chrome =
  typeof browser !== 'undefined' ? (browser as unknown as typeof chrome) : chrome;

export function sendMessage<T>(message: unknown): Promise<T> {
  // Firefox supports the promise-based browser.runtime.sendMessage natively
  if (typeof browser !== 'undefined') {
    return (browser as any).runtime.sendMessage(message);
  }

  // Chrome uses callback style
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
}
