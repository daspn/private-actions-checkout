const repoRegex = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(@([A-Za-z0-9_.-]+))?$/
const convertActionToCloneCommand = (cloneDir, action, cloneUrlBuilder) => {
  const match = repoRegex.exec(action)
  // Validate the format
  if (!match) throw new Error(`The action ${action} does not match with the format org/owner(@branch|@tag)? format`)

  const params = {
    owner: match[1],
    repo: match[2],
    ref: match[4]
  }
  // Validate owner and repo
  if (!params.owner || !params.repo) throw new Error(`The action ${action} doesn't seem to contain a valid owner or repo`)

  const defaultCommand = 'git clone --depth=1'
  const branchCommand = params.ref ? `--single-branch --branch ${params.ref}` : ''
  const cloneUrl = cloneUrlBuilder(params)
  return `${defaultCommand} ${branchCommand} ${cloneUrl} ${cloneDir}/${params.repo}`
}

module.exports = {
  convertActionToCloneCommand
}
