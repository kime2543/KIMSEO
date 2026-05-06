import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(scriptDir, '..')
const distDir = path.join(backendRoot, 'dist')
const distPackageJson = path.join(distDir, 'package.json')
const distNodeModules = path.join(distDir, 'node_modules')

if (!fs.existsSync(distPackageJson)) {
  console.warn(`Skipping dist dependency install because ${distPackageJson} does not exist.`)
  process.exit(0)
}

if (fs.existsSync(path.join(distNodeModules, 'next'))) {
  process.exit(0)
}

execSync('npm install --omit=dev --no-package-lock', {
  cwd: distDir,
  stdio: 'inherit',
})