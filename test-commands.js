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

const expectedFailures = ['staged change', 'unstaged change']
const candidateCommands = []

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
    const [scenarioName, run] = scenario;
    const output = run()
    const result = {
      scenario: scenarioName
    };
    if (Array.isArray(output)) {
      if (output.every(x => x.code == 1)) {
        result.code = 'always 1'
        result.failure = true
      } else if (output.every(x => x.code == 0)) {
        result.code = 'always 0'
        result.failure = false
      } else {
        result.code = '<various>'
        result.codes = {
          0: output.filter(x => x.code == 0).length,
          1: output.filter(x => x.code == 1).length
        }
        result.failure = '<nondeterministic>'
      }
      if (output.every(x => x.stdout == '')) {
        result.stdoutEmpty = 'always true'
      } else if (output.every(x => x.stdout != '')) {
        result.stdoutEmpty = 'always false'
      } else {
        console.log('unexpected output')
        process.exit(1)
      }
    } else {
      result.code = output.code
      result.stdoutEmpty = output.stdout == ''
      result.failure = result.code == 1 || result.stdoutEmpty == false
    }
    result.expectedFailure = expectedFailures.includes(scenarioName)
    return result
  })

  console.table(results, ['scenario', 'stdoutEmpty', 'code', 'codes', 'expectedFailure', 'failure'])

  const candidateCommand = results.every(result => result.expectedFailure == result.failure)
  if (candidateCommand) {
    console.log(`"${command}" is a candidate command`)
    candidateCommands.push(command)
  } else {
    console.log(`"${command}" is NOT a candidate command`)
  }
}

test('git diff --quiet')
test('git diff --quiet --staged')
test('git diff --quiet HEAD')
test('git diff-index --quiet HEAD --')
test('git update-index -q && git diff-index --quiet HEAD --')
test('git update-index -q --refresh && git diff-index --quiet HEAD --')
test('git status --porcelain') 
test('git status --porcelain --untracked-files=no')  
test('git status -suno')

console.log('\ncandidate commands: \n  ' + candidateCommands.join("\n  "))
