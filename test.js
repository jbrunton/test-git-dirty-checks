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
  console.log(`  stdout empty: ${result.stdout == ''}`)
}

function test(command) {
  const heading = `* Starting testing run for command: ${command} *`
  console.log('\n' + '*'.repeat(heading.length))
  console.log(heading)
  console.log('*'.repeat(heading.length) + '\n')

  const tmpdir = tmp.dirSync()
  process.chdir(tmpdir.name);
  initRepo()

  const scenarios = [
    ['clean repo', function() {
      return sh.exec(command)
    }],
    ['untracked file', function() {
      sh.exec('echo content2 > file2')
      return sh.exec(command)
    }],
    ['staged change', function() {
      sh.exec('git add file2')
      return sh.exec(command)
    }],
    ['commited file', function() {
      sh.exec('git commit -m "add file2"')
      return sh.exec(command)
    }],
    ['touch file', function() {
      return [...Array(10)].map(i => {
        sh.exec('touch file2')
        return sh.exec(command)
      })
    }],
    ['unstaged change', function() {
      sh.exec('echo foo > file2')
      return sh.exec(command)
    }]
  ]

  const results = scenarios.map(scenario => {
    const result = scenario[1]()
    if (Array.isArray(result)) {
      return {
        scenario: scenario[0],
        code: {
          0: result.filter(x => x.code == 0).length,
          1: result.filter(x => x.code == 1).length
        },
        stdoutEmpty: {
          true: result.filter(x => x.stdout == '').length,
          false: result.filter(x => x.stdout != '').length
        }
      }
    } else {
      return {
        scenario: scenario[0],
        code: result.code,
        stdoutEmpty: result.stdout == ''
      }
    }
  })

  console.table(results)

  // console.log('\nScenario: clean repo')
  // run(command)

  // console.log('\nScenario: untracked file')
  // sh.exec('echo content2 > file2')
  // run(command)

  // console.log('\nScenario: staged change')
  // sh.exec('git add file2')
  // run(command)

  // console.log('\nScenario: committed file (clean repo)')
  // sh.exec('git commit -m "add file2"')
  // run(command)

  // console.log('\nScenario: touch file')
  // const resultCodes = Array.from(Array(10).keys()).map(i => {
  //   sh.exec('touch file2')
  //   return sh.exec(command).code
  // })
  // console.log(`  codes: ${resultCodes}`)

  // console.log('\nScenario: unstaged change')
  // sh.exec('echo foo > file2')
  // run(command)
}

test('git diff --quiet')
test('git diff --quiet --staged')
test('git diff --quiet HEAD')
test('git diff-index --quiet HEAD --')
test('git status --porcelain')  
test('git status -suno')
