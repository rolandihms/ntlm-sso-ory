import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';

let fetchClient: typeof fetch;

if (process.env.NODE_ENV === 'test') {
    // In test environment, use the mocked fetch
    fetchClient = fetch;
} else {
    // In production, use fetch-cookie
    const cookieJar = new CookieJar();
    fetchClient = fetchCookie(fetch, cookieJar);
}

export default fetchClient;
