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
    getCookies: (domain?: string) => Promise<string[]>;
    setCookie: (cookie: string, url?: string) => Promise<void>;
} {
    if (process.env.NODE_ENV === 'test') {
        // For tests, return a simpler version
        return {
            fetchWithCookies: fetch,
            cleanupCookieJar: async () => {}, // No-op for tests
            getCookies: async () => [], // No cookies in tests
            setCookie: async () => {} // No-op for tests
        };
    } else {
        const cookieJar = new CookieJar();
        const fetchWithCookies = fetchCookie(fetch, cookieJar);
        
        // Function to clean up all cookies from the jar
        const cleanupCookieJar = async (): Promise<void> => {
            // Use the removeAllCookies method to clear all cookies from the jar
            await cookieJar.removeAllCookies();
        };
        
        // Function to get cookies for debugging
        const getCookies = async (domain?: string): Promise<string[]> => {
            if (domain) {
                try {
                    const cookies = await cookieJar.getCookies(domain);
                    return cookies.map(cookie => cookie.toString());
                } catch (error) {
                    console.warn(`Error getting cookies for domain ${domain}:`, error);
                    return [];
                }
            } else {
                // Get all cookies from the jar without filtering by domain
                return new Promise((resolve) => {
                    cookieJar.store.getAllCookies((err, cookies) => {
                        if (err || !cookies) {
                            console.warn('Error getting all cookies:', err);
                            resolve([]);
                        } else {
                            resolve(cookies.map(cookie => cookie.toString()));
                        }
                    });
                });
            }
        };
        
        // Function to set a cookie in the jar
        const setCookie = async (cookie: string, url?: string): Promise<void> => {
            try {
                // Default to a general URL if none provided
                const cookieUrl = url || 'http://localhost/';
                await cookieJar.setCookie(cookie, cookieUrl);
            } catch (error) {
                console.warn(`Error setting cookie for URL ${url || 'default'}:`, error);
            }
        };
        
        return { fetchWithCookies, cleanupCookieJar, getCookies, setCookie };
    }
}

// Keep the default export for backward compatibility
const fetchClient = createFetchClient();
export default fetchClient;
