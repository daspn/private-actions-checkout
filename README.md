# private-actions-checkout

Simplifies using custom private actions (and promotes code reuse) by looping throught a list of repositories and checking them out locally. 
This action assumes that valid SSH credentials are available to the `git` executable (see example below).

## Usage

### Pre-requisites
Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Inputs

* `actions_list` - List of private actions to checkout. Must be a JSON array and each entry must mutch the format owner/repo@branch
* `checkout_base_path` - Where to checkout the custom actions

### Example workflow

```yaml
name: Example workflow

on: push

jobs:
  example:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    # here I'm using a custom action to setup the SSH credentials, but you can choose any other approach
    - uses: webfactory/ssh-agent@v0.2.0
      with:
        ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

    - name: Private actions checkout
      uses: daspn/private-actions-checkout@v1
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

### How to build

#### Local environment setup

To build this code, `Node.js 12.x` is [required](https://nodejs.org/en/download/current/).

After installing `Node.js 12.x`, install the NPM package `zeit/ncc` by running:

```console
npm i -g @zeit/ncc
```

## Building the code

```console
npm run build
```
