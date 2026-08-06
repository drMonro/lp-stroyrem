/* eslint-disable no-console */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import glob from 'fast-glob';
import nunjucks from 'nunjucks';
import sharp from 'sharp';
import { optimize } from 'svgo';

import generateProductsData from '../src/js/utils/generateProductsData.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');
const templatesDir = path.join(srcDir, 'templates');
const pagesDir = path.join(templatesDir, 'pages');
const imagesDir = path.join(srcDir, 'media', 'images');
const svgDir = path.join(srcDir, 'media', 'svg');

const rootStaticFiles = ['.env', '.htaccess', 'robots.txt'];
const sourceStaticFiles = ['manifest.json', 'mail.php'];

const toPosix = (value) => value.split(path.sep).join('/');

const escapeXml = (value) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll('\'', '&apos;');

const copyFile = async(source, destination) => {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
};

const copyDirectory = async(source, destination) => {
    try {
        await fs.cp(source, destination, { recursive: true, force: true });
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
};

export const cleanBuild = () => fs.rm(buildDir, { recursive: true, force: true });

export const copyStaticAssets = async() => {
    await Promise.all([
        ...rootStaticFiles.map((file) => copyFile(path.join(rootDir, file), path.join(buildDir, file))),
        ...sourceStaticFiles.map((file) => copyFile(path.join(srcDir, file), path.join(buildDir, file))),
        copyDirectory(path.join(srcDir, 'fonts'), path.join(buildDir, 'fonts')),
        copyDirectory(path.join(rootDir, 'vendor'), path.join(buildDir, 'vendor')),
    ]);
};

export const buildImages = async() => {
    const files = await glob('**/*.{jpg,jpeg,png}', {
        absolute: true,
        cwd: imagesDir,
    });

    await Promise.all(files.map(async(file) => {
        const relativePath = path.relative(imagesDir, file);
        const outputPath = path.join(buildDir, 'media', 'images', relativePath);
        const outputDir = path.dirname(outputPath);
        const extension = path.extname(file).toLowerCase();
        const baseName = path.basename(outputPath, extension);
        const buffer = await fs.readFile(file);
        const metadata = await sharp(buffer).metadata();

        await fs.mkdir(outputDir, { recursive: true });

        const encodeOriginal = (pipeline) => {
            if (extension === '.jpg' || extension === '.jpeg') {
                return pipeline.jpeg({ quality: 75, progressive: true });
            }

            return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
        };

        if (metadata.width > 768) {
            await encodeOriginal(sharp(buffer).resize({ width: 768 })).toFile(outputPath);
            await sharp(buffer)
                .resize({ width: 768 })
                .webp({ quality: 75 })
                .toFile(outputPath.replace(extension, '.webp'));

            const desktopPath = path.join(outputDir, `${baseName}-desktop${extension}`);
            await encodeOriginal(sharp(buffer)).toFile(desktopPath);
            await sharp(buffer)
                .webp({ quality: 75 })
                .toFile(desktopPath.replace(extension, '.webp'));
            return;
        }

        await encodeOriginal(sharp(buffer)).toFile(outputPath);
        await sharp(buffer)
            .webp({ quality: 75 })
            .toFile(outputPath.replace(extension, '.webp'));
    }));
};

const svgToSymbol = (source, id, filePath) => {
    const optimized = optimize(source, {
        path: filePath,
        plugins: [
            {
                name: 'preset-default',
                params: {
                    overrides: {
                        cleanupIds: false,
                    },
                },
            },
            {
                name: 'removeViewBox',
                active: false,
            },
            'removeXMLNS',
        ],
    }).data;
    const match = optimized.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/i);

    if (!match) throw new Error(`Cannot create an SVG symbol from ${filePath}`);

    const attributes = match[1]
        .replace(/\s(?:width|height)=(['"])[\s\S]*?\1/gi, '')
        .trim();
    const prefix = attributes ? ` ${attributes}` : '';

    return `<symbol${prefix} id="${id}">${match[2]}</symbol>`;
};

export const buildSvgSprite = async() => {
    const files = await glob('**/*.svg', {
        absolute: true,
        cwd: svgDir,
    });
    const symbols = await Promise.all(files.sort().map(async(file) => {
        const source = await fs.readFile(file, 'utf8');
        return svgToSymbol(source, path.basename(file, '.svg'), file);
    }));
    const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`;
    const destination = path.join(buildDir, 'media', 'sprite', 'sprite.svg');

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, sprite, 'utf8');
};

const loadTemplateData = async(isProduction) => {
    dotenv.config({ path: path.join(rootDir, '.env'), override: true });

    if (isProduction) {
        return generateProductsData();
    }

    const mock = await fs.readFile(path.join(srcDir, 'data', 'products-mock.json'), 'utf8');
    return JSON.parse(mock);
};

export const renderTemplates = async({ isProduction }) => {
    const productsSwiperData = await loadTemplateData(isProduction);
    const files = await glob('**/*.njk', {
        absolute: true,
        cwd: pagesDir,
    });
    const environment = nunjucks.configure(templatesDir, {
        autoescape: false,
        noCache: true,
    });

    await Promise.all(files.map(async(file) => {
        const templateName = toPosix(path.relative(templatesDir, file));
        const outputName = path.relative(pagesDir, file).replace(/\.njk$/i, '.html');
        const html = environment.render(templateName, {
            hcaptchaSiteKey: process.env.HCAPTCHA_SITEKEY || '',
            isDev: !isProduction,
            productsSwiperData,
        });
        const destination = path.join(buildDir, outputName);

        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, html, 'utf8');
    }));
};

export const generateSitemap = async() => {
    dotenv.config({ path: path.join(rootDir, '.env'), override: true });

    const siteUrl = (process.env.SITE_URL || 'https://default-domain.com').replace(/\/$/, '');
    const pages = await glob('**/*.html', { cwd: buildDir });
    const urls = pages.sort().map((file) => {
        const normalized = toPosix(file);
        const route = normalized === 'index.html'
            ? '/'
            : `/${normalized.replace(/index\.html$/i, '').replace(/\.html$/i, '')}`;

        return `  <url><loc>${escapeXml(`${siteUrl}${route}`)}</loc></url>`;
    });
    const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        '</urlset>',
        '',
    ].join('\n');

    await fs.writeFile(path.join(buildDir, 'sitemap.xml'), sitemap, 'utf8');
};

export const buildSiteAssets = async({ clean = false, isProduction = false } = {}) => {
    if (clean) await cleanBuild();

    await Promise.all([
        buildImages(),
        buildSvgSprite(),
        copyStaticAssets(),
        renderTemplates({ isProduction }),
    ]);
    await generateSitemap();
};

const createDebouncedRunner = (run, delay = 100) => {
    let timer;
    let pending = Promise.resolve();

    return () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            pending = pending.then(run).catch((error) => console.error(error));
        }, delay);
    };
};

const startSourceWatcher = ({ onChange }) => {
    const watchers = [];
    const watchDirectory = (directory, handler) => {
        const watcher = watch(directory, { recursive: true }, handler);
        watchers.push(watcher);
    };

    watchDirectory(templatesDir, createDebouncedRunner(async() => {
        await renderTemplates({ isProduction: false });
        await generateSitemap();
        onChange();
    }));
    watchDirectory(imagesDir, createDebouncedRunner(async() => {
        await buildImages();
        onChange();
    }));
    watchDirectory(svgDir, createDebouncedRunner(async() => {
        await buildSvgSprite();
        onChange();
    }));
    watchDirectory(path.join(srcDir, 'data'), createDebouncedRunner(async() => {
        await renderTemplates({ isProduction: false });
        await generateSitemap();
        onChange();
    }));
    watchDirectory(path.join(srcDir, 'fonts'), createDebouncedRunner(async() => {
        await copyDirectory(path.join(srcDir, 'fonts'), path.join(buildDir, 'fonts'));
        onChange();
    }));
    watchDirectory(path.join(rootDir, 'vendor'), createDebouncedRunner(async() => {
        await copyDirectory(path.join(rootDir, 'vendor'), path.join(buildDir, 'vendor'));
        onChange();
    }));

    for (const file of rootStaticFiles) {
        const source = path.join(rootDir, file);
        const handler = createDebouncedRunner(async() => {
            await copyFile(source, path.join(buildDir, file));

            if (file === '.env') {
                await renderTemplates({ isProduction: false });
                await generateSitemap();
            }

            onChange();
        });
        watchers.push(watch(source, handler));
    }

    for (const file of sourceStaticFiles) {
        const source = path.join(srcDir, file);
        const handler = createDebouncedRunner(async() => {
            await copyFile(source, path.join(buildDir, file));
            onChange();
        });
        watchers.push(watch(source, handler));
    }

    return () => watchers.forEach((watcher) => watcher.close());
};

const startPhpServer = () => {
    const child = spawn('php', ['-S', 'localhost:3000', '-t', buildDir], {
        cwd: rootDir,
        stdio: ['ignore', 'inherit', 'inherit'],
        windowsHide: true,
    });

    child.on('error', (error) => {
        console.error(`PHP dev server failed to start: ${error.message}`);
    });

    return () => child.kill();
};

export const pluginSiteBuild = ({ isProduction }) => ({
    name: 'stroyrem:site-build',
    setup(api) {
        let devServer;
        let disposeWatcher;
        let stopPhpServer;

        api.onBeforeBuild(async({ isFirstCompile }) => {
            if (isFirstCompile) {
                await buildSiteAssets({ clean: true, isProduction });
            }
        });

        api.onBeforeDevCompile(async({ isFirstCompile }) => {
            if (isFirstCompile) {
                await buildSiteAssets({ clean: true, isProduction: false });
            }
        });

        api.onBeforeStartDevServer(({ server }) => {
            devServer = server;
        });

        api.onAfterStartDevServer(() => {
            stopPhpServer = startPhpServer();
            disposeWatcher = startSourceWatcher({
                onChange: () => devServer.sockWrite('full-reload'),
            });
        });

        api.onCloseDevServer(() => {
            disposeWatcher?.();
            stopPhpServer?.();
        });
    },
});

const runCli = async() => {
    const command = process.argv[2];

    if (command === 'clean') {
        await cleanBuild();
        return;
    }

    if (command === 'mock-data') {
        await generateProductsData(true);
        return;
    }

    throw new Error(`Unknown site-build command: ${command || '(missing)'}`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runCli().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
