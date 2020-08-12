import rollupConfig from '../rollup.config';

rollupConfig.forEach(config => {
    config.output.file += '.js';
});

export default rollupConfig;