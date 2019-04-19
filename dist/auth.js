var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var storage = window.localStorage;
var ID_TOKEN_KEY = "mol-api-id-token";
/*
  API Authentication service for given environment
*/
var APIAuth = /** @class */ (function () {
    function APIAuth(_a) {
        var url = _a.url;
        this.url = url;
        if (this.extractAdminIdTokenFromHashFragment()) {
            console.debug("admin id token has been extracted from hash fragment");
        }
    }
    /*
      common:
      save/load/clear authorization token
      token can be either user id token (firebase) or admin id token (google OAuth2)
    */
    APIAuth.prototype.saveIdToken = function (token) {
        storage.setItem(ID_TOKEN_KEY, token);
    };
    APIAuth.prototype.loadIdToken = function () {
        return storage.getItem(ID_TOKEN_KEY);
    };
    APIAuth.prototype.clearTokens = function () {
        storage.removeItem(ID_TOKEN_KEY);
    };
    /*
    admin authentication:
    redirect to admin OAuth2 login page after login, will be redirected to current URL with hash "#id_token=XXX"
    */
    APIAuth.prototype.requestAdminIdToken = function () {
        window.location.assign(this.url + "/admin/oauth2/authorize");
    };
    /*
      admin authentication:
      load token from hash fragment of OAuth2 login redirection
      should run this function in entry script sequence to read and store token right after redirected from OAuth2 callback
    */
    APIAuth.prototype.extractAdminIdTokenFromHashFragment = function () {
        var tokenFragmentPrefix = "#id_token=";
        var extracted = false;
        if (location.hash.startsWith(tokenFragmentPrefix)) {
            this.saveIdToken(location.hash.substr(tokenFragmentPrefix.length));
            location.hash = "";
            extracted = true;
        }
        return extracted;
    };
    /*
    admin authentication:
    check whether current id token is valid admin id token or not.
   */
    APIAuth.prototype.verifyAdminIdToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = this.loadIdToken();
                if (!token)
                    return [2 /*return*/, null];
                return [2 /*return*/, fetch(this.url + "/admin/me", {
                        headers: {
                            Authorization: "Bearer " + token,
                        },
                    })
                        .then(function (res) {
                        if (res.ok) {
                            return res.json()
                                .then(function (admin) {
                                console.debug("admin authenticated", admin);
                                return admin;
                            });
                        }
                        return res.json()
                            .then(function (error) {
                            console.error("admin authentication failed", error);
                            return null;
                        })
                            .catch(function () {
                            console.error("admin authentication failed", res);
                            return null;
                        });
                    })
                        .catch(function (err) {
                        console.error("admin authentication request failed", err);
                        return null;
                    })];
            });
        });
    };
    return APIAuth;
}());
export { APIAuth };
