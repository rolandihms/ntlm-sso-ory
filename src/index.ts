import type {NtlmAuthConfig, NtlmAuthResult} from "./types";
import {
    getNtlmChallenge,
    getOAuthChallenge,
    processLogin,
    exchangeCodeForToken,
    getNtlmMessageType,
    parseNtlmHeader,
} from "./utils";
import { createRequestFetchClient } from "./fetch-client";

export * from "./types";

export async function handleNtlmAuth(
    headers: Record<string, string>,
    config: NtlmAuthConfig
): Promise<NtlmAuthResult> {
    // Create a new fetch client with a fresh cookie jar for this request lifecycle
    const { fetchWithCookies, cleanupCookieJar } = createRequestFetchClient();
    
    try {
        // Check if Authorization header is present
        if (!headers.authorization) {
            return {
                status: "challenge",
                headers: {
                    "WWW-Authenticate": "NTLM",
                },
            };
        }

        // Validate the authorization header format
        if (!headers.authorization.startsWith("NTLM ")) {
            return {
                status: "error",
                error: "Invalid authorization header",
            };
        }

        const ntlmBuffer = parseNtlmHeader(headers.authorization.toString());
        if (!ntlmBuffer) {
            return {
                status: "error",
                error: "Invalid NTLM message",
            };
        }
        const type = getNtlmMessageType(ntlmBuffer);
       
        if (type === 1) {
            // Process NTLM Type 1/3 message
            const ntlmType2 = await getNtlmChallenge(
                headers.authorization,
                config.issuerUrl,
                config.debug,
                fetchWithCookies
            );

            //Ensure a valid response is received form the Challenge Endpoint
            if (!ntlmType2.success) {
                throw new Error(
                    "Invalid challenge response:" + ntlmType2.error
                );
            }
            // If we got a Type 2 message back, it was a Type 1 message
            if (ntlmType2.success && ntlmType2.header) {
                return {
                    status: "challenge",
                    headers: {
                        "WWW-Authenticate": ntlmType2.header
                            ? ntlmType2.header?.toString()
                            : "",
                    },
                };
            }
        }

        // If we didn't get a Type 2 message, it was likely a Type 3 message
        // Process OAuth flow
        try {
            const oauthChallenge = await getOAuthChallenge(
                config.issuerUrl,
                config.clientId,
                config.debug,
                fetchWithCookies
            );

            if (!oauthChallenge || !oauthChallenge.challenge) {
                throw new Error("Invalid OAuth challenge response");
            }

            const loginResponse = await processLogin(
                config.issuerUrl,
                oauthChallenge.challenge,
                headers.authorization,
                config.debug,
                fetchWithCookies
            );

            if (!loginResponse || !loginResponse.code) {
                throw new Error("Invalid login response");
            }

            const tokenResponse = await exchangeCodeForToken(
                config.issuerUrl,
                config.clientId,
                loginResponse.code,
                config.debug,
                fetchWithCookies
            );

            if (!tokenResponse || !tokenResponse.access_token) {
                throw new Error("Invalid token response");
            }

            return {
                status: "success",
                token: tokenResponse.access_token,
            };
        } catch (innerError) {
            return {
                status: "error",
                error:
                    innerError instanceof Error
                        ? innerError.message
                        : "Error in OAuth flow",
            };
        }
    } catch (error) {
        return {
            status: "error",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    } finally {
        // Clean up the cookie jar to ensure cookies don't persist between request lifecycles
        await cleanupCookieJar();
    }
}
