import { defineConfig } from '@rsbuild/core';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import postcssSimpleVars from 'postcss-simple-vars';

import { pluginSiteBuild } from './scripts/site-build.mjs';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    plugins: [pluginSiteBuild({ isProduction: isProd })],

    source: {
        entry: {
            scripts: './src/rsbuild/app.js',
        },
    },

    tools: {
        htmlPlugin: false,

        bundlerChain: (chain, { CHAIN_ID }) => {
            chain.module.rule(CHAIN_ID.RULE.CSS).test(/\.(?:css|pcss)$/);
        },

        cssLoader: {
            url: {
                filter: (url) => {
                    return !url.startsWith('/media/');
                },
            },
        },

        postcss: (_, { addPlugins }) => {
            addPlugins([
                postcssImport(),
                postcssSimpleVars(),
                postcssPresetEnv({
                    stage: 1,
                    features: { 'nesting-rules': true },
                }),
            ]);
        },
    },

    splitChunks: false,

    output: {
        target: 'web',

        distPath: {
            root: 'build',
            js: 'js',
            css: 'css',
            image: 'media/assets',
            font: 'fonts',
            assets: 'assets',
        },

        filenameHash: false,

        filename: {
            js: isProd ? '[name].min.js' : '[name].js',
            css: isProd ? 'main.min.css' : 'main.css',
        },

        cleanDistPath: false,
        minify: isProd,
        sourceMap: isProd
            ? false
            : {
                js: 'source-map',
                css: true,
            },
    },

    dev: {
        writeToDisk: true,
    },

    server: {
        host: '192.168.0.2',
        port: 3001,
        open: false,
        publicDir: {
            name: 'build',
            copyOnBuild: false,
        },
        proxy: {
            '/mail.php': 'http://localhost:3000',
        },
    },
});
