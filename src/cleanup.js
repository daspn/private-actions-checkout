const {
  error,
  getInput,
  setFailed
} = require('@actions/core')
const {
  cleanupSSH
} = require('./ssh-setup')

const run = async () => {
  try {
    const appId = getInput('app_id')
    const configGit = getInput('configure_git') === 'true'

    if (!appId && configGit) {
      cleanupSSH()
    }
  } catch (e) {
    error(e)
    setFailed(e.message)
  }
}

run()
