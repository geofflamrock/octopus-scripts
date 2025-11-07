interface GitHubAppConfig {
    appId: string;
    privateKey: string;
    clientId: string;
    clientSecret: string;
    installationId: string;
}
declare function createInstallationAccessToken(config: GitHubAppConfig): Promise<string>;
export { createInstallationAccessToken, GitHubAppConfig };
