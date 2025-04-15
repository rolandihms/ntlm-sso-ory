import type { NtlmAuthConfig, NtlmAuthResult } from "./types";
import { getNtlmChallenge, getOAuthChallenge, processLogin, exchangeCodeForToken } from "./utils";

export * from "./types";

export async function handleNtlmAuth(
    headers: Record<string, string>,
    config: NtlmAuthConfig
): Promise<NtlmAuthResult> {
    try {
        // Check if Authorization header is present
        if (!headers.authorization) {
            return {
                status: 'challenge',
                headers: {
                    'WWW-Authenticate': 'NTLM'
                }
            };
        }

        // Validate the authorization header format
        if (!headers.authorization.startsWith('NTLM ')) {
            return {
                status: 'error',
                error: 'Invalid authorization header'
            };
        }

        // Process NTLM Type 1/3 message
        const ntlmType2 = await getNtlmChallenge(headers.authorization, config.issuerUrl, config.debug);
        
        // If we got a Type 2 message back, it was a Type 1 message
        if (ntlmType2) {
            return {
                status: 'challenge',
                headers: {
                    'WWW-Authenticate': ntlmType2
                }
            };
        }
        
        // If we didn't get a Type 2 message, it was likely a Type 3 message
        // Process OAuth flow
        try {
            const oauthChallenge = await getOAuthChallenge(config.issuerUrl, config.clientId, config.debug);
            
            if (!oauthChallenge || !oauthChallenge.challenge) {
                throw new Error('Invalid OAuth challenge response');
            }
            
            const loginResponse = await processLogin(config.issuerUrl, oauthChallenge.challenge, headers.authorization, config.debug);
            
            if (!loginResponse || !loginResponse.code) {
                throw new Error('Invalid login response');
            }
            
            const tokenResponse = await exchangeCodeForToken(config.issuerUrl, config.clientId, loginResponse.code, config.debug);
            
            if (!tokenResponse || !tokenResponse.access_token) {
                throw new Error('Invalid token response');
            }

            return {
                status: 'success',
                token: tokenResponse.access_token
            };
        } catch (innerError) {
            return {
                status: 'error',
                error: innerError instanceof Error ? innerError.message : 'Error in OAuth flow'
            };
        }

    } catch (error) {
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
