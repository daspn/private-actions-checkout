const core = require('@actions/core');
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');

const sshHomePath = `${process.env['HOME']}/.ssh`;
const sshHomeSetup = () => {
  console.log('Creating SSH home folder');
  fs.mkdirSync(sshHomePath, { recursive: true });
  console.log('Configuring known_hosts file');
  execSync(`ssh-keyscan -H github.com >> ${sshHomePath}/known_hosts`);
};

const sshAgentStart = () => {
  console.log('Starting the SSH agent');
  const sshAgentOutput = execFileSync('ssh-agent');
  const lines = sshAgentOutput.toString().split('\n');
  for (const lineNumber in lines) {
    const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(lines[lineNumber]);
    if (matches && matches.length > 0) {
      process.env[matches[1]] = matches[2];
    }
  }
};

const addPrivateKey = (privateKey) => {
  console.log('Adding the private key');
  privateKey.split(/(?=-----BEGIN)/).forEach(function (key) {
    execSync('ssh-add -', { input: key.trim() + '\n' });
  });
  execSync('ssh-add -l', { stdio: 'inherit' });
};

const sshSetup = (privateKey) => {
  sshHomeSetup();
  sshAgentStart();
  addPrivateKey(privateKey);
};

const hasValue = (input) => {
  return input.trim().length !== 0;
};

const sshPrivateKey = core.getInput('ssh_private_key');

if (hasValue(sshPrivateKey)) {
  console.log('Setting up the SSH agent with the provided private key');
  sshSetup(sshPrivateKey);
} else {
  console.log('No private key provided. Assuming valid SSH credentials are available');
}

const actionsList = JSON.parse(core.getInput('actions_list'));
const basePath = core.getInput('checkout_base_path');

const regex = /^(.+)\/(.+)@(.+)$/;
actionsList.forEach((action) => {
  const match = regex.exec(action);
  if(match.length === 4) {
    const owner = match[1];
    const repo = match[2];
    const branch = match[3];

    const cloneUrl = `git@github.com:${owner}/${repo}.git`;
    const cloneDir = `${basePath}/${repo}`;
    const cloneCommand = `git clone --depth=1 --single-branch --branch ${branch} ${cloneUrl} ${cloneDir}`;

    console.log(cloneCommand);
    execSync(cloneCommand);
  } else {
    console.log(`The value ${action} does not follow the required format: owner/repo@branch`);
  }
});

if (hasValue(sshPrivateKey)) {
  console.log('Killing the ssh-agent')
  execSync('kill ${SSH_AGENT_PID}', { stdio: 'inherit' });
}
