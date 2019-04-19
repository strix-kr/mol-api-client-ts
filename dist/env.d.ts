import { APIAuth } from "./auth";
export declare type APIEnvironment = {
    label: string;
    url: string;
    auth: APIAuth;
};
export declare const APIEnvironmentMap: {
    [key: string]: APIEnvironment;
};
