module.exports = appConfig;

function appConfig() {
  return {
    // the app name appears in the list of pull request checks. We make it
    // configurable so we can deploy multiple versions that can be used side-by-side
    name: process.env.APP_NAME || "Veracode Probot App",
    configFileName: ".veracode.yml",
    defaultOrganisationRepository: process.env.DEFAULT_ORGANISATION_REPOSITORY ?? 'veracode',
    veracodeOrganisationAccount: process.env.VERACODE_ORGANISATION_ACCOUNT ?? "GitHubVeracode",
    prBranch: process.env.PR_BRANCH ?? 'add-veracode-config',
    appUrl: process.env.APP_URL ?? 'https://49c5-2401-4900-1c8f-1fa3-6cf1-90db-4871-f365.ngrok.io',
    veracodeConfigFile: process.env.VERACODE_CONFIG_FILE ?? 'veracode.yml',
    cosmodbUri: process.env.COSMOSDB_URI ?? 'mongodb://localhost:27017',
    dbName: process.env.DB_NAME ?? 'veracode-github-app',
    githubHost: process.env.GITHUB_HOST ?? 'https://github.com',
    gitHubApiVersion: process.env.GITHUB_API_VERSION ?? '2022-11-28'
  };
}