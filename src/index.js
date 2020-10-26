const {
  error,
  getInput,
  info,
  setFailed
} = require('@actions/core')
const {
  sshSetup,
  cloneWithSSH,
  cleanupSSH
} = require('./ssh-setup')
const {
  obtainAppToken,
  cloneWithApp
} = require('./github-app-setup')

const hasValue = (input) => {
  return input.trim().length !== 0
}

const CLONE_STRATEGY_SSH = 'ssh'
const CLONE_STRATEGY_APP = 'app'

const run = async () => {
  try {
    const sshPrivateKey = getInput('ssh_private_key')
    const actionsList = JSON.parse(getInput('actions_list'))
    const basePath = getInput('checkout_base_path')
    const appId = getInput('app_id')

    let cloneStrategy
    let appToken

    // If appId exist we will go ahead and use the GitHub App
    if (hasValue(appId)) {
      cloneStrategy = CLONE_STRATEGY_APP
      const appToken = await obtainAppToken()
      info('SSH > Cloning using SSH strategy')
    } else if (hasValue(sshPrivateKey)) {
      cloneStrategy = CLONE_STRATEGY_SSH
      info('SSH > Cloning using SSH strategy')
      info('SSH > Setting up the SSH agent with the provided private key')
      sshSetup(sshPrivateKey)
    } else {
      cloneStrategy = CLONE_STRATEGY_SSH
      info('SSH > Cloning using SSH strategy')
      info('SSH > No private key provided. Assuming valid SSH credentials are available')
    }

    //Proceed with the clones
    actionsList.forEach((action) => {
      if(cloneStrategy === CLONE_STRATEGY_APP){
        //TODO clone with GitHub app
        cloneWithApp(basePath, action, appToken)
      }else if(cloneStrategy === CLONE_STRATEGY_SSH){
        cloneWithSSH(basePath, action)
      }
    })

    //Cleanup
    if(cloneStrategy === CLONE_STRATEGY_SSH){
      cleanupSSH()
    }
  } catch (e) {
    error(e)
    setFailed(e.message)
  }
}

run()