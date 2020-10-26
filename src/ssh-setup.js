const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const {
  info,
} =  require("@actions/core")

const sshHomePath = `${process.env['HOME']}/.ssh`;
const sshHomeSetup = () => {
  info('SSH > Creating SSH home folder');
  fs.mkdirSync(sshHomePath, { recursive: true });
  info('SSH > Configuring known_hosts file');
  execSync(`ssh-keyscan -H github.com >> ${sshHomePath}/known_hosts`);
};

const sshAgentStart = () => {
  info('SSH > Starting the SSH agent');
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
  info('SSH > Adding the private key');
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

const repoRegex = /^(.+)\/(.+)@(.+)$/;
const cloneWithSSH = (basePath, action) => {
  const match = repoRegex.exec(action);
  if(match.length === 4) {
    const owner = match[1];
    const repo = match[2];
    const ref = match[3];

    const cloneUrl = `git@github.com:${owner}/${repo}.git`;
    const cloneDir = `${basePath}/${repo}`;
    const cloneCommand = `git clone --depth=1 --single-branch --branch ${ref} ${cloneUrl} ${cloneDir}`;

    info(`SSH > ${cloneCommand}`);
    execSync(cloneCommand);
  } else {
    info(`SSH > The value ${action} does not follow the required format: owner/repo@ref`);
  }
}

const cleanupSSH = () => {
  info('SSH > Killing the ssh-agent')
  execSync('SSH > kill ${SSH_AGENT_PID}', { stdio: 'inherit' });
}

module.exports = {
  sshSetup,
  cloneWithSSH,
  cleanupSSH
}