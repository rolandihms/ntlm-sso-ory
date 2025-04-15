import type {OAuthChallenge, LoginResponse, TokenResponse} from "./types";
import fetchClient from "./fetch-client";

/**
 * Utility function to print colored console logs
 * @param label The label for the log
 * @param data The data to log
 * @param color The color to use (default: white)
 */
export function colorLog(label: string, data: any, color: string = "white"): void {
    const colors = {
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        reset: "\x1b[0m"
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
    issuerUrl: string,
    debug?: boolean
): Promise<string | null> {
    if (debug) {
        console.log("++++++++++++++++++++++++++++++++++++++++++++ getNtlmChallenge");
        colorLog("getNtlmChallenge URL:", `${issuerUrl}sso/challenge`, "blue");
        colorLog("getNtlmChallenge Header:", authHeader, "blue");
    }

    const response = await fetchClient(`${issuerUrl}sso/challenge`, {
        method: "GET",
        headers: {
            Authorization: authHeader,
        },
    });
    if (debug) {
        colorLog("getNtlmChallenge Response:", response, "green");
    }
    const authHeaderValue = response.headers.get("www-authenticate");
    if (authHeaderValue && !authHeaderValue.startsWith("NTLM")) {
        if (debug) {
            colorLog("No NTLM Header:", authHeaderValue, "red");
        }
        return null;
    }
    if (debug) {
        colorLog("NTLM Header:", authHeaderValue, "yellow");
        console.log("++++++++++++++++++++++++++++++++++++++++++++ //getNtlmChallenge");
    }
    return authHeaderValue;
}

export async function getOAuthChallenge(
    issuerUrl: string,
    clientId: string,
    debug?: boolean
): Promise<OAuthChallenge> {
    const uuid = crypto.randomUUID();
    if (debug) {
        console.log("++++++++++++++++++++++++++++++++++++++++++++ getOAuthChallenge");
        colorLog(
            "getOAuthChallenge URL:",
            `${issuerUrl}auth?response_type=code&client_id=${clientId}&state=${uuid}`,
            "blue"
        );
    }
    const response = await fetchClient(
        `${issuerUrl}auth?response_type=code&client_id=${clientId}&state=${uuid}`,
        {
            method: "GET",
        }
    );
    if (debug) {
        colorLog("getOAuthChallenge Response:", response, "green");
        console.log("++++++++++++++++++++++++++++++++++++++++++++// getOAuthChallenge");
    }
    return response.json();
}

export async function processLogin(
    issuerUrl: string,
    challenge: string,
    ntlmToken: string,
    debug?: boolean
): Promise<LoginResponse> {
    if (debug) {
        console.log("++++++++++++++++++++++++++++++++++++++++++++ processLogin");
        colorLog("processLogin URL:", `${issuerUrl}login`, "blue");
        colorLog("processLogin Challenge:", challenge, "blue");
        colorLog("processLogin NTLM Token:", ntlmToken, "blue");
    }
    const response = await fetchClient(`${issuerUrl}login`, {
        method: "POST",
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
        console.log("++++++++++++++++++++++++++++++++++++++++++++ //processLogin");
    }
    return response.json();
}

export async function exchangeCodeForToken(
    issuerUrl: string,
    clientId: string,
    code: string,
    debug?: boolean
): Promise<TokenResponse> {
    if (debug) {
        console.log("++++++++++++++++++++++++++++++++++++++++++++ exchangeCodeForToken");
        colorLog("exchangeCodeForToken URL:", `${issuerUrl}token`, "blue");
        colorLog("exchangeCodeForToken Client ID:", clientId, "blue");
        colorLog("exchangeCodeForToken Code:", code, "blue");
    }
    const response = await fetchClient(`${issuerUrl}token`, {
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
        colorLog("++++++++++++++++++++++++++++++++++++++++++++ //exchangeCodeForToken", "", "yellow");
    }
    return response.json();
}
