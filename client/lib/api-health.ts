// API Health Check Utility

// Use relative path for API calls (proxied through Next.js rewrites to backend)
// The rewrite is configured in next.config.mjs
const API_BASE_URL = '/api';

let healthCheckCache: { isHealthy: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 seconds cache

export async function checkApiHealth(): Promise<boolean> {
  // Check cache first
  if (healthCheckCache && Date.now() - healthCheckCache.timestamp < CACHE_DURATION) {
    return healthCheckCache.isHealthy;
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok;
    healthCheckCache = {
      isHealthy,
      timestamp: Date.now(),
    };

    return isHealthy;
  } catch (error) {
    // Network error or timeout
    healthCheckCache = {
      isHealthy: false,
      timestamp: Date.now(),
    };
    return false;
  }
}

export async function waitForApi(maxRetries: number = 30, interval: number = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const isHealthy = await checkApiHealth();
    if (isHealthy) {
      return true;
    }
    
    // Wait before next retry (except on last attempt)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  return false;
}

export function clearHealthCache(): void {
  healthCheckCache = null;
}

