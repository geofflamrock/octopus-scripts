import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInstallationAccessToken,
  GitHubAppConfig,
  parsePermissions,
} from "../src/create-installation-token";

// Mock the Octokit modules
vi.mock("@octokit/auth-app", () => ({
  createAppAuth: vi.fn(),
}));

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(),
}));

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// Valid test private key
const VALID_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDMOFekCX82Za6A
4X4hxFyA1cUfZSRcuTbQ9Zh4Y7BEHMCVvHRo4BoSLwnn4Pxy7R27g0+Hk3r5QYGe
OUKbcn0njjjREg4rqowv0pw0iwBYvn/27yryf260bGpzplfDdLiINUtYG5voz+zD
qIx6EI2VtpRPmmLtNsjnpNJoj6ccSO7PxvXkj6CmFWtfRBTwZVmcrRoduyiBi+vK
AgARDHuRvfwHjzFK8COHLfH4RCuWa0KLfNX4E3TOYEEjX818aYkmZqLJxNL6Weo1
weamCLUc1pKb8Ih884COyREOY1x4bqO6tl8N67HpXYovo06M+pkKC2D2GZv4xX8t
5IotIHirAgMBAAECggEAP/VBVWl4AuRTg5+bbh3eTqckhlGZ0sRa65SPPN0TvjE3
C24rExFkeN9sfceTqLakQi68wJwqvleKrbAHMUHo+nNrTecWswxFvVB7hWUnJaP7
1a1PyQSp+i2eJTwqbldm15nBUAXNjVtZLmniHPSEMygsSMX0R5CJ2Spgj0i2MIAD
uVwKfxvVQmOn7ghrwUz8DyFra75mXJcQJlcSRZxr0PGF5yGmZ9YYwFRvsqdajI17
NHZlxH9ichSfqJrROMybY1IX0o6Mq0xlFKwYd99x70Z52AqrH7KgZqzDwE9BcWPr
CST9GTcaoumfqXtb/tJRbGt2IKh0AX7rpgady3gKyQKBgQDmmKcbW2hku0rA18wA
SIGIAzW7PsNdAVShNIbMqkhlFNspWl+pORG9P8IX/Pke3XY3SPOlnWIRAVD+J3Zw
G2QR04Z75pKWlP6Mx39sAEgoc/YCNwtlz0PggVzdpcjiZemwL8gGAe1a+swNJfHC
pQEM4kfujHPVbbnzEPjna5BwxwKBgQDit9HQflKr5+L4ou3pdEgU2atTFROIXGoS
DZbupNu+NvkQQg05pgZBLh/hbTeaNnfyZxkYRWAYHIvtsY53dsaTsyVCwXDVQw50
R5eqR9wKnIYy19xtcnTwvxFYWfxHDSbQuxzEjt2s+um2X4E1kY+NZLS8Iv7b6MpA
YUq6o9rc/QKBgCj7+LdkB6nfn+mmcRubx2nlKCefgBmHowMD0vGNUlCk5E71QQtS
mVSJgHXDAIP72Ib68FL/Je7fzQVe/i3usFp6vexHjsY0tQlQa9VGN4z5D0BViDEQ
JYBBfb/nN00F0AMAewyWSxlgeePcWpu9t/ISRbagP/YvCl2pJpP7CjEBAoGBAMMz
FTj3qmJMEsWUMlbwQSeCidnMqbacKs9EWBE8a94IIsT2ucBKy9POzLAgguEJyJgy
YA7fnG7mFSwf1dPRtgNxGMGzH1zekVFYWqLHoBKa1YhtBmJNS5YETADP6T+beTH6
CDjL8NyAZD0bWXovy3Mno9zgHKJmecyYd+jeLxBZAoGAVGuGsfFmoyCLVpEYegSe
ib/F2SSqOBsVIr1V2Ph06rEz9K6Z0qHxvSXC5Ot+w3CtywCncPw4nvplY4io+Sr0
M2N+JKmPF8DOT1nNI0NkxJBOmAiXc8siUzmOXrpykpnaBSUAHxGy6Sdd0voJ5ykn
qEb1kG68zvtipc+XrT+LQAg=
-----END PRIVATE KEY-----`;

describe("createInstallationAccessToken", () => {
  const mockConfig: GitHubAppConfig = {
    appId: "123456",
    privateKey: VALID_PRIVATE_KEY,
    repositoryOwner: "octocat",
    repositoryName: "Hello-World",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully create an installation access token", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockInstallationToken = "ghs_mockInstallationToken456";
    const mockInstallationId = 12345;
    const mockInstallationAuth = {
      token: mockInstallationToken,
      tokenType: "installation",
      createdAt: "2024-01-01T00:00:00Z",
      expiresAt: "2024-01-01T01:00:00Z",
      permissions: {
        contents: "read",
        metadata: "read",
      },
      repositorySelection: "selected",
    };

    // Mock the createAppAuth function
    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken }) // First call for app authentication
      .mockResolvedValueOnce(mockInstallationAuth); // Second call for installation authentication

    (createAppAuth as any).mockReturnValue(mockAuth);

    // Mock Octokit instance
    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: {
        id: mockInstallationId,
        app_id: 123456,
        target_type: "Repository",
      },
    });

    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    const token = await createInstallationAccessToken(mockConfig);

    expect(token).toBe(mockInstallationToken);
    expect(createAppAuth).toHaveBeenCalledWith({
      appId: mockConfig.appId,
      privateKey: mockConfig.privateKey,
    });
    expect(mockAuth).toHaveBeenCalledTimes(2);
    expect(mockAuth).toHaveBeenNthCalledWith(1, { type: "app" });
    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      type: "installation",
      installationId: mockInstallationId,
      repositories: [mockConfig.repositoryName],
    });
    expect(mockGetRepoInstallation).toHaveBeenCalledWith({
      owner: mockConfig.repositoryOwner,
      repo: mockConfig.repositoryName,
    });
  });

  it("should throw error for invalid private key format", async () => {
    const invalidConfig = {
      ...mockConfig,
      privateKey: "invalid-key-format",
    };

    await expect(createInstallationAccessToken(invalidConfig)).rejects.toThrow(
      "Invalid private key format. Expected a PEM-formatted private key."
    );

    expect(createAppAuth).not.toHaveBeenCalled();
  });

  it("should throw error when repository installation is not found", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockAuth = vi.fn().mockResolvedValueOnce({ token: mockAppToken });
    (createAppAuth as any).mockReturnValue(mockAuth);

    // Mock Octokit to throw 404 error
    const mockGetRepoInstallation = vi
      .fn()
      .mockRejectedValue(new Error("Not Found"));
    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    await expect(createInstallationAccessToken(mockConfig)).rejects.toThrow(
      /Failed to find installation for repository octocat\/Hello-World/
    );

    expect(mockGetRepoInstallation).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "Hello-World",
    });
  });

  it("should handle different repository owners and names", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockInstallationToken = "ghs_customToken789";
    const mockInstallationId = 67890;

    const customConfig = {
      ...mockConfig,
      repositoryOwner: "testorg",
      repositoryName: "test-repo",
    };

    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken })
      .mockResolvedValueOnce({
        token: mockInstallationToken,
        tokenType: "installation",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2024-01-01T01:00:00Z",
        permissions: {},
        repositorySelection: "selected",
      });

    (createAppAuth as any).mockReturnValue(mockAuth);

    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: {
        id: mockInstallationId,
        app_id: 123456,
        target_type: "Repository",
      },
    });

    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    const token = await createInstallationAccessToken(customConfig);

    expect(token).toBe(mockInstallationToken);
    expect(mockGetRepoInstallation).toHaveBeenCalledWith({
      owner: "testorg",
      repo: "test-repo",
    });
  });

  it("should validate that private key contains BEGIN marker", async () => {
    const invalidConfig = {
      ...mockConfig,
      privateKey: "PRIVATE KEY-----\nkey content\n-----END PRIVATE KEY-----",
    };

    await expect(createInstallationAccessToken(invalidConfig)).rejects.toThrow(
      "Invalid private key format"
    );
  });

  it("should validate that private key contains PRIVATE KEY text", async () => {
    const invalidConfig = {
      ...mockConfig,
      privateKey: "-----BEGIN RSA-----\nkey content\n-----END RSA-----",
    };

    await expect(createInstallationAccessToken(invalidConfig)).rejects.toThrow(
      "Invalid private key format"
    );
  });

  it("should pass the app authentication token to Octokit", async () => {
    const mockAppToken = "ghs_appToken999";
    const mockInstallationToken = "ghs_installToken888";
    const mockInstallationId = 11111;

    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken })
      .mockResolvedValueOnce({
        token: mockInstallationToken,
        tokenType: "installation",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2024-01-01T01:00:00Z",
        permissions: {},
        repositorySelection: "selected",
      });

    (createAppAuth as any).mockReturnValue(mockAuth);

    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: { id: mockInstallationId },
    });

    let capturedAuth: string | undefined;
    (Octokit as any).mockImplementation(function (this: any, options: any) {
      capturedAuth = options.auth;
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    await createInstallationAccessToken(mockConfig);

    expect(capturedAuth).toBe(mockAppToken);
  });

  it("should restrict installation token to the specific repository", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockInstallationToken = "ghs_mockInstallationToken456";
    const mockInstallationId = 12345;

    // Mock the createAppAuth function
    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken })
      .mockResolvedValueOnce({ token: mockInstallationToken });

    (createAppAuth as any).mockReturnValue(mockAuth);

    // Mock Octokit instance
    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: {
        id: mockInstallationId,
        app_id: 123456,
        target_type: "Repository",
      },
    });

    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    await createInstallationAccessToken(mockConfig);

    // Verify that the installation token was created with repository restriction
    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      type: "installation",
      installationId: mockInstallationId,
      repositories: ["Hello-World"],
    });
  });

  it("should pass permissions to auth when provided", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockInstallationToken = "ghs_mockInstallationToken456";
    const mockInstallationId = 12345;
    const permissionsInput = "contents:write\npull_requests:read";

    const configWithPermissions = {
      ...mockConfig,
      permissions: permissionsInput,
    };

    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken })
      .mockResolvedValueOnce({
        token: mockInstallationToken,
        tokenType: "installation",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2024-01-01T01:00:00Z",
        permissions: {
          contents: "write",
          pull_requests: "read",
        },
        repositorySelection: "selected",
      });

    (createAppAuth as any).mockReturnValue(mockAuth);

    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: { id: mockInstallationId },
    });

    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    const token = await createInstallationAccessToken(configWithPermissions);

    expect(token).toBe(mockInstallationToken);
    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      type: "installation",
      installationId: mockInstallationId,
      permissions: {
        contents: "write",
        pull_requests: "read",
      },
    });
  });

  it("should not pass permissions object when permissions is undefined", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockInstallationToken = "ghs_mockInstallationToken456";
    const mockInstallationId = 12345;

    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken })
      .mockResolvedValueOnce({
        token: mockInstallationToken,
        tokenType: "installation",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2024-01-01T01:00:00Z",
        permissions: {},
        repositorySelection: "selected",
      });

    (createAppAuth as any).mockReturnValue(mockAuth);

    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: { id: mockInstallationId },
    });

    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    await createInstallationAccessToken(mockConfig);

    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      type: "installation",
      installationId: mockInstallationId,
    });
  });

  it("should handle single-line permissions", async () => {
    const mockAppToken = "ghs_mockAppToken123";
    const mockInstallationToken = "ghs_mockInstallationToken456";
    const mockInstallationId = 12345;

    const configWithSinglePermission = {
      ...mockConfig,
      permissions: "contents:write",
    };

    const mockAuth = vi
      .fn()
      .mockResolvedValueOnce({ token: mockAppToken })
      .mockResolvedValueOnce({
        token: mockInstallationToken,
        tokenType: "installation",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2024-01-01T01:00:00Z",
        permissions: {
          contents: "write",
        },
        repositorySelection: "selected",
      });

    (createAppAuth as any).mockReturnValue(mockAuth);

    const mockGetRepoInstallation = vi.fn().mockResolvedValue({
      data: { id: mockInstallationId },
    });

    (Octokit as any).mockImplementation(function (this: any) {
      this.apps = {
        getRepoInstallation: mockGetRepoInstallation,
      };
    });

    await createInstallationAccessToken(configWithSinglePermission);

    expect(mockAuth).toHaveBeenNthCalledWith(2, {
      type: "installation",
      installationId: mockInstallationId,
      permissions: {
        contents: "write",
      },
    });
  });
});

describe("parsePermissions", () => {
  it("should parse single permission correctly", () => {
    const result = parsePermissions("contents:write");
    expect(result).toEqual({ contents: "write" });
  });

  it("should parse multiple permissions correctly", () => {
    const result = parsePermissions("contents:write\npull_requests:read");
    expect(result).toEqual({
      contents: "write",
      pull_requests: "read",
    });
  });

  it("should parse multiple permissions with different levels", () => {
    const result = parsePermissions(
      "contents:write\nissues:read\npull_requests:write"
    );
    expect(result).toEqual({
      contents: "write",
      issues: "read",
      pull_requests: "write",
    });
  });

  it("should handle empty lines in permissions input", () => {
    const result = parsePermissions("contents:write\n\npull_requests:read");
    expect(result).toEqual({
      contents: "write",
      pull_requests: "read",
    });
  });

  it("should trim whitespace from permission names and levels", () => {
    const result = parsePermissions("  contents : write  \n  issues : read  ");
    expect(result).toEqual({
      contents: "write",
      issues: "read",
    });
  });

  it("should return undefined for empty string", () => {
    const result = parsePermissions("");
    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    const result = parsePermissions(undefined);
    expect(result).toBeUndefined();
  });

  it("should return undefined for string with only whitespace", () => {
    const result = parsePermissions("   \n   \n   ");
    expect(result).toBeUndefined();
  });

  it("should skip lines without colon separator", () => {
    const result = parsePermissions(
      "contents:write\ninvalid_line\nissues:read"
    );
    expect(result).toEqual({
      contents: "write",
      issues: "read",
    });
  });
});
