import type { OAuthChallenge, LoginResponse, TokenResponse } from './types';
import fetchClient from './fetch-client';

export async function getNtlmChallenge(authHeader: string, issuerUrl: string): Promise<string | null> {
    const response = await fetchClient(`${issuerUrl}sso/challenge`, {
        method: "GET",
        headers: {
            "Authorization": authHeader
        }
    });

    const authHeaderValue = response.headers.get('www-authenticate');
    if (authHeaderValue && !authHeaderValue.startsWith('NTLM')) {
        return null;
    }

    return authHeaderValue;
}

export async function getOAuthChallenge(issuerUrl: string, clientId: string): Promise<OAuthChallenge> {
    const uuid = crypto.randomUUID();
    const response = await fetchClient(`${issuerUrl}auth?response_type=code&client_id=${clientId}&state=${uuid}`, {
        method: "GET"
    });
    return response.json();
}

export async function processLogin(issuerUrl: string, challenge: string, ntlmToken: string): Promise<LoginResponse> {
    const response = await fetchClient(`${issuerUrl}login`, {
        method: "POST",
        body: JSON.stringify({
            challenge,
            ssoToken: ntlmToken
        })
    });

    if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
    }

    return response.json();
}

export async function exchangeCodeForToken(issuerUrl: string, clientId: string, code: string): Promise<TokenResponse> {
    const response = await fetchClient(`${issuerUrl}token`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            code: code
        })
    });

    if (!response.ok) {
        throw new Error(`Token exchange failed with status ${response.status}`);
    }

    return response.json();
}
