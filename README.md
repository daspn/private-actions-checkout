![SSH Tests](https://github.com/daspn/private-actions-checkout/workflows/SSH%20Tests/badge.svg)
![GitHub App tests](https://github.com/daspn/private-actions-checkout/workflows/GitHub%20App%20tests/badge.svg)

# private-actions-checkout

Simplifies using custom private actions (and promotes code reuse) by looping through a list of repositories and checking 
them out into the job's workspace. Supports using GitHub Apps or multiple SSH keys.

Optionally configures git to allow subsequent steps to provide authenticated access private repos.

This actions is tested on `ubuntu-18.04`, `ubuntu-16.04`, `macos-10.15`. No Windows support yet.

## Usage

### Pre-requisites
Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflows) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Supported authentications
To checkout private repositories we need a supported authentication accepted by the Git protocol. This action supports
GitHub Apps and SSH keys.

For enterprise environments we recommend using a GitHub app per organization with 1 installation as it doesn't require having a machine account.

### Inputs

* `actions_list` - **REQUIRED**: List of private actions to checkout. Must be a JSON array and each entry must match the format owner/repo@ref.  May be an empty array if no actions are required.
* `checkout_base_path` - **OPTIONAL**: Where to checkout the custom actions. It uses `./.github/actions` as default path
* `return_app_token` - **OPTIONAL**: If set to `true` then an output variable called `app-token` will be set that can be used for basic auth to github by subsequent steps (only works with Github Apps as the authentication method)
* `configure_git` - **OPTIONAL**: If set to `true` then `git config` is executed to grant subsequent steps access to other private repos using the ssh or Github App token.

If you want to use **GitHub Apps** (recommended):
* `app_id`: the GitHub App id obtained when you [create a GitHub app](https://docs.github.com/en/free-pro-team@latest/developers/apps/creating-a-github-app)
* `app_private_key`: the [GitHub App private key](https://docs.github.com/en/free-pro-team@latest/developers/apps/authenticating-with-github-apps#generating-a-private-key) generated for an app with permissions on the repositories

> We support the key being plain and base64 encoded. To encode the private key you can use the following command: `cat key.pem | base64 | tr -d \\n && echo`

If you want to use **SSH keys**:
* `ssh_private_key` - **OPTIONAL**: If provided, configures the `ssh-agent` with the given private key. If not provided the code assumes that valid SSH credentials are available to the `git` executable.  If `configure_git` is enabled then the agent will be left running until the end of the job. 

## GitHub app requisites
If you want to use this action with a GitHub app you will need to setup some permissions.
Follow the [create GitHub app guide](https://docs.github.com/en/free-pro-team@latest/developers/apps/creating-a-github-app) and check:
- **Repository permissions**
  - Contents: read

Once it is created, [install the GitHub app](https://docs.github.com/en/free-pro-team@latest/developers/apps/installing-github-apps) in your account or organization and grant access to the repositories that contain the actions you want to
checkout (or all if you are not concerned the app has wide access in the account or org).

## Example workflows
### GitHub app
```yaml
name: 'Example workflow'

on: push

jobs:
  example:
    runs-on: ubuntu-18.04

    steps:
    - uses: actions/checkout@v2

    - name: Private actions checkout
      uses: daspn/private-actions-checkout@v2
      with:
        actions_list: '["githubuser/my-private-action-1@v1", "githubuser/my-private-action-2@v1"]'
        checkout_base_path: ./.github/actions
        app_id: ${{ secrets.APP_ID }}
        app_private_key: ${{ secrets.APP_PRIVATE_KEY }}

    - name: Validation
      run: |
        ls -lR ./.github/actions

    # the custom private action will be available on the job's workspace
    - name: 'Using custom private action 1'
      uses: ./.github/actions/my-private-action-1
      with:
        some_arg: test

    - name: 'Using custom private action 2'
      uses: ./.github/actions/my-private-action-2
```

### SSH
**Single SSH key:**
```yaml
name: 'Example workflow'

on: push

jobs:
  example:
    runs-on: ubuntu-18.04

    steps:
    - uses: actions/checkout@v2

    - name: Private actions checkout
      uses: daspn/private-actions-checkout@v2
      with:
        actions_list: '["githubuser/my-private-action-1@v1", "githubuser/my-private-action-2@v1"]'
        checkout_base_path: ./.github/actions
        ssh_private_key: ${{ secrets.SSH_PRIVATE_KEY }}

    - name: Validation
      run: |
        ls -lR ./.github/actions

    # the custom private action will be available on the job's workspace
    - name: 'Using custom private action 1'
      uses: ./.github/actions/my-private-action-1
      with:
        some_arg: test

    - name: 'Using custom private action 2'
      uses: ./.github/actions/my-private-action-2
```

**Multiple SSH keys workflow example:**
```yaml
name: 'Multiple SSH Keys workflow example'

on: push

jobs:
  example:
    runs-on: ubuntu-18.04

    steps:
    - uses: actions/checkout@v2

    - name: Checking out private actions from github_user
      uses: daspn/private-actions-checkout@v2
      with:
        actions_list: '["github_user/my-private-action-1@v1", "github_user/my-private-action-2@v1"]'
        checkout_base_path: ./.github/actions
        ssh_private_key: ${{ secrets.SSH_PRIVATE_KEY_1 }}

    - name: Checking out private actions from another_github_user
      uses: daspn/private-actions-checkout@v2
      with:
        actions_list: '["another_github_user/my-private-action-3@v1", "another_github_user/my-private-action-4@v1"]'
        checkout_base_path: ./.github/actions
        ssh_private_key: ${{ secrets.SSH_PRIVATE_KEY_2 }}

    - name: Validation
      run: |
        ls -lR ./.github/actions

    # the custom private action will be available on the job's workspace
    - name: 'Using custom private action 1'
      uses: ./.github/actions/my-private-action-1
      with:
        some_arg: test

    - name: 'Using custom private action 4'
      uses: ./.github/actions/my-private-action-4
```

**No SSH Key example workflow:**
```yaml
name: 'No SSH Key example workflow'

on: push

jobs:
  example:
    runs-on: ubuntu-18.04

    steps:
    - uses: actions/checkout@v2

    # setting up the SSH agent using a third party action
    - uses: webfactory/ssh-agent@v0.2.0
      with:
        ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

    # as no SSH key is provided the action will assume valid SSH credentials are available
    - name: Private actions checkout
      uses: daspn/private-actions-checkout@v2
      with:
        actions_list: '["githubuser/my-private-action-1@v1", "githubuser/my-private-action-2@v1"]'
        checkout_base_path: ./.github/actions

    - name: Validation
      run: |
        ls -lR ./.github/actions

    # the custom private action will be available on the job's workspace
    - name: 'Using custom private action 1'
      uses: ./.github/actions/my-private-action-1
      with:
        some_arg: test

    - name: 'Using custom private action 2'
      uses: ./.github/actions/my-private-action-2
```

GitHub App authorizing a Go application to fetch other private dependencies:
```yaml
name: 'Example workflow'

on: push

jobs:
  example:
    runs-on: ubuntu-18.04

    steps:
    - uses: actions/checkout@v2

    - name: Private actions checkout
      uses: daspn/private-actions-checkout@v2
      with:
        app_id: ${{ secrets.APP_ID }}
        app_private_key: ${{ secrets.APP_PRIVATE_KEY }}
        configure_git: true

    - name: Set up Go
      uses: actions/setup-go@v2
      with:
        go-version: 1.15

    # Go build will be able to access other private repos authorized to the app
    - name: Build
      run: go build -v .
```


### How to build

#### Local environment setup

To build this code, `Node.js 12.x` is [required](https://nodejs.org/en/download/current/).

After installing `Node.js 12.x`, install the NPM package `zeit/ncc` by running:

```shell
npm i -g @zeit/ncc
```

## Building the code

```shell
npm i
npm run build
```

This will update the `dist/index.js` and `dist/cleanup/index.js` files.
