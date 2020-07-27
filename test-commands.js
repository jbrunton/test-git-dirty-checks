const sh = require('shelljs')
const tmp = require('tmp')

function exec(command) {
  return sh.exec(command, { silent: true })
}

function initRepo() {
  exec('git init')
  exec('echo content1 > file1')
  exec('git add file1')
  exec('git commit -m "add file1" file1')
}

const expectedFailures = ['staged change', 'unstaged change']
const candidateCommands = []

function test(command) {
  console.log(`Starting test run for command: ${command}`)
  const tmpdir = tmp.dirSync()
  process.chdir(tmpdir.name);
  initRepo()

  const scenarios = [
    ['clean repo', function() {
      return exec(command)
    }],
    ['untracked file', function() {
      exec('echo content2 > file2')
      return exec(command)
    }],
    ['staged change', function() {
      exec('git add file2')
      return exec(command)
    }],
    ['commited file', function() {
      exec('git commit -m "add file2"')
      return exec(command)
    }],
    ['touch file', function() {
      return [...Array(10)].map(i => {
        exec('touch file2')
        return exec(command)
      })
    }],
    ['unstaged change', function() {
      exec('echo foo > file2')
      return exec(command)
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
        result.code = `<various> (${output.filter(x => x.code == 0).length} x 0, ${output.filter(x => x.code == 1).length} x 1)`
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

  console.table(results, ['scenario', 'stdoutEmpty', 'code', 'expectedFailure', 'failure'])

  const candidateCommand = results.every(result => result.expectedFailure == result.failure)
  if (candidateCommand) {
    console.log(`"${command}" is a candidate command\n`)
    candidateCommands.push(command)
  } else {
    console.log(`"${command}" is NOT a candidate command\n`)
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
test('git status --short --untracked-files=no')

console.log('\ncandidate commands: \n  ' + candidateCommands.join("\n  "))
