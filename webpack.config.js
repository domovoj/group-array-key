module.exports = {
    entry: {
        'unflat.browser': './unflat.browser'
    },
    output: {
        library: 'unflat',
        path: __dirname,
        filename: '[name].js'
    }
};