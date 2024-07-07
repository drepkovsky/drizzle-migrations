import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/cli-entry.ts', 'src/index.ts'],

  outDir: 'dist',
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: false,
  outExtension: (ctx) => {
    if (ctx.format === 'cjs') {
      return { dts: '.d.ts', js: '.cjs' }
    }
    if (ctx.format === 'esm') {
      return { dts: '.d.mts', js: '.mjs' }
    }
    return { dts: '.d.ts', js: '.js' }
  },
  // noExternal: ['commander'],
  clean: true,
  minify: !options.watch,
  dts: {
    entry: 'src/index.ts',
  },
}))
