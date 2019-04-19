var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { ApolloClient } from "apollo-client";
import { RetryLink } from "apollo-link-retry";
import { onError } from "apollo-link-error";
import { setContext } from "apollo-link-context";
import { InMemoryCache, IntrospectionFragmentMatcher } from "apollo-cache-inmemory";
import { split, from } from "apollo-link";
import { createUploadLink } from "apollo-upload-client";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { APIEnvironmentMap } from "./env";
/* option preset for admin application */
export var createApolloClientAdminAppPresetOption = {
    onForbidden: function (response, env) {
        console.error(response, "redirect to OAuth2 sign in page...");
        env.auth.requestAdminIdToken();
    }
};
export function createApolloClientsForAllEnvironments(opt) {
    return Object.keys(APIEnvironmentMap)
        .reduce(function (clients, envKey) {
        clients[envKey] = createApolloClientForEnvironment(APIEnvironmentMap[envKey], opt);
        return clients;
    }, {});
}
/*
  create a single apollo client for given API environment
  supports:
  - authentication
  - retry on network failure
  - subscription (websocket)
  - multipart/form-data upload
  - cache fragment matcher: ref. https://www.apollographql.com/docs/react/advanced/fragments#fragment-matcher
*/
export function createApolloClientForEnvironment(env, opt) {
    var uri = env.url + "/graphql";
    var httpLink = from([
        // set authorization header
        setContext(function (operation, context) {
            var token = env.auth.loadIdToken();
            return token ? { headers: __assign({}, context.headers, { authorization: "Bearer " + token }) } : {};
        }),
        // recover from network error
        new RetryLink({
            delay: {
                initial: 100,
                max: Infinity,
                jitter: true,
            },
            attempts: {
                max: 3,
                retryIf: function (error, operation) {
                    var statusCode = error && error.response && error.response.status || null;
                    return statusCode === null || statusCode >= 500;
                },
            },
        }),
        // recover from logical error
        onError(function (errorResponse) {
            var graphQLErrors = errorResponse.graphQLErrors, networkError = errorResponse.networkError, operation = errorResponse.operation, forward = errorResponse.forward;
            if (graphQLErrors) {
                for (var _i = 0, graphQLErrors_1 = graphQLErrors; _i < graphQLErrors_1.length; _i++) {
                    var err = graphQLErrors_1[_i];
                    switch (err.extensions.code) {
                        case "FORBIDDEN":
                            return opt.onForbidden(errorResponse, env);
                        default:
                            console.error(err);
                    }
                }
            }
            if (networkError) {
                // @ts-ignore
                if (networkError.statusCode && networkError.statusCode == 401) {
                    return opt.onForbidden(errorResponse, env);
                }
                console.error(networkError);
            }
        }),
        // base network interface
        createUploadLink({
            uri: uri,
        }),
    ]);
    // to support websocket (subscription)
    var wsLink = new WebSocketLink({
        uri: uri.replace("http", "ws"),
        options: {
            reconnect: true,
            lazy: true,
            connectionParams: function () {
                var token = env.auth.loadIdToken();
                return token ? { authorization: "Bearer " + token } : {};
            },
        }
    });
    var link = split(
    // split based on operation type
    function (_a) {
        var query = _a.query;
        var _b = getMainDefinition(query), kind = _b.kind, operation = _b.operation;
        return kind === "OperationDefinition" && operation === "subscription";
    }, wsLink, httpLink);
    var client = new ApolloClient({
        link: link,
        queryDeduplication: true,
        ssrMode: false,
        cache: new InMemoryCache({
            addTypename: true,
        }),
    });
    // asynchronously load schema from server and update cache to fragment matcher ready cache
    client.initCacheFragmentMatcher = function () { return new Promise(function (resolve, reject) {
        fetch(uri, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                variables: {},
                query: "\n      {\n        __schema {\n          types {\n            kind\n            name\n            possibleTypes {\n              name\n            }\n          }\n        }\n      }\n    ",
            }),
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
            // here we're filtering out any type information unrelated to unions or interfaces
            result.data.__schema.types = result.data.__schema.types.filter(function (type) { return type.possibleTypes !== null; });
            var introspectionQueryResultData = result.data;
            client.cache = new InMemoryCache({
                addTypename: true,
                fragmentMatcher: new IntrospectionFragmentMatcher(introspectionQueryResultData),
            });
            // now all done, override init method to prevent multiple initialization
            client.initCacheFragmentMatcher = function () { return Promise.resolve(); };
            resolve();
        })
            .catch(function (error) {
            console.error("cannot make introspectionQueryResultData from GraphQL server: " + uri, error);
            reject(error);
        });
    }); };
    return client;
}
