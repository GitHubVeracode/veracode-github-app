
const appConfig = require('../app-config');
const logger = require('../utils/logging')
const { shouldRunForRepository } = require('../utils/util');
const { getDispatchEvents, createDispatchEvent } = require('../dispatch-event-services/dispatch-events');

async function pull(context) {
    const { deleted,
        repository: { id: repoId, name: repoName, archived, full_name: repoFullName, owner: { login } },
        installation: { id: installationId }
    } = context.payload;
    const user_account_name = context.payload.organization.login;
    logger.info(`Received pull event for ${repoName} repository of the ${user_account_name} account`);

    if (deleted || archived) {
        logger.warn('Skipping processing due to deleted or archived repository');
        return;
    }

    const excludedRepositories = [appConfig().defaultOrganisationRepository];
    if (!shouldRunForRepository(repoName, excludedRepositories)) {
        logger.warn('Skipping processing due to excluded repository : ', excludedRepositories);
        return;
    }

    const branch = context.payload.pull_request.head.ref;
    if (branch === appConfig().prBranch)
        return;

    const sha = context.payload.pull_request.head.sha;

    const dispatchEvents = await getDispatchEvents(context, branch);

    const token = await context.octokit.apps.createInstallationAccessToken({
        installation_id: installationId,
        repository_ids: [repoId]
    });
    const dispatchEventData = {
        context,
        payload: {
            sha,
            branch,
            token: token.data.token,
            callback_url: `${appConfig().appUrl}/register`,
            // TODO: read veracode.yml to get profile name
            profile_name: repoFullName,
            repository: {
                owner: login,
                name: repoName,
                full_name: repoFullName,
            }
        }
    }
    const requests = dispatchEvents.map(event => createDispatchEvent(event, dispatchEventData));
    await Promise.all(requests);
};
module.exports = {
    pull
};