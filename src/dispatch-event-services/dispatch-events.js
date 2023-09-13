const fs = require('fs');
const logger = require('../utils/logging')
const yaml = require('js-yaml');
const appConfig = require('../app-config');
const { shouldRunScanType, getAutoBuildEvent, getVeracodeConfigFromRepo } = require('../utils/util');

/**
 * Read config from veracode repo
 */
async function getDispatchEvents(context, branch) {
  const octokit = context.octokit;
  const owner = context.payload.repository.owner.login;
  const originalRepo = context.payload.repository.name;
  const eventName = context.name;
  const defaultBranch = context.payload.repository.default_branch;
  const action = context.payload.action ?? 'null';
  const targetBranch = context.payload.pull_request?.base?.ref ?? null;
  const default_organization_repository = appConfig().defaultOrganisationRepository;

  //Reading the veracode.yml configuration
  // 1. get veracode.yml from original repository
  let veracodeConfigFromRepo = await getVeracodeConfigFromRepo(octokit, owner, originalRepo);
  // 2. if veracode.yml does not exist in original repository, get veracode.yml from default organization repository
  if (veracodeConfigFromRepo === null)
    veracodeConfigFromRepo = await getVeracodeConfigFromRepo(octokit, owner, default_organization_repository);

  let veracodeScanConfigs;
  if (veracodeConfigFromRepo === null) {
    try {
      const veracodeConfigFile = 'src/utils/veracode.yml';
      const fileContents = fs.readFileSync(veracodeConfigFile, 'utf8');
      veracodeScanConfigs = yaml.load(fileContents);
    } catch (error) {
      logger.error(error);
      return;
    }
  } else {
    try {
      const fileContents = Buffer.from(veracodeConfigFromRepo.data.content, 'base64').toString();
      veracodeScanConfigs = yaml.load(fileContents);
    } catch (error) {
      logger.error(error);
      return;
    }
  }

  //preparing the scan configuration 
  let dispatchEvents = [];
  const veracodeConfigKeys = Object.keys(veracodeScanConfigs);
  for (const scanType of veracodeConfigKeys) {
    logger.info(`Checking scanType: ${scanType}`);
    const flag = await shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfigs[scanType], action, targetBranch);
    if (!flag) {
      logger.warn(`no flag ${flag}`);
      continue;
    }

    const scanEventType = scanType.replaceAll(/_/g, '-');
    // for sast scan, if compile_locally is true, dispatch to local compilation workflow
    // otherwise, dispatch to default organization repository with auto build
    // for non sast scan, simply dispatch to default organization repository
    if (scanType.includes('sast')) {
      if (veracodeScanConfigs[scanType].compile_locally) {
        dispatchEvents.push({
          event_type: `veracode-local-compilation-${scanEventType}`,
          repository: originalRepo,
          event_trigger: veracodeScanConfigs[scanType].local_compilation_workflow
        });
      } else {
        dispatchEvents.push({
          event_type: scanEventType,
          repository: default_organization_repository,
          event_trigger: await getAutoBuildEvent(context, scanType)
        });
      }
    } else {
      dispatchEvents.push({
        event_type: scanEventType,
        repository: default_organization_repository,
        event_trigger: scanEventType
      });
    }
  }
  return dispatchEvents;
}

const createDispatchEvent = async function (event, dispatchEventData) {
  logger.debug("calling dispatch event service to trigger the scan");
  context = dispatchEventData.context;
  const data = {
    owner: context.payload.repository.owner.login,
    repo: event.repository,
    event_type: event.event_trigger,
    client_payload: {
      ...dispatchEventData.payload,
      event: context.payload,
      event_type: event.event_type
    }
  }
  await context.octokit.repos.createDispatchEvent(data);
}

module.exports = {
  getDispatchEvents,
  createDispatchEvent
};