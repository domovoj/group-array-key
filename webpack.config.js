module.exports = {
    entry: {
        'unflatten.browser': './unflatten.browser'
    },
    output: {
        library: 'unflatten',
        path: __dirname,
        filename: '[name].js'
    }
};