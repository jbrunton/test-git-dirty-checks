const path = require('path')
const fs = require('fs')
const assert = require('assert')
const sh = require('shelljs')
const Benchmark = require('benchmark');

function failWith(message) {
  console.log(message)
  process.exit(1)
}

if (process.argv.length != 5) {
  failWith('Usage: node benchmark.js path/to/repo existing-filename new-filename')
}

const repoPath = path.isAbsolute(process.argv[2]) ? process.argv[2] : path.join(process.cwd(), process.argv[2])
const existingFilePath = path.join(repoPath, process.argv[3])
const newFilePath = path.join(repoPath, process.argv[4])

console.log(`repoPath: ${repoPath}`)
console.log(`existingFilePath:${existingFilePath}`)
console.log(`newFilePath: ${newFilePath}`)

if (!fs.existsSync(repoPath)) {
  failWith(`${repoPath} does not exist`)
}

if (!fs.statSync(repoPath).isDirectory) {
  failWith(`${repoPath} is not a directory`)
}

if (!fs.existsSync(path.join(repoPath, '.git'))) {
  failWith(`${repoPath} is not a git directory`)
}

if (!fs.existsSync(existingFilePath)) {
  failWith(`${existingFilePath} does not exist`)
}

if (fs.existsSync(newFilePath)) {
  failWith(`${newFilePath} should not exist`)
}

process.chdir(repoPath)

if (sh.exec('git status --porcelain').stdout != '') {
  failWith(`repo is dirty, aborting`)
}

const commands = [
  'git diff --quiet HEAD',
  'git update-index -q --refresh && git diff-index --quiet HEAD --',
  'git status --porcelain --untracked-files=no',
  'git status -suno'
]

const suite = new Benchmark.Suite;

for (let command of commands) {
  suite.add(command, function() {
    console.log(`Starting test for "${command}"`)
    sh.exec(`touch ${newFilePath}`)
    sh.exec(`echo foobar > ${existingFilePath}`)
    //console.time(command)
    sh.exec(command)
    //console.timeLog(command)
    sh.exec(`git reset --hard HEAD && git clean -f`)
    //console.log()  
  })
}

suite
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.table(this.map(result => {
      return {
        name: result.name,
        mean: result.stats.mean,
        variance: result.stats.variance
      }
    }))
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: false })
