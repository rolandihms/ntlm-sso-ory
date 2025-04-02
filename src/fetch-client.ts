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

const fetchClient = createFetchClient();

export default fetchClient;
