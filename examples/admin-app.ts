import { APIEnvironmentMap, createApolloClientForEnvironment, createApolloClientAdminAppPresetOption } from "mol-api-client-ts";
import gql from "graphql-tag";


/*
  There are local,dev,latest (k8s dev namespace) and prod (k8s prod namespace) environment types.
  So get your current environment from somewhere
*/
const currentEnv = location.host == "myapp.strix.co.kr" ? "prod" : "dev";
const env = APIEnvironmentMap[currentEnv];


/*
  At entry script, test current user has token and is authorized.
  Be noted that Google OAuth2 ID token has exact one hour of expiry (it is forced).
*/
env.auth.verifyAdminIdToken()
  .then(async (admin) => {
    /* it will make a redirection for OAuth2 login */
    if (!admin) {
      env.auth.requestAdminIdToken();
    }


    /* here comes authorized user entry logic: app rendering or whatever */
    console.log(admin, "signed in");


    /*
      Apollo client will embed current token automatically.
      When token expired so got 401/403 response, it will automatically make a redirection to login page again.
      See the error handle logic in "createApolloClientAdminAppPresetOption".
    */
    const apolloClient = createApolloClientForEnvironment(env, createApolloClientAdminAppPresetOption);

    /*
      Advanced: if you need FragmentMatcher for accurate fragment matching on unions and interfaces.
      call "initCacheFragmentMatcher" to replace apollo cache to fragment matcher ready cache.
      ref: https://www.apollographql.com/docs/react/advanced/fragments#fragment-matcher
     */
    await apolloClient.initCacheFragmentMatcher();

    await apolloClient.query({
      query: gql`
        query {
          # Write your query or whatever
          __typename
        }
      `
    })
    .then(({ data, errors }) => {
      // ...
    })
    .catch(error => {
      // ...
    });


    /* REST api call with native fetch method */
    const token = env.auth.loadIdToken();
    await fetch(`${env.url}/file`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error(error);
      })

    // ...
  });