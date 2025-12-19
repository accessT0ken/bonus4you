const API_BASE_URL = '/api';

let healthCheckCache: { isHealthy: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5000;

export async function checkApiHealth(): Promise<boolean> {
  if (healthCheckCache && Date.now() - healthCheckCache.timestamp < CACHE_DURATION) {
    return healthCheckCache.isHealthy;
  }

  try {
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
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  return false;
}

export function clearHealthCache(): void {
  healthCheckCache = null;
}

