const { Probot, ProbotOctokit, Context } = require("probot");
const pushPayload = require("./fixtures/push");
const createPayload = require("./fixtures/installation.created");
const veracodeConfig = require("./fixtures/veracodeConfig.json")
const fs = require("fs");
const path = require("path");
const { push } = require('../src/handlers/push');
const { handleRegister } = require("../src/services/register");
const privateKey = "privateKey";
const appConfig = require('../src/app-config');
const { getVeracodeConfigFromRepo } = require("../src/utils/util")

describe("Push handler", () => {
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
    event = pushPayload;
    context = new Context(event, {}, {});
    contextT = new Context(createPayload, {}, {});

    context.octokit.apps = {
      getWebhookConfigForApp: jest.fn().mockImplementation(async () => ({
        data: { url: callback_url }
      })),
      createInstallationAccessToken: jest.fn().mockImplementation(async () => ({ data: { token } }))

    };

    context.octokit.repos = {
      createDispatchEvent: jest.fn().mockImplementation(async () => { }),
      getContent: jest.fn().mockImplementation(async () => (veracodeConfig))
    };

    contextT.octokit = {
      request: jest.fn().mockImplementation(async () => ({ status: 202 }))
    };
  })

  describe('createInstallationAccessToken logic', () => {
    test('should createInstallationAccessToken that is scoped to push repository', async () => {
      await push(context);
      expect(context.octokit.apps.createInstallationAccessToken).toBeCalledWith({
        installation_id: event.payload.installation.id,
        repository_ids: [event.payload.repository.id]
      })
    })
  });

  describe('trigger scan for pipeline scan', () => {
    test('should call octokit createDispatchEvent correct data', async () => {
      await push(context);
      const data = {
        owner: context.payload.repository.owner.login,
        repo: "veracode",
        event_type: "source-code-pipeline-scan",
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
          branch: "master",
          event: event.payload,
          event_type: "veracode-sast-pipeline-scan"
        }
      }
      expect(context.octokit.repos.createDispatchEvent).toBeCalledWith(data)
    })
  });

  describe('should not run the scan', () => {
    beforeEach(async () => {
      pushPayload.payload.ref = "add-veracode-config";
      context = new Context(pushPayload, {}, {});
    });
    test('should not run the scan', async () => {
      await push(context);
    })
  });

  describe('should not run the scan', () => {
    beforeEach(async () => {
      pushPayload.payload.repository.name = "veracode";
      context = new Context(pushPayload, {}, {});
    });
    test('should not run the scan', async () => {
      await push(context);
    })
  });
});