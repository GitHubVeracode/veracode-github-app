const appConfig = require("../app-config");
const db = require("../db/mongo-client");
const Register = require('../models/register.model');
const logger = require('../utils/logging')

async function handleRegister(req, res, { app }) {
  logger.info(`req.query, ${req?.query}`)
  const {
    run_id,
    name,
    sha,
    branch,
    enforce,
    enforce_admin,
    repository_owner,
    repository_name,
    event_type
  } = req.query

  const data = {
    owner: repository_owner,
    repo: repository_name,
    head_sha: sha,
    name: name,
    details_url: `${appConfig().githubHost}/${repository_owner}/${appConfig().defaultOrganisationRepository}/actions/runs/${run_id}`,
    status: 'in_progress'
  }

  let octokit = await app.auth();
  const installation = await octokit.apps.getRepoInstallation({
    owner: repository_owner,
    repo: repository_name
  })
  octokit = await app.auth(installation.data.id)

  const checks_run = await octokit.checks.create(data);

  const reqObj = {
    run_id: run_id,
    branch: branch,
    repository_owner: repository_owner,
    repository_name: repository_name,
    check_run_type: event_type,
    check_run_id: checks_run.data.id
  }

  await db.connectDB();
  const run = new Register(reqObj);
  try {
    await run.save().then((result) => {
      logger.debug(`workflow details saved`, result)
      return res.send(result)
    })
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ err: 'MongoError' })
  }
}

module.exports = {
  handleRegister
}