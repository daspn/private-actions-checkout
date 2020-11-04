const { execFileSync, execSync } = require('child_process')
const fs = require('fs')
const {
  info
} = require('@actions/core')

const { convertActionToCloneCommand } = require('./action-parser')
const sshHomePath = `${process.env.HOME}/.ssh`
const sshHomeSetup = () => {
  info('SSH > Creating SSH home folder')
  fs.mkdirSync(sshHomePath, { recursive: true })
  info('SSH > Configuring known_hosts file')
  execSync(`ssh-keyscan -H github.com >> ${sshHomePath}/known_hosts`)
}

const sshAgentStart = () => {
  info('SSH > Starting the SSH agent')
  const sshAgentOutput = execFileSync('ssh-agent')
  const lines = sshAgentOutput.toString().split('\n')
  for (const lineNumber in lines) {
    const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(lines[lineNumber])
    if (matches && matches.length > 0) {
      process.env[matches[1]] = matches[2]
    }
  }
}

const addPrivateKey = (privateKey) => {
  info('SSH > Adding the private key')
  privateKey.split(/(?=-----BEGIN)/).forEach(function (key) {
    execSync('ssh-add -', { input: key.trim() + '\n' })
  })
  execSync('ssh-add -l', { stdio: 'inherit' })
}

const sshSetup = (privateKey) => {
  sshHomeSetup()
  sshAgentStart()
  addPrivateKey(privateKey)
}

const cloneWithSSH = (basePath, action) => {
  const command = convertActionToCloneCommand(basePath, action, (params) =>
    `git@github.com:${params.owner}/${params.repo}.git`
  )
  info(`SSH > ${command}`)
  execSync(command)
}

const cleanupSSH = () => {
  info('SSH > Killing the ssh-agent')
  /* eslint no-template-curly-in-string: "off" */
  execSync('kill ${SSH_AGENT_PID}', { stdio: 'inherit' })
}

module.exports = {
  sshSetup,
  cloneWithSSH,
  cleanupSSH
}
