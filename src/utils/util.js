const fs = require('fs').promises;
const logger = require("../utils/logging")
const appConfig = require('../app-config');

async function getVeracodeConfigFromRepo(octokit, owner, repository) {
  let veracodeConfig;
  try {
    logger.info(`Getting veracode config for owner: ${owner}, repository: ${repository}`);
    veracodeConfig = await octokit.repos.getContent({
      owner,
      repo: repository,
      path: appConfig().veracodeConfigFile,
    });
  } catch (error) {
    logger.error(`Error while reading veracode config file : ${error}`)
    return null;
  }

  return veracodeConfig;
}

function shouldRunForRepository(repositoryName, exclude) {
  const excludeMatch = exclude.some((repository) => {
    const regex = new RegExp('^' + repository.replace(/\*/g, '.*') + '$');
    return regex.test(repositoryName);
  });
  return !excludeMatch;
}

function shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch) {
  const trigger = veracodeScanConfig.push.trigger ? 'push' : veracodeScanConfig.pull_request.trigger ? 'pull_request' : '';
  if (eventName !== trigger) return false;
  // replace the default_branch keyword with the actual default branch name from the config yml
  for (const eventTrigger of ['push', 'pull_request']) {
    for (const attribute of ['branches_to_run', 'branches_to_exclude', 'target_branch']) {
      const attributeValue = veracodeScanConfig?.[eventTrigger]?.[attribute];
      if (Array.isArray(attributeValue))
        for (let i = 0; i < attributeValue.length; i++)
          if (attributeValue[i] === 'default_branch')
            attributeValue[i] = defaultBranch;
    }
  }

  if (trigger === 'push') {
    return shouldRunForBranch(branch, veracodeScanConfig.push);
  }
  if (trigger === 'pull_request' && veracodeScanConfig.pull_request?.action?.includes(action)) {
    return shouldRunForTargetBranch(targetBranch, veracodeScanConfig.pull_request.target_branch);
  }

  return false;
}

// Ask user to only specify either branches_to_run or branches_to_exclude
// Entering both will only execute branches_to_run
// Leaving them both blank means this will never run
function shouldRunForBranch(branch, veracodeScanType) {
  let runForBranch = false;
  if (veracodeScanType.branches_to_run !== null) {
    runForBranch = false;
    for (const branchToRun of veracodeScanType.branches_to_run) {
      const regex = new RegExp('^' + branchToRun.replace(/\*/g, '.*') + '$');
      if (regex.test(branch)) {
        runForBranch = true;
        break;
      }
    }
  }
  else if (veracodeScanType.branches_to_exclude !== null) {
    runForBranch = true;
    for (const branchToExclude of veracodeScanType.branches_to_exclude) {
      const regex = new RegExp('^' + branchToExclude.replace(/\*/g, '.*') + '$');
      if (regex.test(branch)) {
        runForBranch = false;
        break;
      }
    }
  }
  return runForBranch;
}

function shouldRunForTargetBranch(targetBranch, pullRequestTargetBranches) {


  let shouldRunForTargetBranch = false;
  if (pullRequestTargetBranches !== null) {
    shouldRunForTargetBranch = false;
    for (const branchToRun of pullRequestTargetBranches) {
      const regex = new RegExp('^' + branchToRun.replace(/\*/g, '.*') + '$');
      if (regex.test(targetBranch)) {
        shouldRunForTargetBranch = true;
        break;
      }
    }
  }
  return shouldRunForTargetBranch;
}


// ----
async function getAutoBuildEvent(context, scanType) {
  const primaryLanguage = context.payload.repository.language;
  const owner = context.payload.repository.owner.login;
  const originalRepo = context.payload.repository.name;
  const octokit = context.octokit;
  // TODO: still need central control?
  // const veracodeJsonContent = await context.octokit.repos.getContent({
  //   owner: context.payload.repository.owner.login,
  //   repo: default_organization_repository,
  //   path: "veracode.json"
  // });

  // const base64String = veracodeJsonContent.data.content;
  // const decodedString = Buffer.from(base64String, 'base64').toString();
  // const veracode = JSON.parse(decodedString);

  // if (context.payload.repository.name in veracode) {
  //   return veracode[context.payload.repository.name].build_workflow;
  // }

  let foundByPrimary = false;
  let autoBuildEvent;

  try {
    autoBuildEvent = await getAutoBuildEventByLanguage(
      [primaryLanguage],
      octokit,
      owner,
      originalRepo,
      scanType
    );
    foundByPrimary = true;
  } catch (error) {
    logger.error(error.message);
  }

  // THE BELOW SECTION RETRIEVES ALL LANGUAGES DETECTED IN THE REPOSITORY
  // NOT TOO SURE IF WE NEED TO PACKAGE THE APPLICATION FOR ALL LANGUAGES DETECTED
  // OR JUST PACKAGE THE PRIMARY LANGUAGE
  if (!foundByPrimary) {
    try {
      const languages = await octokit.request(`GET /repos/${owner}/${originalRepo}/languages`);
      let sortedLanguages = [];
      for (const [key, value] of Object.entries(languages.data)) {
        sortedLanguages.push(key);
      }
      autoBuildEvent = await getAutoBuildEventByLanguage(
        sortedLanguages,
        octokit,
        owner,
        originalRepo,
        scanType
      );
    } catch (error) {
      // app.log.info(error.message);
      return null;
    }
  }

  return autoBuildEvent;
}

async function getAutoBuildEventByLanguage(languages, octokit, owner, originalRepo, scanType) {
  const buildInstructionPath = 'src/utils/build-instructions.json';
  const buildInstructions = JSON.parse(await fs.readFile(buildInstructionPath));
  for (idx in languages) {
    if (languages[idx] in buildInstructions)
      return await getCompilationWorkflowEvent(
        buildInstructions[languages[idx]],
        octokit,
        owner,
        originalRepo,
        scanType
      );
  }
  throw new Error('Language and Framework not Enabled for Auto Compilation.');
}

async function getCompilationWorkflowEvent(buildInstructions, octokit, owner, originalRepo, scanType) {
  let countOfBuildInstructionsFound = 0;
  let buildInstructionFound;

  for (let item in buildInstructions) {
    const buildInstruction = buildInstructions[item];
    try {
      if (buildInstruction.build_tool !== 'NA')
        await octokit.repos.getContent({
          owner,
          repo: originalRepo,
          path: buildInstruction.build_tool
        });
      buildInstructionFound = buildInstruction;
      countOfBuildInstructionsFound++;
    } catch (error) {
      logger.error(`build tool ${buildInstruction.build_tool} not found in the repository`)
    }
  }
  if (countOfBuildInstructionsFound !== 1)
    throw new Error('Found More than one Compilation in the Repository');
  return buildInstructionFound.repository_dispatch_type[scanType];
}

module.exports = {
  shouldRunForRepository,
  shouldRunScanType,
  getAutoBuildEvent,
  getVeracodeConfigFromRepo
};