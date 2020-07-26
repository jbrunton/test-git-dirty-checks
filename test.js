const sh = require('shelljs')
const path = require('path')
const fs = require('fs')
const assert = require('assert')
const tmp = require('tmp')

function initRepo() {
  sh.exec('git init')
  sh.exec('echo content1 > file1')
  sh.exec('git add file1')
  sh.exec('git commit -m "add file1" file1')
}

function run(command) {
  console.log(`running: "${command}"`)
  const result = sh.exec(command)
  console.log(`  code: ${result.code}`)
}

function test(command) {
  const tmpdir = tmp.dirSync()
  console.log('tmp dir: ' + tmpdir.name)
  process.chdir(tmpdir.name);
  initRepo()

  console.log('testing on a clean repo...')
  run(command)

  console.log('testing with an untracked file')
  sh.exec('echo content2 > file2')
  run(command)

  console.log('testing with a change file in index')
  sh.exec('git add file2')
  run(command)

  console.log('testing with a committed file')
  sh.exec('git commit -m "add file2"')
  run(command)

  console.log('testing after touching a file')
  sh.exec('touch file2')
  run(command)
}


test('git diff --quiet')
test('git diff-index --quiet HEAD --')

