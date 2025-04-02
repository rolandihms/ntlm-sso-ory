import fetchMock from 'jest-fetch-mock';

// Configure fetchMock
fetchMock.enableMocks();

// Ensure we're in test environment
process.env.NODE_ENV = 'test';

// Mock responses
export const mockResponses = {
    ntlm_type_2: {
        status: 200,
        headers: {
            // Shortened headers to avoid validation issues
            'www-authenticate': 'NTLM TlRMTVNTUAACAA=='
        }
    },
    oauth_challenge: {
        status: 200,
        body: {
            challenge: 'test-challenge'
        }
    },
    login: {
        status: 200,
        body: {
            code: 'test-code'
        }
    },
    token: {
        status: 200,
        body: {
            access_token: 'test-token',
            expires_in: 3600,
            scope: '',
            token_type: 'bearer'
        }
    }
};

export const mockConfig = {
    clientId: 'test-client-id',
    issuerUrl: 'http://localhost:3000/'
};

// Global beforeEach to reset mocks
// beforeEach(() => {
//     fetchMock.resetMocks();
// });
