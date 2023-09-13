const { Probot, ProbotOctokit, Context } = require("probot");
const pullPayload = require("./fixtures/pull");
const { pull } = require('../src/handlers/pull');
const privateKey = "privateKey";
const appConfig = require('../src/app-config');

describe("pull handler", () => {
  let event;
  let context;
  let contextT;
  let config;
  let token;
  let id;
  let callback_url;
  let probot;

  beforeEach(async () => {
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    callback_url = `${appConfig().appUrl}/register`;
    token = 'secret42';
    event = pullPayload;
    context = new Context(event, {}, {});
    // contextT = new Context(createPayload, {}, {});

    context.octokit.apps = {
      getWebhookConfigForApp: jest.fn().mockImplementation(async () => ({
        data: { url: callback_url }
      })),
      createInstallationAccessToken: jest.fn().mockImplementation(async () => ({ data: { token } }))

    };

    context.octokit.repos = {
      createDispatchEvent: jest.fn().mockImplementation(async () => { })
    };

    // contextT.octokit = {
    //   request: jest.fn().mockImplementation(async () => ({ status: 202 }))
    // };
  })

  describe('createInstallationAccessToken logic', () => {
    test('should createInstallationAccessToken that is scoped to pull repository', async () => {
      await pull(context);
      expect(context.octokit.apps.createInstallationAccessToken).toBeCalledWith({
        installation_id: event.payload.installation.id,
        repository_ids: [event.payload.repository.id]
      })
    })
  });

  describe('trigger scan for pipeline scan', () => {
    test('should call octokit createDispatchEvent correct data', async () => {
      await pull(context);
      const data = {
        owner: context.payload.repository.owner.login,
        repo: "veracode",
        event_type: "veracode-sca-scan",
        client_payload: {
          sha: context.payload.after,
          token: token,
          callback_url: `${callback_url}`,
          repository: {
            full_name: context.payload.repository.full_name,
            name: context.payload.repository.name,
            owner: context.payload.repository.owner.login,
          },
          profile_name: "GitHubVeracode/example-javascript",
          branch: "testQA",
          event: event.payload,
          event_type: "veracode-sca-scan",
          sha: "a84998149c4d729af2f50d8bb9853c5c0152cba6"
        }
      }
      expect(context.octokit.repos.createDispatchEvent).toBeCalledWith(data)
    })
  });

  describe('should not run the scan', () => {
    beforeEach(async () => {
      pullPayload.payload.pull_request.head.ref = "add-veracode-config";
      context = new Context(pullPayload, {}, {});
    });
    test('should not run the scan', async () => {
      await pull(context);
    })
  });

  describe('should not run the scan', () => {
    beforeEach(async () => {
      pullPayload.payload.repository.name = "veracode";
      context = new Context(pullPayload, {}, {});
    });
    test('should not run the scan', async () => {
      await pull(context);
    })
  });
});