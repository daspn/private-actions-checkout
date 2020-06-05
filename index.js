const core = require('@actions/core');
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');

const sshHomePath = `${process.env["HOME"]}/.ssh`;
const sshHomeSetup = () => {
  console.log('Creating SSH home folder');
  fs.mkdirSync(sshHomePath, { recursive: true });
  fs.appendFileSync(`${sshHomePath}/known_hosts`, '\ngithub.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==\n');
  fs.appendFileSync(`${sshHomePath}/known_hosts`, '\ngithub.com ssh-dss AAAAB3NzaC1kc3MAAACBANGFW2P9xlGU3zWrymJgI/lKo//ZW2WfVtmbsUZJ5uyKArtlQOT2+WRhcg4979aFxgKdcsqAYW3/LS1T2km3jYW/vr4Uzn+dXWODVk5VlUiZ1HFOHf6s6ITcZvjvdbp6ZbpM+DuJT7Bw+h5Fx8Qt8I16oCZYmAPJRtu46o9C2zk1AAAAFQC4gdFGcSbp5Gr0Wd5Ay/jtcldMewAAAIATTgn4sY4Nem/FQE+XJlyUQptPWMem5fwOcWtSXiTKaaN0lkk2p2snz+EJvAGXGq9dTSWHyLJSM2W6ZdQDqWJ1k+cL8CARAqL+UMwF84CR0m3hj+wtVGD/J4G5kW2DBAf4/bqzP4469lT+dF2FRQ2L9JKXrCWcnhMtJUvua8dvnwAAAIB6C4nQfAA7x8oLta6tT+oCk2WQcydNsyugE8vLrHlogoWEicla6cWPk7oXSspbzUcfkjN3Qa6e74PhRkc7JdSdAlFzU3m7LMkXo1MHgkqNX8glxWNVqBSc0YRdbFdTkL0C6gtpklilhvuHQCdbgB3LBAikcRkDp+FCVkUgPC/7Rw==\n');
};

const sshAgentStart = () => {
  console.log('Starting the SSH agent.');
  
  const sshAgentOutput = execFileSync("ssh-agent");
  const lines = sshAgentOutput.toString().split("\n");
  for (const lineNumber in lines) {
    const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(lines[lineNumber]);
    if (matches && matches.length > 0) {
      process.env[matches[1]] = matches[2];
      core.exportVariable(matches[1], matches[2]);
    }
  }
};

const addPrivateKey = (privateKey) => {
  console.log('Adding the private key');
  privateKey.split(/(?=-----BEGIN)/).forEach(function (key) {
    execSync("ssh-add -", { input: key.trim() + "\n" });
  });
  execSync("ssh-add -l", { stdio: "inherit" });
};

const sshSetup = (privateKey) => {
  sshHomeSetup();
  sshAgentStart();
  addPrivateKey(privateKey);
};

const hasValue = (input) => {
  return input.trim().length !== 0;
};

const sshPrivateKey = core.getInput("ssh_private_key");

if (hasValue(sshPrivateKey)) {
  console.log("Setting up the SSH agent with the provided private key");
  sshSetup(sshPrivateKey);
} else {
  console.log("No private key provided. Assuming valid SSH credentials are available");
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
  //clean up
  execSync("kill ${SSH_AGENT_PID}", { stdio: "inherit" });
}
