"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const Octokit = require("@octokit/rest");
const matchAll = require("match-all");
async function extractJiraKeysFromCommit() {
    try {
        const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;
        const tag = core.getInput('release-tag');
        const isPullRequest = core.getInput('is-pull-request') == 'true';
        // console.log("isPullRequest: " + isPullRequest);
        const commitMessage = core.getInput('commit-message');
        // console.log("commitMessage: " + commitMessage);
        // console.log("core.getInput('parse-all-commits'): " + core.getInput('parse-all-commits'));
        const parseAllCommits = core.getInput('parse-all-commits') == 'true';
        // console.log("parseAllCommits: " + parseAllCommits);
        const payload = github.context.payload;
        const token = process.env['GITHUB_TOKEN'];
        console.log({ token });
        const octokit = new Octokit({
            auth: token,
        });
        const gittolo = new github.GitHub({
            auth: token,
        });
        if (isPullRequest) {
            let resultArr = [];
            // console.log("is pull request...");
            if (!payload.repository) {
                console.warn('Failed to get repository');
                return;
            }
            const owner = payload.repository.owner.login;
            const repo = payload.repository.name;
            const prNum = payload.number;
            const { data } = await octokit.pulls.listCommits({
                owner: owner,
                repo: repo,
                pull_number: prNum
            });
            data.forEach((item) => {
                const commit = item.commit;
                const matches = matchAll(commit.message, regex).toArray();
                matches.forEach((match) => {
                    if (resultArr.find((element) => element == match)) {
                        // console.log(match + " is already included in result array");
                    }
                    else {
                        // console.log(" adding " + match + " to result array");
                        resultArr.push(match);
                    }
                });
            });
            const result = resultArr.join(',');
            core.setOutput("jira-keys", result);
            return;
        }
        if (commitMessage) {
            // console.log("commit-message input val provided...");
            const matches = matchAll(commitMessage, regex).toArray();
            const result = matches.join(',');
            core.setOutput("jira-keys", result);
            return;
        }
        if (parseAllCommits) {
            // console.log("parse-all-commits input val is true");
            let resultArr = [];
            payload.commits.forEach((commit) => {
                const matches = matchAll(commit.message, regex).toArray();
                matches.forEach((match) => {
                    if (resultArr.find((element) => element == match)) {
                        // console.log(match + " is already included in result array");
                    }
                    else {
                        // console.log(" adding " + match + " to result array");
                        resultArr.push(match);
                    }
                });
            });
            const result = resultArr.join(',');
            core.setOutput("jira-keys", result);
            return;
        }
        if (tag) {
            if (!payload.repository) {
                console.warn('Failed to get repository');
                return;
            }
            const owner = payload.repository.owner.login;
            const repo = payload.repository.name;
            console.log(owner, repo);
            const a = gittolo.repos.getReleaseByTag({ owner, repo, tag });
            console.log(a);
            // const { data } = await octokit.repos.getReleaseByTag({
            //     owner,
            //     repo,
            //     tag
            // });
            // console.log(data)
            return;
        }
        // console.log("parse-all-commits input val is false");
        // console.log("head_commit: ", payload.head_commit);
        const matches = matchAll(payload.head_commit.message, regex).toArray();
        const result = matches.join(',');
        core.setOutput("jira-keys", result);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
(async function () {
    await extractJiraKeysFromCommit();
    // console.log("finished extracting jira keys from commit message");
})();
exports.default = extractJiraKeysFromCommit;
