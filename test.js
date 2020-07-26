const sh = require('shelljs')
const path = require('path')
const fs = require('fs')
const assert = require('assert')

function run(command) {
  console.log(`running: "${command}"`)
  const result = sh.exec(command)
  console.log(`  code: ${result.code}`)
  console.log(`  stdout: ${result.stdout}`)
  console.log(`  stdout: ${result.stderr}`)
}

function failWith(message) {
  console.log(message)
  process.exit(1)
}

if (process.argv.length != 4) {
  failWith('Usage: node test.js path/to/repo file')
}

const repoPath = process.argv[2]
const filePath = path.join(repoPath, process.argv[3])

if (!fs.existsSync(repoPath)) {
  failWith(`Directory does not exist: ${repoPath}`)
}

if (!fs.lstatSync(repoPath).isDirectory()) {
  failWith(`${repoPath} is not a directory`)
}

if (!fs.existsSync(path.join(repoPath, ".git"))) {
  failWith(`${repoPath} is not a git repository`)
}

if (!fs.existsSync(filePath)) {
  failWith(`File does not exist: ${filePath}`)
}

if (sh.exec('git status --porcelain').stdout != "") {
  failWith(`${repoPath} is not a clean repo, aborting`)
}

run('git diff --quiet')

