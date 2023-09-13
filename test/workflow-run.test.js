const { Probot, ProbotOctokit, Context } = require("probot");
const mockingoose = require('mockingoose');
const workflowCompletedPayload = require("./fixtures/workflow-completed.json");
const { completedRun } = require('../src/handlers/workflow-run');
const privateKey = "privateKey";
const Register = require('../src/models/register.model')

describe("Workflow run handler test cases", () => {
  let context;
  let probot;
  let _doc;

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
    context = new Context(workflowCompletedPayload, {}, {})

    context.octokit.checks = {
      update: jest.fn().mockImplementation(async () => { })
    };

    context.octokit = {
      request: jest.fn().mockImplementation(async () => ({
        status: 200,
        url: "https://api.github.com/repos/accionslabsOrg/veracode/actions/runs/5830013895/artifacts",
        data: {
          total_count: 0,
          artifacts: []
        }
      }))
    };

  })

  // describe('Scan completed for veracode-sast-pipeline-scan', () => {

  //   beforeEach(async () => {
  //     _doc = {
  //       run_id: 5829116882,
  //       repository_owner: 'accionslabsOrg',
  //       repository_name: 'example-javascript',
  //       check_run_id: 15806986236,
  //       check_run_type: 'veracode-sast-pipeline-scan',
  //       branch: 'master',
  //       __v: 0
  //     }

  //     mockingoose(Register).toReturn(_doc, 'findOne');
  //   });
  //   test('should update the scan status to success', async () => {
  //     await completedRun(context);
  //     expect(context.octokit.request).toBeCalledWith('GET /repos/accionslabsOrg/veracode/actions/runs/5829116882/artifacts');
  //   })
  // });

  describe('Scan completed for veracode-sast-policy-scan', () => {
    beforeEach(async () => {
      _doc = {
        run_id: 5829116882,
        repository_owner: 'accionslabsOrg',
        repository_name: 'example-javascript',
        check_run_id: 15806986236,
        check_run_type: 'veracode-sast-policy-scan',
        branch: 'master',
        __v: 0
      }

      mockingoose(Register).toReturn(_doc, 'findOne');
    });
    test('should update the scan status to success', async () => {
      await completedRun(context);
      expect(context.octokit.request).toBeCalledWith('GET /repos/accionslabsOrg/veracode/actions/runs/5829116882/artifacts');
    })
  });

  describe('should not update the status of scan', () => {
    beforeEach(async () => {
      mockingoose(Register).toReturn(new Error(), 'findOne');
    });
    test('should createInstallationAccessToken that is scoped to push repository', async () => {
      await completedRun(context);
      expect(context.octokit.request).not.toBeCalledWith('GET /repos/accionslabsOrg/veracode/actions/runs/5829116882/artifacts');
    })
  });
});