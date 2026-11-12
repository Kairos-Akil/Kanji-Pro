// Raises the app version everywhere it's stored, in one go:
//   app.json           expo.version (shown to users) and expo.android.versionCode (+1; Android only
//                      installs an update whose versionCode is higher than the installed one)
//   package.json       version
//   package-lock.json  version (twice)
// Run with: npm run bump
import { readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { stdin, stdout } from 'node:process'

const FILES = ['app.json', 'package.json', 'package-lock.json']
const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
// Same format the files already use (2 spaces, trailing newline), so the git diff shows only the
// changed numbers.
const write = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n')

const parse = (version) => {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim())
    return match ? match.slice(1).map(Number) : null
}
// Negative if a < b, 0 if equal, positive if a > b.
const compareVersions = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

const app = read('app.json')
const current = app.expo.version
const currentParts = parse(current)
if (!currentParts) throw new Error(`Current version "${current}" in app.json isn't x.y.z`)
const [major, minor, patch] = currentParts
const versionCode = app.expo.android.versionCode

const options = {
    1: { label: 'patch (bug fixes)', version: `${major}.${minor}.${patch + 1}` },
    2: { label: 'minor (new features)', version: `${major}.${minor + 1}.0` },
    3: { label: 'major (big changes)', version: `${major + 1}.0.0` },
}

// Reads answers line by line. Unlike rl.question(), this also works when answers are piped in
// (e.g. `printf '2\ny\n' | npm run bump`), because lines arriving early aren't dropped.
const rl = createInterface({ input: stdin })
const lines = rl[Symbol.asyncIterator]()
const ask = async (question) => {
    stdout.write(question)
    const { value, done } = await lines.next()
    if (done) throw new Error('No answer given')
    return value.trim()
}

try {
    console.log(`Current version: ${current} (versionCode ${versionCode})\n`)
    for (const [key, { label, version }] of Object.entries(options)) {
        console.log(`  ${key}) ${version.padEnd(8)} ${label}`)
    }
    console.log('  4) type a version yourself\n')

    const choice = await ask('Choose 1-4: ')
    let next = options[choice]?.version
    if (choice === '4') next = await ask('New version (x.y.z): ')
    if (!next) throw new Error(`"${choice}" isn't one of the options`)

    const nextParts = parse(next)
    if (!nextParts) throw new Error(`"${next}" isn't in the form x.y.z (e.g. 1.3.0)`)
    if (compareVersions(nextParts, currentParts) <= 0) throw new Error(`${next} isn't higher than ${current}`)

    console.log(`\n  version      ${current} -> ${next}`)
    console.log(`  versionCode  ${versionCode} -> ${versionCode + 1}`)
    const confirm = (await ask('\nApply? (y/n): ')).toLowerCase()
    if (!['y', 'yes', 'j', 'ja'].includes(confirm)) {
        console.log('Nothing changed.')
        process.exit(0)
    }

    app.expo.version = next
    app.expo.android.versionCode = versionCode + 1
    write('app.json', app)

    const pkg = read('package.json')
    pkg.version = next
    write('package.json', pkg)

    const lock = read('package-lock.json')
    lock.version = next
    lock.packages[''].version = next
    write('package-lock.json', lock)

    console.log(`\nUpdated ${FILES.join(', ')} to ${next} (versionCode ${versionCode + 1}).`)
    console.log('Next: npm run build:dev (it regenerates android/ because app.json changed).')
} catch (err) {
    console.error(`\n${err.message}. Nothing changed.`)
    process.exitCode = 1
} finally {
    rl.close()
}
