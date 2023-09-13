const { Probot, ProbotOctokit, Context } = require("probot");
const { updateChecks } = require('../src/services/check-services/checks');
const privateKey = "privateKey";
const workflowCompletedPayload = require("./fixtures/workflow-completed.json");

describe("Update workflow status on workflow completed", () => {
  let context;
  let probot;
  let run = { "_id": "64d923000fa5564cbf2863ad", "run_id": 5848960062, "repository_owner": "GitHubVeracode", "repository_name": "example-javascript", "check_run_id": 15856766631, "check_run_type": "veracode-sast-pipeline-scan", "branch": "master", "__v": 0 };
  let output = { "annotations": [], "title": "Veracode Static Analysis", "summary": "<pre></pre>" };

  beforeEach(async () => {
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    context = new Context(workflowCompletedPayload, {}, {})

    context.octokit.checks = {
      update: jest.fn().mockImplementation(async () => { })
    };

  })

  describe('Update workflow status on workflow completed', () => {
    test('Update workflow status on workflow completed', async () => {
      await updateChecks(run, context, output);
    })
  });
});