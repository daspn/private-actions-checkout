const core = require('@actions/core');
const exec = require('@actions/exec');
const child_process = require('child_process');
const fs = require('fs');

const sshHomePath = `${process.env["HOME"]}/.ssh`;
const sshHomeSetup = () => {
  fs.mkdirSync(sshHomePath, { recursive: true });
};

const sshAgentStart = () => {
  console.log('xxxxxxxxxx');
  
  const sshAgentOutput = child_process.execFileSync("ssh-agent");

  console.log('----------');
  console.log(sshAgentOutput.toString());

  const lines = sshAgentOutput.toString().split("\n");
  for (const lineNumber in lines) {
    const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(lines[lineNumber]);
    if (matches && matches.length > 0) {
      
      console.log(matches[1]);
      console.log(matches[2]);

      core.exportVariable(matches[1], matches[2]);
    }
  }
};

const addPrivateKey = (privateKey) => {
  privateKey.split(/(?=-----BEGIN)/).forEach(function (key) {
    child_process.execSync("ssh-add -", { input: key.trim() + "\n" });
  });
};

const sshSetup = (privateKey) => {
  sshHomeSetup();
  sshAgentStart();
  addPrivateKey(privateKey);
  child_process.execSync("ssh-add -l", { stdio: "inherit" });
};

const logAndExec = async (command) => {
  console.log(command);
  await exec.exec(command);
};

const hasValue = (input) => {
  return input.trim().length !== 0;
};

const sshPrivateKey = core.getInput("ssh_private_key");

if (hasValue(sshPrivateKey)) {
  console.log("Setting up the SSH agent with the provided private key.");
  sshSetup(sshPrivateKey);
} else {
  console.log("No private key provided. Assuming valid SSH credentials are available.");
}

async function run() {
  try {
    const actionsList = JSON.parse(core.getInput('actions_list'));
    const basePath = core.getInput('checkout_base_path');

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

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

if (hasValue(sshPrivateKey)) {
  //clean up
  child_process.execSync("kill ${SSH_AGENT_PID}", { stdio: "inherit" });
}
