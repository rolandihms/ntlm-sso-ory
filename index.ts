import * as express from "express";
import {
    getNtlmChallenge,
    exchangeCodeForToken,
    getOAuthChallenge,
    processLogin,
} from "./src/utils";
const app = express();
const port = 3000;

app.use(async function (req, res, next) {
    let count = 0;

    // Check if Authorization header is present
    if (!req.headers.authorization) {
        console.log(
            "11111 Gonna redirect with 401 and WWW-Authenticate=NTLM header ",
            count
        );
        count++;
        res.header("WWW-Authenticate", "NTLM");
        res.status(401).send();
        return;
    }

    // Process NTLM Type 1 message
    if (req.headers.authorization.startsWith("NTLM ")) {
        console.log(
            "++++++++++++++++++++++ HAS Auth header ++++++++++++++",
            count
        );
        console.log("NTLM Type 1:", req.headers.authorization);
        const ntlmType2 = await get_ntlm_challenge(req.headers.authorization);

        if (ntlmType2) {
            count++;
            res.header("WWW-Authenticate", ntlmType2);
            res.status(401).send();
            return;
        }
    }

    // Process NTLM Type 3 message
    if (req.headers.authorization.startsWith("NTLM ")) {
        console.log("NTLM Type 3:", req.headers.authorization);
        const ntlmType3 = req.headers.authorization;

        //Obtain OUATh login challenge
        const oauthChallenge = await get_oauth_challenge();

        const loginRes = await process_login(
            oauthChallenge.challenge,
            ntlmType3
        );
        console.log("LoginRes:", loginRes);
        const token = await exchange_code_for_token(loginRes.code);

        // const isAuthenticated = await utils.verify_ntlm_response(ntlmType3);

        // if (isAuthenticated) {
        //     console.log("User authenticated successfully");
        //     next();
        //     return;
        // } else {
        //     res.status(401).send("Authentication failed");
        //     return;
        // }
    }

    console.log("BEFORE NEXT ++++++++++++++++++++++++++");
    next();
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
