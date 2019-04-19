export declare class APIAuth {
    url: string;
    saveIdToken(token: string): void;
    loadIdToken(): string | null;
    clearTokens(): void;
    requestAdminIdToken(): void;
    extractAdminIdTokenFromHashFragment(): boolean;
    verifyAdminIdToken(): Promise<IAMAdmin | null>;
    constructor({ url }: Pick<APIAuth, "url">);
}
export declare type IAMAdmin = {
    id: string;
    email: string;
    name: string;
    photoURL: string;
};
