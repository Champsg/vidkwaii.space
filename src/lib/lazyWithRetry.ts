import { lazy, ComponentType } from 'react';

/**
 * Wraps dynamic React component imports with automatic reload & retry logic.
 * When Vite ships a new deployment, users with older cached chunks get
 * "Failed to fetch dynamically imported module" or Preload errors.
 * This helper catches that error and triggers a clean reload or retry,
 * preventing users from landing on the "Something went wrong" crash screen.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('vk_chunk_retry') || 'false'
    );

    try {
      const module = await factory();
      window.sessionStorage.setItem('vk_chunk_retry', 'false');
      return module;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Chunk failed to load (likely due to fresh deployment or network glitch)
        window.sessionStorage.setItem('vk_chunk_retry', 'true');
        window.location.reload();
        // Return a promise that doesn't reject while reload takes place
        return new Promise<{ default: T }>(() => {});
      }
      // If already reloaded once and failed, rethrow
      throw error;
    }
  });
}
