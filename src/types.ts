export interface NtlmAuthConfig {
    clientId: string;
    issuerUrl: string;
    debug?: boolean;
}

export interface NtlmAuthResult {
    status: 'challenge' | 'success' | 'error';
    headers?: Record<string, string>;
    token?: string;
    error?: string;
}

export interface OAuthChallenge {
    challenge: string;
}

export interface LoginResponse {
    code: string;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}
