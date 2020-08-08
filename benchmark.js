const path = require('path')
const fs = require('fs')
const assert = require('assert')
const _ = require('lodash')
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
  'git status --short --untracked-files=no'
]

function exec(command) {
  sh.exec(command, { silent: true })
}

global.sh = sh
global.exec = exec

function setup() {
  console.log(`repo: ${repoPath}`)
  console.log(`modifying existing file: ${existingFilePath}`)
  console.log(`creating new file: ${newFilePath}`)
  exec(`touch ${newFilePath}`)
  exec(`echo foobar > ${existingFilePath}`)
}

function teardown() {
  console.log('cleaning up repo...')
  exec('git reset --hard HEAD && git clean -f')
}

function createSuite() {
  const suite = new Benchmark.Suite;
  for (let command of commands) {
    const fn = new Function(`
      try {
        exec("${command}")
      } catch(e) {
        console.log(e)
      }
    `)
    suite.add(command, fn, {
      minSamples: 10
    })
  }
  return suite
}


const suite = createSuite()

setup()

suite
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    const results = this.map(result => {
      return {
        name: result.name,
        hz: result.hz,
        'ops/sec': result.hz.toFixed(2),
        error: `±${result.stats.rme.toFixed(2)}% (${(result.hz * (1 - result.stats.rme / 100)).toFixed(2)}, ${(result.hz * (1 + result.stats.rme / 100)).toFixed(2)})`,
        mean: `${result.stats.mean.toFixed(2)}s`,
        'sample count': result.stats.sample.length
      }
    })
    console.table(_.orderBy(results, 'hz', 'desc'), ['name', 'ops/sec', 'error', 'mean', 'sample count'])
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: false })

console

teardown()
