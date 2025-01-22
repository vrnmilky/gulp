export default {
    mode: 'production',
    entry: {
        index: './src/js/index.js',
        // contacts: './src/js/contacts.js'
        // about: './src/js/about.js',
    },
    output: {
        filename: '[name].bundle.js',
    },
    resolve: {
        extensions: ['.js'],
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};
