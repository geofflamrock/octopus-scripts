interface GitHubAppConfig {
    appId: string;
    privateKey: string;
    clientId: string;
    clientSecret: string;
    repositoryOwner: string;
    repositoryName: string;
}
declare function createInstallationAccessToken(config: GitHubAppConfig): Promise<string>;
export { createInstallationAccessToken, GitHubAppConfig };
