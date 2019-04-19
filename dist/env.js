import { APIAuth } from "./auth";
export var APIEnvironmentMap = {
    /* use prod IAM for authentication */
    prod: {
        label: "production",
        url: "https://gw.strix.co.kr",
        auth: new APIAuth({ url: "https://gw.strix.co.kr" }),
    },
    /* use dev IAM for authentication */
    dev: {
        label: "development",
        url: "https://gw.dev.strix.co.kr",
        auth: new APIAuth({ url: "https://gw.dev.strix.co.kr" }),
    },
    latest: {
        label: "development (latest)",
        url: "https://gw.latest.strix.co.kr",
        auth: new APIAuth({ url: "https://gw.dev.strix.co.kr" }),
    },
    local: {
        label: "development (local)",
        url: "http://0.0.0.0:8080",
        auth: new APIAuth({ url: "https://gw.dev.strix.co.kr" }),
    },
};
