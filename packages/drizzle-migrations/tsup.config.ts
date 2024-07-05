import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/cli-entry.ts', 'src/index.ts'],

  outDir: 'dist',
  format: ['cjs'],
  outExtension: (ctx) => {
    return { js: '.cjs', dts: '.d.ts' }
  },
  splitting: false,
  sourcemap: false,
  // noExternal: ['commander'],
  clean: true,
  minify: !options.watch,
  dts: {
    entry: 'src/index.ts',
  },
}))
