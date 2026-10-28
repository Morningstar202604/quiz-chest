import { spawnSync } from 'node:child_process'

const steps = [
  ['typecheck', 'npx', ['tsc', '-b', '--pretty', 'false']],
  ['lint', 'npx', ['eslint', '.']],
  ['test', 'npx', ['vitest', 'run']],
  ['build', 'npm', ['run', 'build']],
]

let failed = false
for (const [name, cmd, args] of steps) {
  process.stdout.write(`\n=== ${name} ===\n`)
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true })
  if (result.status !== 0) {
    failed = true
    process.stdout.write(`\n${name} FAILED (exit ${result.status})\n`)
    break
  }
}
if (failed) process.exit(1)
process.stdout.write('\nAll checks passed.\n')
