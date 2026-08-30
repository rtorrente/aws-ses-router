/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: ["main", { name: "develop", prerelease: "alpha" }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/exec", { prepareCmd: "pnpm build:lambda" }],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: `chore(release): \${nextRelease.version} [skip ci]\n\n\${nextRelease.notes}`,
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          {
            path: "dist/lambda/lambda.zip",
            label: "Lambda ZIP (lambda.zip)",
          },
        ],
      },
    ],
  ],
};
