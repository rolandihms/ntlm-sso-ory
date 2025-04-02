

// Change it to
import makeFetchCookie from "fetch-cookie";
import 'dotenv/config'

const cookieJar = new makeFetchCookie.toughCookie.CookieJar();
const fetchCookie = makeFetchCookie(fetch, cookieJar);

if(!process.env.CLIENT_ID){
    throw new Error("No Client ID defined");
}
if(!process.env.ISSUER_URL){
    throw new Error("No Issuer URL defined");
}
const client_id = process.env.CLIENT_ID;
const issuer_url = process.env.ISSUER_URL;
export const get_ntlm_challenge = async function (authHeader) {
    const response = await fetchCookie(`${issuer_url}sso/challenge`, {
        method: "GET",
        headers: {
            "Authorization": authHeader
        }
    });
    const json = await response.text();
    console.log("++++++++++++++++ NTLM CHALLENGE+++++++++++++++++++")
    console.log(response.headers.get('www-authenticate'))
    console.log("++++++++++++++++ NTLM CHALLENGE+++++++++++++++++++")
    return response.headers.get('www-authenticate');
}


export const get_oauth_challenge = async function () {

    const uuid = crypto.randomUUID();
    const response = await fetchCookie(`${issuer_url}auth?response_type=code&client_id=${client_id}&state=${uuid}`, {
        method: "GET"
    });
    const json = await response.json();
    console.log("++++++++++++++++ OAUTH CHALLENGE+++++++++++++++++++")
    console.log(json)
    console.log("++++++++++++++++ //OAUTH CHALLENGE+++++++++++++++++++")
    return json;
}


export const process_login = async function (challenge, ntlmToken) {
    // console.log("+++++++++++++++++++++++++++++++++ LOIN PROCESS +++++++++++++")
    // console.log(challenge)
    // console.log("---------------------------------")
    // console.log(ntlmToken)
    // console.log("+++++++++++++++++++++++++++++++++ LOGIN PROCESS +++++++++++++")
    const response = await fetchCookie(`${issuer_url}login`, {
        method: "POST",
        // headers: {
        //     "Authorization": ntlmToken
        // },
        body: JSON.stringify({
            "challenge": challenge,
            "ssoToken": ntlmToken
        }),
        //redirect: "manual"
    });
    console.log("LOGIN RESPONSE")
    console.log(response)
    const json = await response.json();
    console.log("++++++++++++++++ LOGIN +++++++++++++++++++")
    console.log(json)
    console.log("++++++++++++++++ LOGIN +++++++++++++++++++")
    return json;
}



export const exchange_code_for_token = async function (code) {
    console.log("+++++++++++++++++++++++++++++++++ CODE +++++++++++++")
    console.log(code)
    console.log("---------------------------------")
    // console.log(ntlmToken)
    // console.log("+++++++++++++++++++++++++++++++++ LOGIN PROCESS +++++++++++++")
    const response = await fetchCookie(`${issuer_url}token`, {
        method: "POST",
        // headers: {
        //     "Authorization": ntlmToken
        // },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            "grant_type": "authorization_code",
            "client_id": client_id,
            "code": code
        })
        //redirect: "manual"
    });
    console.log("Xchange code 4 token")
    console.log(response)
    const json = await response.json();
    console.log("++++++++++++++++ EXCHANGE CODE 4 TOKEN +++++++++++++++++++")
    console.log(json)
    console.log("++++++++++++++++ EXCHANGE CODE 4 TOKEN +++++++++++++++++++")
    return json;
}
