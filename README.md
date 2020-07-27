# Test Git Dirty Checks

A node script for testing different git commands that check for any changes to **tracked** files (i.e. that ignore unstracked files). This is to sense check options for addressing [release-it #687](https://github.com/release-it/release-it/issues/687).

See also [this gist](https://gist.github.com/sindresorhus/3898739) for reference on some of these commands.

Setup:

    git clone git@github.com:jbrunton/test-git-dirty-checks.git
    cd test-git-dirty-checks
    npm install

## Test for candidate commands:

Run:

    node test-commands.js

The script will evaluate a bunch of commands to determine which fit all necessary criteria.

## Benchmarking commands

For example, to run against the WebKit repo:

    node benchmark.js path/to/WebKit/ Makefile file1

In the setup, this will:

* Amend the tracked file `Makefile`.
* Add an untracked file `file`.
