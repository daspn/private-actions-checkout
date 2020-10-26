const repoRegex = /^(.+)\/(.+)(@(.+))?$/;
const parseAction = (action) => {
  let parsedResult = {
    repo: '',
    owner: '',
    ref: 'master'
  }

  return parsedResult
}

module.exports = {
  parseAction
}