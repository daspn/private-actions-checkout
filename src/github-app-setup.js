const { execSync } = require('child_process');
const {
  error,
  getInput,
  info,
  setFailed,
  setSecret,
} =  require("@actions/core")
const { context, getOctokit } = require("@actions/github")
const { App } = require("@octokit/app")
const isBase64 = require("is-base64")

//Code based on https://github.com/tibdex/github-app-token
async function obtainAppToken () {
  try {
    // Get the parameters and throw if they are not found
    const id = Number(getInput("app_id", { required: true }));
    const privateKeyInput = getInput("private_key", { required: true });
    const privateKey = isBase64(privateKeyInput)
      ? Buffer.from(privateKeyInput, "base64").toString("utf8")
      : privateKeyInput;

    // Obtain the installation token
    const app = new App({
      id,
      privateKey
    });
    const jwt = app.getSignedJsonWebToken();
    const octokit = getOctokit(jwt);
    const {
      data: { id: installationId },
    } = await octokit.apps.getRepoInstallation(context.repo);
    const token = await app.getInstallationAccessToken({
      installationId,
    });
    setSecret(token);
    info("GitHub app token generated successfully");
    return token
  } catch (exception) {
    error(exception);
    setFailed(exception.message);
  }
}

const cloneWithApp = (basePath, action, token) => {
  const repo = '';
  const owner = '';
  const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`
  const cloneDir = `${basePath}/${repo}`;
  const command = `git clone ${cloneUrl}`
  execSync()
}

module.exports = {
  obtainAppToken,
  cloneWithApp,
}