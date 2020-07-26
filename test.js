const sh = require('shelljs')

function run(command) {
  console.log(`running: "${command}"`)
  const result = sh.exec(command)
  console.log(`  code: ${result.code}`)
  console.log(`  stdout: ${result.stdout}`)
  console.log(`  stdout: ${result.stderr}`)
}

run('git diff --quiet')

