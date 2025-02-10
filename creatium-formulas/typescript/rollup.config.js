import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

export default {
    input: 'formulas/Expression.ts',
    output: [{
        file: '../dist/formulas.js',
        format: 'es',
    }, {
        file: '../dist/formulas.iife.js',
        format: 'iife',
        name: 'crfx',
    }],
    onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        warn(warning)
    },
    plugins: [
        json(),
        typescript({
            compilerOptions: {
                module: "es2015",
                target: "es2015",
                sourceMap: false,
                moduleResolution: "node",
            }
        }),
    ],
};