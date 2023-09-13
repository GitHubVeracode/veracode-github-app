const default_organization_repository = process.env.DEFAULT_ORGANIZATION_REPOSITORY ?? 'veracode'
const veracode_config_file = process.env.VERACODE_CONFIG_FILE ?? 'veracode.yml'
const app_route = process.env.APP_ROUTE ?? '/org-workflows'
const ngrok = 'https://veracode.vincentdeng.net'
// const ngrok = 'https://80a6-165-225-114-126.au.ngrok.io'
const github_host = process.env.GITHUB_HOST ?? 'https://github.com'
const artifact_folder = process.env.ARTIFACT_FOLDER ?? '/tmp/veracode'
const dynamodb_table = process.env.DYNAMODB_TABLE ?? 'veracode-github-app'

module.exports = {
  default_organization_repository,
  veracode_config_file,
  app_route,
  ngrok,
  github_host,
  artifact_folder,
  dynamodb_table
}