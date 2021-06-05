import typescript from 'rollup-plugin-typescript2'
import ts from 'typescript'
import del from 'rollup-plugin-delete'
import { terser } from "rollup-plugin-terser";
import pkg from './package.json'
import iconDefinitionsResolver from './scripts/icon-definitions-resolver';

export default {
  input: 'lib/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.browser,
      format: 'cjs',
      plugins: [terser()],
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  plugins: [
    del({
      targets: 'dist/*',
      runOnce: true,
    }),
    typescript({
      typescript: ts
    }),
    iconDefinitionsResolver()
  ],
}