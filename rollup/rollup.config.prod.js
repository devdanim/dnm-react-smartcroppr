import rollupConfig from '../rollup.config';
import {terser} from "rollup-plugin-terser";

rollupConfig.output.file += '.min.js';
rollupConfig.plugins.push(terser());

export default rollupConfig;