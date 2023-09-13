const appConfig = require('../app-config');
const logger = require('../utils/logging');

async function created(context) {
    const octokit = context.octokit;
    const user_account_name = context.payload.installation.account.login;
    logger.info(`App installed successfully on ${user_account_name}`);
    //Repository details which needs to be cloned
    const owner = appConfig().veracodeOrganisationAccount;
    const repo = appConfig().defaultOrganisationRepository;
    logger.info(`Cloning ${repo} from ${owner} under ${user_account_name} Github account.`);
    const url = `POST /repos/${owner}/${repo}/forks`;
    try {
        const body = {
            owner: user_account_name,
            repo: repo,
            organization: user_account_name,
            name: repo,
            default_branch_only: true,
            headers: {
                'X-GitHub-Api-Version': appConfig().gitHubApiVersion
            }
        };
        const response = await octokit.request(url, body);
        if (response && response.status == 202) {
            logger.info(`${repo} repository forked successfully on ${user_account_name} account`);
        }
    } catch (error) {
        if (error.status == 403) {
            logger.error(`${repo} repository already exists on ${user_account_name} account`);
        } else {
            logger.error("Error while cloning the repo : ", error);
        }
    }
};

module.exports = {
    created
};