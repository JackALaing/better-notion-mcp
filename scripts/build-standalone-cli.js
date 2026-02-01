import { chmod, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

async function build() {
  // Ensure dist directory exists
  await mkdir(join(projectRoot, 'dist'), { recursive: true })

  await esbuild.build({
    entryPoints: [join(projectRoot, 'src/cli/notion-cli.ts')],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: join(projectRoot, 'dist/notion-cli.mjs'),
    banner: {
      js: "#!/usr/bin/env node\nimport { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
    // Bundle everything except @notionhq/client (no MCP SDK!)
    external: ['@notionhq/client'],
  })

  // Make the output file executable
  await chmod(join(projectRoot, 'dist/notion-cli.mjs'), 0o755)

  console.log('Standalone CLI built: dist/notion-cli.mjs')
}

build().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
