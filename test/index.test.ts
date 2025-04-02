import { handleNtlmAuth } from '../src';
import { mockConfig } from './setup';
import fetchMock from 'jest-fetch-mock';
import type { OAuthChallenge, LoginResponse, TokenResponse } from '../src/types';

// Create mock function implementations
const mockGetNtlmChallenge = jest.fn<Promise<string | null>, [string, string]>();
const mockGetOAuthChallenge = jest.fn<Promise<OAuthChallenge>, [string, string]>();
const mockProcessLogin = jest.fn<Promise<LoginResponse>, [string, string, string]>();
const mockExchangeCodeForToken = jest.fn<Promise<TokenResponse>, [string, string, string]>();

// Mock the utils module with explicit type annotations
jest.mock('../src/utils', () => ({
    getNtlmChallenge: function(authHeader: string, issuerUrl: string): Promise<string | null> {
        return mockGetNtlmChallenge(authHeader, issuerUrl);
    },
    getOAuthChallenge: function(issuerUrl: string, clientId: string): Promise<OAuthChallenge> {
        return mockGetOAuthChallenge(issuerUrl, clientId);
    },
    processLogin: function(issuerUrl: string, challenge: string, ntlmToken: string): Promise<LoginResponse> {
        return mockProcessLogin(issuerUrl, challenge, ntlmToken);
    },
    exchangeCodeForToken: function(issuerUrl: string, clientId: string, code: string): Promise<TokenResponse> {
        return mockExchangeCodeForToken(issuerUrl, clientId, code);
    }
}));

describe('handleNtlmAuth', () => {
    const testNtlmType1 = 'NTLM test-type1';
    const testNtlmType3 = 'NTLM test-type3';

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        fetchMock.resetMocks();
        
        // Set up default mock implementations
        mockGetNtlmChallenge.mockImplementation((authHeader: string) => {
            if (authHeader === testNtlmType1) {
                return Promise.resolve('NTLM TlRMTVNTUAACAA==');
            } else {
                return Promise.resolve(null);
            }
        });
        
        mockGetOAuthChallenge.mockResolvedValue({
            challenge: 'test-challenge'
        });
        
        mockProcessLogin.mockResolvedValue({
            code: 'test-code'
        });
        
        mockExchangeCodeForToken.mockResolvedValue({
            access_token: 'test-token',
            expires_in: 3600,
            scope: 'openid',
            token_type: 'bearer'
        });
    });

    it('should return NTLM challenge when no authorization header is present', async () => {
        const result = await handleNtlmAuth({}, mockConfig);
        expect(result).toEqual({
            status: 'challenge',
            headers: {
                'WWW-Authenticate': 'NTLM'
            }
        });
    });

    it('should return Type 2 message when Type 1 message is received', async () => {
        const result = await handleNtlmAuth({
            authorization: testNtlmType1
        }, mockConfig);

        // Verify the mock was called correctly
        expect(mockGetNtlmChallenge).toHaveBeenCalledWith(testNtlmType1, mockConfig.issuerUrl);
        
        // Verify the result
        expect(result.status).toBe('challenge');
        expect(result.headers).toBeDefined();
        expect(result.headers?.['WWW-Authenticate']).toBe('NTLM TlRMTVNTUAACAA==');
    });

    it('should complete authentication flow with Type 3 message', async () => {
        // For Type 3 messages, getNtlmChallenge should return null
        mockGetNtlmChallenge.mockResolvedValueOnce(null);
        
        const result = await handleNtlmAuth({
            authorization: testNtlmType3
        }, mockConfig);

        // Verify all mocks were called in sequence
        expect(mockGetNtlmChallenge).toHaveBeenCalledWith(testNtlmType3, mockConfig.issuerUrl);
        expect(mockGetOAuthChallenge).toHaveBeenCalledWith(mockConfig.issuerUrl, mockConfig.clientId);
        expect(mockProcessLogin).toHaveBeenCalledWith(mockConfig.issuerUrl, 'test-challenge', testNtlmType3);
        expect(mockExchangeCodeForToken).toHaveBeenCalledWith(mockConfig.issuerUrl, mockConfig.clientId, 'test-code');
        
        expect(result).toEqual({
            status: 'success',
            token: 'test-token'
        });
    });
    
    it('should handle errors in the authentication flow', async () => {
        // For Type 3 messages, getNtlmChallenge should return null
        mockGetNtlmChallenge.mockResolvedValueOnce(null);
        
        // Setup mock to throw an error
        mockGetOAuthChallenge.mockRejectedValueOnce(new Error('Network error'));

        const result = await handleNtlmAuth({
            authorization: testNtlmType3
        }, mockConfig);

        expect(result).toEqual({
            status: 'error',
            error: 'Network error'
        });
    });

    it('should handle invalid authorization header', async () => {
        const result = await handleNtlmAuth({
            authorization: 'Invalid'  // Not starting with NTLM
        }, mockConfig);

        expect(result).toEqual({
            status: 'error',
            error: 'Invalid authorization header'
        });
    });
});