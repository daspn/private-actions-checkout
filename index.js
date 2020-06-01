const core = require("@actions/core");
const exec = require('@actions/exec');

async function run() {
  try {
    const actionsList = JSON.parse(core.getInput("actions_list"));
    const basePath = core.getInput("checkout_base_path");

    const regex = /^(.+)\/(.+)@(.+)$/;
    actionsList.forEach(async (action) => {
      const match = regex.exec(action);
      if(match.length === 4) {
        const owner = match[1];
        const repo = match[2];
        const branch = match[3];

        const cloneUrl = `git@github.com:${owner}/${repo}.git`;
        const cloneDir = `${basePath}/${repo}`;
        const cloneCommand = `git clone --depth=1 --single-branch --branch ${branch} ${cloneUrl} ${cloneDir}`;
        console.log(cloneCommand);
        await exec.exec(cloneCommand);

      } else {
        console.log(`The value ${action} does not follow the required format: owner/repo@branch`);
      }
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
