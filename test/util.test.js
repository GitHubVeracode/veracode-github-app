const { Probot, ProbotOctokit, Context } = require("probot");
const pushPayload = require("./fixtures/push");
const { shouldRunForRepository, shouldRunScanType, getVeracodeConfigFromRepo } = require("../src/utils/util")
const privateKey = "privateKey";
const appConfig = require('../src/app-config');

describe("Util test", () => {

    describe("Get veracode config from veracode repo", () => {
        let context;
        let token;
        let callback_url;
        let probot;
        beforeEach(async () => {
            probot = new Probot({
                appId: 123,
                privateKey,
                Octokit: ProbotOctokit.defaults({
                    retry: { enabled: false },
                    throttle: { enabled: false },
                }),
            });
            callback_url = `${appConfig().appUrl}/register`;
            token = 'secret42';
            context = new Context(pushPayload, {}, {});

            context.octokit.repos = {
                getContent: jest.fn().mockImplementation(async () => { })
            };
        })
        test('should call getContent to get the config from veracode repo', async () => {
            await getVeracodeConfigFromRepo(context.octokit, "GitHubVeracode", "example-javascript");
            expect(context.octokit.repos.getContent).toBeCalledWith({ owner: "GitHubVeracode", repo: "example-javascript", path: appConfig().veracodeConfigFile })
        })
    });

    describe("should return error while retriving veracode config from veracode repo", () => {
        let context;
        let token;
        let callback_url;
        let probot;
        beforeEach(async () => {
            probot = new Probot({
                appId: 123,
                privateKey,
                Octokit: ProbotOctokit.defaults({
                    retry: { enabled: false },
                    throttle: { enabled: false },
                }),
            });
            callback_url = `${appConfig().appUrl}/register`;
            token = 'secret42';
            context = new Context(pushPayload, {}, {});

            context.octokit.repos = {
                getContent: jest.fn().mockImplementation(async () => { throw new Error(); })
            };
        })
        test('should return error while retriving veracode config from veracode repo', async () => {
            await getVeracodeConfigFromRepo(context.octokit, "GitHubVeracode", "example-javascript");
            expect(context.octokit.repos.getContent).toBeCalledWith({ owner: "GitHubVeracode", repo: "example-javascript", path: appConfig().veracodeConfigFile })
        })
    });

    describe('shouldRunScanType', () => {
        let branch = "master";
        let defaultBranch = "";
        let action = null;
        let targetBranch = null;
        let eventName = "push";
        let veracodeScanConfig = {
            push: {
                trigger: false,
                branches_to_run: ['master'],
                branches_to_exclude: null
            },
            pull_request: {
                trigger: false,
                action: ['opened', 'synchronize'],
                target_branch: ['default_branch']
            },
            break_build: true,
            create_issues: false
        };

        describe(`disabled both event's triggers`, () => {
            test(`should return flase if trigger flag is false for push or pull event `, () => {
                expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(false)
            });
        });

        describe(`enabled push event's trigger`, () => {
            beforeEach(() => {
                veracodeScanConfig.push.trigger = true;
            })
            test(`should return true if trigger flag is true`, () => {
                expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(true)
            });
            describe(`trigger for master branch`, () => {
                test(`should return true if trigger for master branch `, () => {
                    expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(true)
                });
            });
            describe(`should return false if trigger for master branch and config for develop branch`, () => {
                beforeEach(() => {
                    veracodeScanConfig.push.branches_to_run = ['develop'];
                })
                test(`run for develop branch`, () => {
                    expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(false)
                });
            });
            describe(`should return false if trigger for master branch and same branch is in exclude`, () => {
                beforeEach(() => {
                    veracodeScanConfig.push.branches_to_exclude = ['master'];
                })
                test(`run for develop branch`, () => {
                    expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(false)
                });
            });

            describe(`should return false if trigger for master branch and same branch is in exclude`, () => {
                beforeEach(() => {
                    veracodeScanConfig.push.branches_to_exclude = ['develop'];
                    veracodeScanConfig.push.branches_to_run = null;

                })
                test(`run for develop branch`, () => {
                    expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(true)
                });
            });

            describe(`should return false if trigger for master branch and same branch is in exclude`, () => {
                beforeEach(() => {
                    veracodeScanConfig.push.branches_to_exclude = ['develop'];
                    veracodeScanConfig.push.branches_to_run = null;
                    branch = "develop";

                })
                test(`run for develop branch`, () => {
                    expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(false)
                });
            });
        });
    })

    describe('shouldRunScanType', () => {
        let branch = "master";
        let action = null;
        action = 'opened';
        let targetBranch = "develop";
        let eventName = "pull_request";
        let defaultBranch = "develop";
        let veracodeScanConfig = {
            push: {
                trigger: false,
                branches_to_run: ['master'],
                branches_to_exclude: null
            },
            pull_request: {
                trigger: false,
                action: ['opened', 'synchronize'],
                target_branch: ['default_branch']
            },
            break_build: true,
            create_issues: false
        };

        describe(`enabled pull_request event's trigger`, () => {
            beforeEach(() => {
                veracodeScanConfig.pull_request.trigger = false;
                eventName = "";
            })
            test(`enabled pull_request event's trigger `, () => {
                expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(false)
            });
        });

        describe(`enabled pull_request event's trigger`, () => {
            beforeEach(() => {
                veracodeScanConfig.pull_request.trigger = true;
                action = 'opened';
                targetBranch = "develop";
                eventName = "pull_request";
                defaultBranch = "develop";
            })
            test(`enabled pull_request event's trigger `, () => {
                expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(true)
            });
            describe(`config for master`, () => {
                test(`run for develop branch`, () => {
                    expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(true)
                });
            });
            // describe(`config for master but running for develop`, () => {
            //     beforeEach(() => {
            //         veracodeScanConfig.pull_request.branches_to_run = ['develop'];
            //     })
            //     test(`run for develop branch`, () => {
            //         expect(shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch)).toBe(false)
            //     });
            // });
        });
    })
    //---


    let repositoryName = "main";
    let exclude = ["main"];

    describe('no exclude pattern is defined', () => {
        beforeEach(() => {
            exclude = [];
        })

        test('should return true', () => {
            expect(shouldRunForRepository(repositoryName, exclude)).toBe(true)
        })
    })

    describe('exclude pattern is defined', () => {
        describe('without wildcard', () => {
            beforeEach(() => {
                exclude = ['.github', 'exclude-this-repo'];
            })

            test('should return true if exclude array doesnt contain repository', () => {
                repositoryName = 'foobar';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(true)
            })

            test('should return false if exclude array contains repository', () => {
                repositoryName = '.github';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(false)

                repositoryName = 'exclude-this-repo';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(false)
            })
        })

        describe('with wildcard', () => {
            beforeEach(() => {
                exclude = ['exclude-*', '*-ignore', '*-nope-*'];
            })

            test('should return true if exclude array doesnt matches repository', () => {
                repositoryName = 'foo';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(true)

                repositoryName = 'foo-exclude-foo';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(true)

                repositoryName = 'foo-ignore-foo';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(true)
            })

            test('should return false if exclude array matches repository', () => {
                repositoryName = 'exclude-';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(false)

                repositoryName = 'exclude-foo-yes';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(false)

                repositoryName = 'foo-ignore';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(false)

                repositoryName = 'foo-nope-foo';
                expect(shouldRunForRepository(repositoryName, exclude)).toBe(false)
            })
        })
    })

});