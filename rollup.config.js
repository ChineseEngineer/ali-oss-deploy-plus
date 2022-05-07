import json from '@rollup/plugin-json'
// import { terser } from 'rollup-plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import del from 'rollup-plugin-delete'


export default {
  input: 'src/main.js',
  output: [
    {
      file: 'lib/main.js',
      format: 'cjs',
    },
  ],
  plugins: [
    del({ targets: 'lib/*' }),
    json(),
    resolve(),
    babel({ babelHelpers: 'bundled' }),
    // terser(),
  ]
}
