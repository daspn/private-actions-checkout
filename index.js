const core = require('@actions/core');
const exec = require('@actions/exec');

const privateKeyPath = `./${Math.random().toString(36).substring(7)}`;

const logAndExec = async (command) => {
  console.log(command);
  await exec.exec(command);
}

const sshSetup = async (privateKey) => {
  await logAndExec('ssh-agent -s');
  await logAndExec(`echo '${privateKey}' > ${privateKeyPath}`);
  await logAndExec(`ssh-add -K ${privateKeyPath}`);
  await logAndExec(`ssh-keyscan -H github.com >> ~/.ssh/known_hosts`);
}

const sshCleanUp = async () => {
  await logAndExec(`ssh-add -D ${privateKeyPath}`);
  await logAndExec(`rm -f ${privateKeyPath}`);
}

async function run() {
  try {
    const actionsList = JSON.parse(core.getInput('actions_list'));
    const basePath = core.getInput('checkout_base_path');
    const sshPrivateKey = core.getInput('ssh_private_key');

    if(sshPrivateKey.trim().length !== 0) {
      await sshSetup(sshPrivateKey);
    }

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

        await logAndExec(cloneCommand);
      } else {
        console.log(`The value ${action} does not follow the required format: owner/repo@branch`);
      }
    });

    await sshCleanUp();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
