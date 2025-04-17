import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

function createFetchClient(): typeof fetch {
    if (process.env.NODE_ENV === 'test') {
        // In test environment, use the global fetch (which will be mocked by jest-fetch-mock)
        return fetch;
    } else {
        // In production, use fetch-cookie
        const cookieJar = new CookieJar();
        return fetchCookie(fetch, cookieJar);
    }
}

// Create a fetch client with a cookie jar that can be cleaned up
export function createRequestFetchClient(): { 
    fetchWithCookies: typeof fetch; 
    cleanupCookieJar: () => Promise<void>;
} {
    if (process.env.NODE_ENV === 'test') {
        // For tests, return a simpler version
        return {
            fetchWithCookies: fetch,
            cleanupCookieJar: async () => {} // No-op for tests
        };
    } else {
        const cookieJar = new CookieJar();
        const fetchWithCookies = fetchCookie(fetch, cookieJar);
        
        // Function to clean up all cookies from the jar
        const cleanupCookieJar = async (): Promise<void> => {
            // Use the removeAllCookies method to clear all cookies from the jar
            await cookieJar.removeAllCookies();
        };
        
        return { fetchWithCookies, cleanupCookieJar };
    }
}

// Keep the default export for backward compatibility
const fetchClient = createFetchClient();
export default fetchClient;
