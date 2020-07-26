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
  const result = sh.exec(command)
  console.log(`  code: ${result.code}`)
}

function test(command) {
  console.log(`\nStarting testing run for command: ${command}`)

  const tmpdir = tmp.dirSync()
  process.chdir(tmpdir.name);
  initRepo()

  console.log('\nScenario: clean repo')
  run(command)

  console.log('\nScenario: untracked file')
  sh.exec('echo content2 > file2')
  run(command)

  console.log('\nScenario: staged change')
  sh.exec('git add file2')
  run(command)

  console.log('\nScenario: committed file (clean repo)')
  sh.exec('git commit -m "add file2"')
  run(command)

  console.log('\nScenario: touch file')
  const resultCodes = Array.from(Array(10).keys()).map(i => {
    sh.exec('touch file2')
    return sh.exec(command).code
  })
  console.log(`  codes: ${resultCodes}`)

  console.log('\nScenario: unstaged change')
  sh.exec('echo foo > file2')
  run(command)
}

test('git diff --quiet')
test('git diff-index --quiet HEAD --')  
