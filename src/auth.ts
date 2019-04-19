const storage = window.localStorage;
const ID_TOKEN_KEY = "mol-api-id-token";


/*
  API Authentication service for given environment
*/

export class APIAuth {
  /* API gateway endpoint for authentication */
  url: string;

  /*
    common:
    save/load/clear authorization token
    token can be either user id token (firebase) or admin id token (google OAuth2)
  */
  saveIdToken(token: string): void {
    storage.setItem(ID_TOKEN_KEY, token);
  }

  loadIdToken(): string|null {
    return storage.getItem(ID_TOKEN_KEY);
  }

  clearTokens(): void {
    storage.removeItem(ID_TOKEN_KEY);
  }

  /*
  admin authentication:
  redirect to admin OAuth2 login page after login, will be redirected to current URL with hash "#id_token=XXX"
  */
  requestAdminIdToken(): void {
    window.location.assign(`${this.url}/admin/oauth2/authorize`);
  }

  /*
    admin authentication:
    load token from hash fragment of OAuth2 login redirection
    should run this function in entry script sequence to read and store token right after redirected from OAuth2 callback
  */
  extractAdminIdTokenFromHashFragment(): boolean {
    const tokenFragmentPrefix = "#id_token=";
    let extracted = false;
    if (location.hash.startsWith(tokenFragmentPrefix)) {
      this.saveIdToken(location.hash.substr(tokenFragmentPrefix.length));
      location.hash = "";
      extracted = true;
    }
    return extracted;
  }

  /*
  admin authentication:
  check whether current id token is valid admin id token or not.
 */
  async verifyAdminIdToken(): Promise<IAMAdmin | null> {
    const token = this.loadIdToken();
    if (!token) return null;

    return fetch(`${this.url}/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.ok) {
          return res.json()
            .then(admin => {
              console.debug("admin authenticated", admin);
              return admin as IAMAdmin;
            });
        }
        return res.json()
          .then(error => {
            console.error("admin authentication failed", error);
            return null;
          })
          .catch(() => {
            console.error("admin authentication failed", res);
            return null;
          })
      })
      .catch(err => {
        console.error("admin authentication request failed", err);
        return null;
      });
  }

  constructor({ url }: Pick<APIAuth, "url">) {
    this.url = url;

    if (this.extractAdminIdTokenFromHashFragment()) {
      console.debug("admin id token has been extracted from hash fragment");
    }
  }
}


export type IAMAdmin = {
  id: string
  email: string
  name: string
  photoURL: string
};
