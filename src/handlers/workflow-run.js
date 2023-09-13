const db = require('../db/mongo-client');
const Register = require('../models/register.model');
const { updateChecksForCompletedPipelineScan } = require('../services/completed-pipeline-scan');
const { updateChecksForCompletedPolicyScan } = require('../services/completed-policy-scan');
const { updateChecksForCompletedSCAScan } = require('../services/completed-sca-scan');
const logger = require('../utils/logging');

async function completedRun(context) {
  if (!context.payload.workflow_run.id) {
    logger.info('No workflow run ID found. Exiting...');
    return;
  }

  const workflow_repo_run_id = context.payload.workflow_run.id;
  let run;
  try {
    await db.connectDB();
    run = await Register.findOne({ run_id: workflow_repo_run_id });
  } catch (error) {
    logger.error(`Error while fetching run from database: ${error}`);
    return;
  }
  if (!run) {
    logger.info(`No run found for workflow run ID: ${workflow_repo_run_id}`);
    return;
  }

  if (run.check_run_type === 'veracode-sast-policy-scan')
    updateChecksForCompletedPolicyScan(run, context);
  else if (run.check_run_type === 'veracode-sast-pipeline-scan')
    updateChecksForCompletedPipelineScan(run, context);
  else if (run.check_run_type === 'veracode-sca-scan' || run.check_run_type === 'veracode-container-security-scan')
    updateChecksForCompletedSCAScan(run, context);
}

module.exports = {
  completedRun
};