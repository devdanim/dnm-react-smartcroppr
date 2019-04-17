import rollupConfig from '../rollup.config';
import { terser } from "rollup-plugin-terser";

rollupConfig.forEach(config => {
    config.output.file += '.min.js';
    config.plugins.push(terser());
});

export default rollupConfig;