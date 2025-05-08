import type {
    OAuthChallenge,
    LoginResponse,
    TokenResponse,
    ChallengeResponse,
} from "./types";
import fetchClient from "./fetch-client";

/**
 * Utility function to print colored console logs
 * @param label The label for the log
 * @param data The data to log
 * @param color The color to use (default: white)
 */
export function colorLog(
    label: string,
    data: any,
    color: string = "white"
): void {
    const colors = {
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        reset: "\x1b[0m",
    };

    const selectedColor = colors[color as keyof typeof colors] || colors.white;
    if (label && data !== undefined) {
        console.log(`${selectedColor}${label}${colors.reset}`, data);
    } else {
        console.log(`${selectedColor}${label}${colors.reset}`);
    }
}

export async function getNtlmChallenge(
    authHeader: string,
    cookie: string,
    issuerUrl: string,
    debug?: boolean,
    customFetch: typeof fetch = fetchClient
): Promise<ChallengeResponse> {
    if (debug) {
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ getNtlmChallenge"
        );
        colorLog("getNtlmChallenge URL:", `${issuerUrl}sso/challenge`, "blue");
        colorLog("getNtlmChallenge Header:", authHeader, "blue");
    }

    const response = await customFetch(`${issuerUrl}sso/challenge`, {
        method: "GET",
        headers: {
            Authorization: authHeader,
            cookie: cookie,
        },
    });

    let cookieHeader: string = "";
    if (response.headers.has("set-cookie")) {
        let tempCookieheader = response.headers.get("set-cookie") || "";
        cookieHeader = tempCookieheader;
        if (cookieHeader) {
            console.log("Custom Set-Cookie Header:", cookieHeader);
        }
    } else {
        console.log("No custom Set-Cookie header found.");
    }

    if (debug) {
        // Log cookie information if present
        if (cookieHeader) {
            colorLog("NTLM Session Cookie:", cookieHeader, "magenta");
        }
    }

    if (response.status !== 401) {
        if (debug) {
            colorLog("getNtlmChallenge Response Error:", response, "red");
        }
        return {
            success: false,
            header: null,
            status: response.status,
            error: `Error: ${response.statusText}`,
            cookie: cookieHeader,
        };
    }
    if (debug) {
        colorLog("getNtlmChallenge Response:", response, "green");
    }
    const authHeaderValue = response.headers.get("www-authenticate");
    if (authHeaderValue && !authHeaderValue.startsWith("NTLM")) {
        if (debug) {
            colorLog("No NTLM Header:", authHeaderValue, "red");
        }
        return {
            success: true,
            header: null,
            status: response.status,
            cookie: cookieHeader,
        };
    }
    if (debug) {
        colorLog("NTLM Header:", authHeaderValue, "yellow");
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ //getNtlmChallenge"
        );
    }
    return {
        success: true,
        header: authHeaderValue,
        status: response.status,
        cookie: cookieHeader,
    };
}

export async function getOAuthChallenge(
    issuerUrl: string,
    clientId: string,
    cookie: string,
    debug?: boolean,
    customFetch: typeof fetch = fetchClient
): Promise<OAuthChallenge> {
    const uuid = crypto.randomUUID();
    if (debug) {
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ getOAuthChallenge"
        );
        colorLog(
            "getOAuthChallenge URL:",
            `${issuerUrl}auth?response_type=code&client_id=${clientId}&state=${uuid}`,
            "blue"
        );
    }
    const response = await customFetch(
        `${issuerUrl}auth?response_type=code&client_id=${clientId}&state=${uuid}`,
        {
            method: "GET",
            headers:{
                cookie: cookie,
            }
        }
    );
    if (debug) {
        colorLog("getOAuthChallenge Response:", response, "green");
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++// getOAuthChallenge"
        );
    }
    return response.json();
}

export async function processLogin(
    issuerUrl: string,
    challenge: string,
    ntlmToken: string,
    cookie: string,
    debug?: boolean,
    customFetch: typeof fetch = fetchClient
): Promise<LoginResponse> {
    if (debug) {
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ processLogin"
        );
        colorLog("processLogin URL:", `${issuerUrl}login`, "blue");
        colorLog("processLogin Challenge:", challenge, "blue");
        colorLog("processLogin NTLM Token:", ntlmToken, "blue");
    }
    const response = await customFetch(`${issuerUrl}login`, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            cookie: cookie,
        },
        body: JSON.stringify({
            challenge,
            ssoToken: ntlmToken,
        }),
    });

    if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
    }
    if (debug) {
        colorLog("processLogin Response:", response, "green");
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ //processLogin"
        );
    }
    return response.json();
}

export async function exchangeCodeForToken(
    issuerUrl: string,
    clientId: string,
    code: string,
    debug?: boolean,
    customFetch: typeof fetch = fetchClient
): Promise<TokenResponse> {
    if (debug) {
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ exchangeCodeForToken"
        );
        colorLog("exchangeCodeForToken URL:", `${issuerUrl}token`, "blue");
        colorLog("exchangeCodeForToken Client ID:", clientId, "blue");
        colorLog("exchangeCodeForToken Code:", code, "blue");
    }
    const response = await customFetch(`${issuerUrl}token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            code: code,
        }),
    });
    if (debug) {
        colorLog("exchangeCodeForToken Response:", response, "green");
    }
    if (!response.ok) {
        throw new Error(`Token exchange failed with status ${response.status}`);
    }
    if (debug) {
        colorLog(
            "++++++++++++++++++++++++++++++++++++++++++++ //exchangeCodeForToken",
            "",
            "yellow"
        );
    }
    return response.json();
}

export async function getUserDetails(
    issuerUrl: string,
    accessToken: string,
    debug?: boolean,
    customFetch: typeof fetch = fetchClient
): Promise<any> {
    if (debug) {
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ getUserDetails"
        );
        colorLog("getUserDetails URL:", `${issuerUrl}me`, "blue");
    }

    const response = await customFetch(`${issuerUrl}me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        if (debug) {
            colorLog("getUserDetails Response Error:", response, "red");
        }
        throw new Error(
            `Failed to get user details: ${response.status} ${response.statusText}`
        );
    }

    if (debug) {
        colorLog("getUserDetails Response:", response, "green");
        console.log(
            "++++++++++++++++++++++++++++++++++++++++++++ //getUserDetails"
        );
    }

    return response.json();
}

export function getNtlmMessageType(buffer: Buffer | Uint8Array): number | null {
    // Check for "NTLMSSP\0" signature (ASCII)
    const signature = String.fromCharCode(...buffer.slice(0, 8));
    if (signature !== "NTLMSSP\0") {
        return null; // Not an NTLM message
    }

    // Read the message type at offset 8 (4 bytes, little-endian)
    const type =
        buffer[8] + (buffer[9] << 8) + (buffer[10] << 16) + (buffer[11] << 24);
    return type; // 1, 2, or 3
}

export function parseNtlmHeader(authorizationHeader: string): Buffer | null {
    const prefix = "NTLM ";
    if (!authorizationHeader.startsWith(prefix)) return null;

    const base64 = authorizationHeader.slice(prefix.length);
    return Buffer.from(base64, "base64");
}

export function extractCookieDetails(cookieString: string) {
    const trimmed = cookieString.trim();

    // Extract name and value
    const nameValueMatch = trimmed.match(/^([^=]+)=([^;]+)/);
    const name = nameValueMatch ? nameValueMatch[1] : null;
    const value = nameValueMatch ? nameValueMatch[2] : null;

    // Extract Max-Age value
    const maxAgeMatch = trimmed.match(/Max-Age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null;

    return {name, value, maxAge};
}
