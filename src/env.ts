import { APIAuth } from "./auth";

// API 서버 환경
export type APIEnvironment = {
  label: string

  // api gateway endpoint
  url: string

  // api gateway authentication service
  auth: APIAuth
}

export const APIEnvironmentMap: {[key: string]: APIEnvironment} = {
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

  /*
  To debug IAM service itself for authentication problem
  Run mol-iam service locally then run the client application with blow environment
  ref: https://github.com/strix-kr/mol-iam

  iam_debug: {
    label: "IAM debugging (latest)",
    url: "https://gw.latest.strix.co.kr",
    auth: new APIAuth({ url: "https://gw.latest.strix.co.kr" }),
  },
  */
};
