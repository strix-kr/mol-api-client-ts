import { ApolloClient } from "apollo-client";
import { ErrorResponse } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { Observable, FetchResult } from "apollo-link";
import { APIEnvironment } from "./env";
declare type CreateApolloClientOption = {
    onForbidden: (response: ErrorResponse, env: APIEnvironment) => Observable<FetchResult> | void;
};
export declare const createApolloClientAdminAppPresetOption: CreateApolloClientOption;
export declare type ApolloClientsForAllEnvironments = {
    [envKey: string]: ApolloClient<InMemoryCache> & {
        initCacheFragmentMatcher: () => Promise<void>;
    };
};
export declare function createApolloClientsForAllEnvironments(opt: CreateApolloClientOption): ApolloClientsForAllEnvironments;
export declare function createApolloClientForEnvironment(env: APIEnvironment, opt: CreateApolloClientOption): ApolloClient<InMemoryCache> & {
    initCacheFragmentMatcher: () => Promise<void>;
};
export {};
