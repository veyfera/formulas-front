import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser';

export default {
    input: 'editor.ts',
    output: [{
        file: '../dist/editor.js',
        format: 'es',
    }, {
        file: '../dist/editor.cjs.js',
        format: 'cjs',
    }, {
        file: '../dist/editor.iife.js',
        format: 'iife',
        name: 'iife',
        plugins: [terser()],
    }],
    onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        warn(warning)
    },
    plugins: [
        json(),
        typescript({
            compilerOptions: {
                target: "es2015",
                sourceMap: true
            },
            include: [
                "**/*",
                "../typescript/**/*",
            ]
        }),
    ],
};