import {
    getNtlmChallenge,
    getOAuthChallenge,
    processLogin,
    exchangeCodeForToken,
    getNtlmMessageType,
    parseNtlmHeader
} from '../src/utils';
import fetchClient from '../src/fetch-client';

// Mock the fetch client
jest.mock('../src/fetch-client', () => ({
    __esModule: true,
    default: jest.fn()
}));

// Mock crypto.randomUUID()
const originalCrypto = global.crypto;
global.crypto = { 
    ...originalCrypto,
    randomUUID: jest.fn().mockReturnValue('test-uuid') 
};

describe('utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.crypto.randomUUID as jest.Mock).mockReturnValue('test-uuid');
    });

    afterAll(() => {
        global.crypto = originalCrypto;
    });

    describe('getNtlmChallenge', () => {
        test('should return a successful challenge with NTLM header', async () => {
            const mockResponse = {
                status: 401,
                statusText: 'Unauthorized',
                headers: {
                    get: jest.fn((header) => {
                        if (header === 'www-authenticate') {
                            return 'NTLM TlRMTVNTUAACAAAA...';
                        }
                        return null;
                    })
                }
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            const result = await getNtlmChallenge('NTLM TlRMTVNTUABB...',"", 'https://example.com/', false);
            
            expect(result).toEqual({
                success: true,
                header: 'NTLM TlRMTVNTUAACAAAA...',
                status: 401
            });
            expect(fetchClient).toHaveBeenCalledWith('https://example.com/sso/challenge', {
                method: 'GET',
                headers: {
                    Authorization: 'NTLM TlRMTVNTUABB...'
                }
            });
        });
        
        test('should return success but no header when non-NTLM www-authenticate header', async () => {
            const mockResponse = {
                status: 401,
                statusText: 'Unauthorized',
                headers: {
                    get: jest.fn((header) => {
                        if (header === 'www-authenticate') {
                            return 'Basic realm="example"';
                        }
                        return null;
                    })
                }
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            const result = await getNtlmChallenge('NTLM TlRMTVNTUABB...',"", 'https://example.com/');
            
            expect(result).toEqual({
                success: true,
                header: null,
                status: 401
            });
        });
        
        test('should return failure for non-401 status', async () => {
            const mockResponse = {
                status: 500,
                statusText: 'Internal Server Error',
                headers: {
                    get: jest.fn(() => null)
                }
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            const result = await getNtlmChallenge('NTLM TlRMTVNTUABB...',"", 'https://example.com/');
            
            expect(result).toEqual({
                success: false,
                header: null,
                status: 500,
                error: 'Error: Internal Server Error'
            });
        });
    });

    describe('getOAuthChallenge', () => {
        test('should fetch OAuth challenge from issuer', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ challenge: 'test-challenge' })
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            const result = await getOAuthChallenge('https://example.com/',"", 'test-client-id');
            
            expect(result).toEqual({ challenge: 'test-challenge' });
            expect(fetchClient).toHaveBeenCalledWith(
                'https://example.com/auth?response_type=code&client_id=test-client-id&state=test-uuid',
                { method: 'GET' }
            );
        });
        
        test('should handle debug mode correctly', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ challenge: 'test-challenge' })
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            // Spy on console.log to verify debug output
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await getOAuthChallenge('https://example.com/', "",'test-client-id', true);
            
            expect(consoleLogSpy).toHaveBeenCalled();
            
            consoleLogSpy.mockRestore();
        });
    });
    
    describe('processLogin', () => {
        test('should process login with challenge and NTLM token', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ code: 'test-auth-code' })
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            const result = await processLogin(
                'https://example.com/',
                'test-challenge',
                'NTLM test-token',
                ""
            );
            
            expect(result).toEqual({ code: 'test-auth-code' });
            expect(fetchClient).toHaveBeenCalledWith('https://example.com/login', {
                method: 'POST',
                body: JSON.stringify({
                    challenge: 'test-challenge',
                    ssoToken: 'NTLM test-token'
                })
            });
        });
        
        test('should throw error for non-ok response', async () => {
            const mockResponse = {
                ok: false,
                status: 401
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            await expect(processLogin(
                'https://example.com/',
                'test-challenge',
                'NTLM test-token',
                ""	
            )).rejects.toThrow('Login failed with status 401');
        });
        
        test('should handle debug mode', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ code: 'test-auth-code' })
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            // Spy on console.log to verify debug output
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await processLogin(
                'https://example.com/',
                'test-challenge',
                'NTLM test-token',
                "",	
                true
            );
            
            expect(consoleLogSpy).toHaveBeenCalled();
            
            consoleLogSpy.mockRestore();
        });
    });
    
    describe('exchangeCodeForToken', () => {
        test('should exchange code for token correctly', async () => {
            const mockTokenResponse = {
                access_token: 'test-access-token',
                token_type: 'bearer',
                expires_in: 3600,
                scope: 'openid'
            };
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockTokenResponse)
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            const result = await exchangeCodeForToken(
                'https://example.com/',
                'test-client-id',
                'test-code'
            );
            
            expect(result).toEqual(mockTokenResponse);
            expect(fetchClient).toHaveBeenCalledWith('https://example.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: expect.any(URLSearchParams)
            });
            
            // Extract and verify the URLSearchParams
            const callArgs = (fetchClient as jest.Mock).mock.calls[0][1];
            const bodyParams = new URLSearchParams(callArgs.body.toString());
            expect(bodyParams.get('grant_type')).toBe('authorization_code');
            expect(bodyParams.get('client_id')).toBe('test-client-id');
            expect(bodyParams.get('code')).toBe('test-code');
        });
        
        test('should throw error for non-ok response', async () => {
            const mockResponse = {
                ok: false,
                status: 400
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            await expect(exchangeCodeForToken(
                'https://example.com/',
                'test-client-id',
                'test-code'
            )).rejects.toThrow('Token exchange failed with status 400');
        });
        
        test('should handle debug mode', async () => {
            const mockTokenResponse = {
                access_token: 'test-access-token',
                token_type: 'bearer',
                expires_in: 3600,
                scope: 'openid'
            };
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockTokenResponse)
            };
            
            (fetchClient as jest.Mock).mockResolvedValue(mockResponse);
            
            // Spy on console.log to verify debug output
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await exchangeCodeForToken(
                'https://example.com/',
                'test-client-id',
                'test-code',
                true
            );
            
            expect(consoleLogSpy).toHaveBeenCalled();
            
            consoleLogSpy.mockRestore();
        });
    });

    describe('getNtlmMessageType', () => {
        test('should identify Type 1 NTLM message', () => {
            const buffer = Buffer.from([
                0x4E, 0x54, 0x4C, 0x4D, 0x53, 0x53, 0x50, 0x00, 
                0x01, 0x00, 0x00, 0x00, 
                0x00, 0x00, 0x00, 0x00
            ]);
            
            const result = getNtlmMessageType(buffer);
            expect(result).toBe(1);
        });
        
        test('should identify Type 2 NTLM message', () => {
            const buffer = Buffer.from([
                0x4E, 0x54, 0x4C, 0x4D, 0x53, 0x53, 0x50, 0x00, 
                0x02, 0x00, 0x00, 0x00, 
                0x00, 0x00, 0x00, 0x00
            ]);
            
            const result = getNtlmMessageType(buffer);
            expect(result).toBe(2);
        });
        
        test('should identify Type 3 NTLM message', () => {
            const buffer = Buffer.from([
                0x4E, 0x54, 0x4C, 0x4D, 0x53, 0x53, 0x50, 0x00, 
                0x03, 0x00, 0x00, 0x00, 
                0x00, 0x00, 0x00, 0x00
            ]);
            
            const result = getNtlmMessageType(buffer);
            expect(result).toBe(3);
        });
        
        test('should return null for non-NTLM messages', () => {
            const buffer = Buffer.from([
                0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x00, 
                0x01, 0x00, 0x00, 0x00
            ]);
            
            const result = getNtlmMessageType(buffer);
            expect(result).toBeNull();
        });
    });
    
    describe('parseNtlmHeader', () => {
        test('should parse valid NTLM header', () => {
            const header = 'NTLM dGVzdA==';
            const result = parseNtlmHeader(header);
            
            expect(result).toBeInstanceOf(Buffer);
            expect(result?.toString()).toBe('test');
        });
        
        test('should return null for non-NTLM headers', () => {
            const header = 'Basic dXNlcjpwYXNz';
            const result = parseNtlmHeader(header);
            
            expect(result).toBeNull();
        });
        
        test('should handle empty NTLM token', () => {
            const header = 'NTLM ';
            const result = parseNtlmHeader(header);
            
            expect(result).toBeInstanceOf(Buffer);
            expect(result?.length).toBe(0);
        });
    });
});
