const {
  error,
  info,
  setFailed,
  setSecret
} = require('@actions/core')
const { getOctokit } = require('@actions/github')
const { App } = require('@octokit/app')
const isBase64 = require('is-base64')
const { execSync } = require('child_process')
const { convertActionToCloneCommand } = require('./action-parser')

// Code based on https://github.com/tibdex/github-app-token
async function obtainAppToken (id, privateKeyInput) {
  try {
    // Get the parameters and throw if they are not found
    const privateKey = isBase64(privateKeyInput)
      ? Buffer.from(privateKeyInput, 'base64').toString('utf8')
      : privateKeyInput
    info(`App > Base 64 detected on private key: ${isBase64(privateKeyInput)}`)

    // Obtain JWT
    const app = new App({
      id,
      privateKey
    })
    const jwt = app.getSignedJsonWebToken()

    //Obtain installation
    const octokit = getOctokit(jwt)
    const installations = await octokit.apps.listInstallations()
    if(installations.data.length !== 1) {
      error(`App > Only 1 installation is allowed for this app. We detected it has ${installations.data.length} installations`)
      return;
    }
    const {
      id: installationId
    } = installations.data[0]
    info(`App > Installation: ${installationId}`)

    //Obtain token
    const token = await app.getInstallationAccessToken({
      installationId
    })
    setSecret(token)
    info('App > GitHub app token generated successfully')
    return token
  } catch (exception) {
    error(exception)
    setFailed(exception.message)
  }
}

const configureAppGit = (token) => {
  const command = `git config --global url."https://x-access-token:${token}@github.com/".insteadOf "https://github.com/"`
  info(`App > ${command}`)
  execSync(command)
}

const cloneWithApp = (basePath, action, token) => {
  const command = convertActionToCloneCommand(basePath, action, (params) =>
    `https://x-access-token:${token}@github.com/${params.owner}/${params.repo}.git`
  )
  info(`App > ${command}`)
  execSync(command)
}

module.exports = {
  obtainAppToken,
  cloneWithApp,
  configureAppGit
}
