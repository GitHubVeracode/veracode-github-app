const { Probot, ProbotOctokit, Context } = require("probot");
const createPayload = require("./fixtures/installation.created");
const fs = require("fs");
const path = require("path");
const { created } = require('../src/handlers/installation');


const privateKey = "privateKey";
const appConfig = require('../src/app-config');

describe("Installation handler", () => {
  let event;
  let context;
  let contextT;
  let token;
  let callback_url;
  let probot;
  const error = new Error('not connected');
  describe("Installation handler", () => {
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
      context = new Context(createPayload, {}, {});
      contextT = new Context(createPayload, {}, {});

      context.octokit = {
        request: jest.fn().mockImplementation(async () => ({ status: 202 }))
      };
    })

    test('Clone repo logic', async () => {
      await created(context);
      const owner = appConfig().veracodeOrganisationAccount;
      const repo = appConfig().defaultOrganisationRepository;
      const body = {
        owner: createPayload.payload.installation.account.login,
        repo: repo,
        organization: createPayload.payload.installation.account.login,
        name: repo,
        default_branch_only: true,
        headers: {
          'X-GitHub-Api-Version': appConfig().gitHubApiVersion
        }
      };
      const url = `POST /repos/${owner}/${repo}/forks`;
      expect(context.octokit.request).toBeCalledWith(url, body);
    });

    describe("Installation handler error", () => {
      beforeEach(async () => {

        contextT = new Context(createPayload, {}, {});

        contextT.octokit = {
          request: jest.fn().mockImplementation(() => {
            throw new Error(403);
            // new RequestError("Oops", 500);
          })
        };
      });

      test('Clone repo logic 403', async () => {
        await created(contextT);
        const owner = appConfig().veracodeOrganisationAccount;
        const repo = appConfig().defaultOrganisationRepository;
        const body = {
          owner: createPayload.payload.installation.account.login,
          repo: repo,
          organization: createPayload.payload.installation.account.login,
          name: repo,
          default_branch_only: true,
          headers: {
            'X-GitHub-Api-Version': appConfig().gitHubApiVersion
          }
        };
        const url = `POST /repos/${owner}/${repo}/forks`;
        expect(contextT.octokit.request).toBeCalledWith(url, body);
      });

    });
  });
});