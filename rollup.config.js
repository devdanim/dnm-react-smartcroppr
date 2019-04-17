import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const moduleName = 'SmartCroppr';
const distName = 'dnm-react-smartcroppr';

const rollupConfig = {
    input: 'src/index.js',
    output: {
        file: `dist/${distName}`,
        format: 'umd',
        name: moduleName,
        globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'prop-types': 'PropTypes',
        }
    },
    external: ['react', 'react-dom', 'prop-types'],
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        }),
        commonjs(),
        postcss({
            extensions: ['.css']
        })
    ]
};

export default rollupConfig;