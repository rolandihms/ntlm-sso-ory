import {
    getNtlmChallenge,
    getOAuthChallenge,
    processLogin,
    exchangeCodeForToken,
} from "../src/utils";
import {
    ntlm_type_1_header,
    ntlm_type_2_header,
    ntlm_type_3_header,
    oauth_challenge_response,
    login_response,
    exchange_code_for_token_response,
} from "./mock";
import fetchMock from "jest-fetch-mock";

// Mock the fetch client module
jest.mock("../src/fetch-client", () => {
    return {
        __esModule: true,
        default: fetch
    };
});

describe("NTLM SSO Utility Functions", () => {
    beforeEach(() => {
        fetchMock.resetMocks();
        process.env.CLIENT_ID = "test-client";
        process.env.ISSUER_URL = "http://test-issuer/";
    });

    test("getNtlmChallenge should return Type 2 message", async () => {
        // Use mockImplementationOnce to bypass header validation
        fetchMock.mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                headers: {
                    get: (name: string) => name.toLowerCase() === 'www-authenticate' ? ntlm_type_2_header : null
                }
            } as Response)
        );

        const challenge = await getNtlmChallenge(ntlm_type_1_header, "http://test-issuer/");
        expect(challenge).toBe(ntlm_type_2_header);
        expect(fetchMock).toHaveBeenCalledWith(
            "http://test-issuer/sso/challenge",
            expect.objectContaining({
                headers: {Authorization: ntlm_type_1_header},
            })
        );
    });

    test("getOAuthChallenge should return challenge", async () => {
        fetchMock.mockResponseOnce(JSON.stringify(oauth_challenge_response));

        const challenge = await getOAuthChallenge("http://test-issuer/", "test-client");
        expect(challenge).toEqual(oauth_challenge_response);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining(
                "http://test-issuer/auth?response_type=code&client_id=test-client"
            ),
            expect.any(Object)
        );
    });

    test("processLogin should handle NTLM token and challenge", async () => {
        fetchMock.mockResponseOnce(JSON.stringify(login_response));

        const response = await processLogin(
            "http://test-issuer/",
            oauth_challenge_response.challenge,
            ntlm_type_3_header
        );
        expect(response).toEqual(login_response);
        expect(fetchMock).toHaveBeenCalledWith(
            "http://test-issuer/login",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    challenge: oauth_challenge_response.challenge,
                    ssoToken: ntlm_type_3_header,
                }),
            })
        );
    });

    test("exchangeCodeForToken should return access token", async () => {
        fetchMock.mockResponseOnce(
            JSON.stringify(exchange_code_for_token_response)
        );

        const response = await exchangeCodeForToken(
            "http://test-issuer/", 
            "test-client", 
            login_response.code
        );
        expect(response).toEqual(exchange_code_for_token_response);
        expect(fetchMock).toHaveBeenCalledWith(
            "http://test-issuer/token",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    });
});
