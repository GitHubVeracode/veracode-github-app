const logger = require('../src/utils/logging')
const { push } = require('./handlers/push');
const { pull } = require('./handlers/pull');
const { created } = require('./handlers/installation');
const { completedRun } = require('../src/handlers/workflow-run')
const { handleRegister } = require('./services/register');

module.exports = async (app, { getRouter }) => {
    //This event occurs when there is activity relating to a GitHub App installation.
    //All GitHub Apps receive this event by default. We dont need to manually subscribe to this event.
    app.on('installation.created', async context => {
        logger.info('Installation created event triggered');
        created(context);
    });

    app.on('push', async context => {
        logger.info('Push event triggered');
        push(context);
    });

    app.on('pull_request', async context => {
        logger.info('Pull event triggered');
        pull(context);
    });

    app.on('workflow_run.completed', async context => {
        logger.info('Workflow run completed event triggered');
        completedRun(context);
    });

    const router = getRouter();
    router.get('/register', (req, res) => {
        logger.info('Handling register route');
        handleRegister(req, res, { app });
    });

    router.get('/health-check', (req, res) => {
        logger.info('Handling health-check route');
        return res.status(200).send('Hello World');
    });
};  