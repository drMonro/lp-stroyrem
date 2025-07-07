/* eslint-disable no-console */
import gulp from 'gulp';
import plumber from 'gulp-plumber';
import svgSprite from 'gulp-svg-sprite';
import sitemap from 'gulp-sitemap';
import sourcemaps from 'gulp-sourcemaps';
import imagemin, { svgo } from 'gulp-imagemin';
import rename from 'gulp-rename';
import nunjucksRender from 'gulp-nunjucks-render';
import gulpPostcss from 'gulp-postcss';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import postcssSimpleVars from 'postcss-simple-vars';
import browserslist from 'browserslist';
import browserSync from 'browser-sync';
import esbuild from 'esbuild';
import * as lightningcss from 'lightningcss';
import sharp from 'sharp';
import glob from 'fast-glob';
import { deleteAsync as del } from 'del';
import generateProductsData from './src/js/utils/generateProductsData.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();
const isDev = process.env.NODE_ENV !== 'production';

let phpServer;

const srcDir = 'src';
const buildDir = 'build';

const imagesDir = 'media/images';
const mainStylesFilesName = 'main';
const spriteFileName = 'sprite.svg';
const jsDir = 'js';
const templatesDir = 'templates';

const paths = {
    images: {
        src: `${srcDir}/${imagesDir}/**/*.{jpg,jpeg,png}`,
        buildDir: `${buildDir}/${imagesDir}`,
    },
    svg: {
        src: `${srcDir}/media/svg/**/*.svg`,
        spriteDir: 'media/sprite',
    },
    styles: {
        postCSSMainFile: `${srcDir}/css/${mainStylesFilesName}.pcss`,
        postCSSFiles: `${srcDir}/css/**/*.pcss`,
        CSSDirBuild: `${buildDir}/css`,
        CSSMainFile: `${buildDir}/css/${mainStylesFilesName}.css`,
    },
    js: {
        buildSrc: `${buildDir}/${jsDir}`,
        commonFile: `${srcDir}/${jsDir}/common.js`,
        modules: `${srcDir}/${jsDir}/**/*.js`,
    },
    templates: {
        src: `${srcDir}/${templatesDir}/**/*.njk`,
        pagesSrc: `${srcDir}/${templatesDir}/pages/**/*.njk`,
        layoutsSrc: `${srcDir}/${templatesDir}`,
    },
    build: {
        base: [`${srcDir}/manifest.json`, `${srcDir}/mail.php`, '.env', '.htaccess', 'robots.txt'],
        vendor: `vendor/**/*`,
        fonts: `${srcDir}/fonts/**/*`,
    },
};

function handleError(err) {
    console.error(err.toString());
    this.emit?.('end');
}

const clean = () => del(buildDir);

// --- IMAGES ---
const images = async() => {
    const files = await glob(paths.images.src);

    await Promise.all(
        files.map(async(file) => {
            const buffer = await fs.readFile(file);
            const relativePath = path.relative(path.join(srcDir, imagesDir), file);
            const outputPath = path.join(paths.images.buildDir, relativePath);
            const outputDir = path.dirname(outputPath);
            const ext = path.extname(file).toLowerCase();
            const baseName = path.basename(outputPath, ext);

            await fs.mkdir(outputDir, { recursive: true });

            const originalImage = sharp(buffer);
            const metadata = await originalImage.metadata();

            const optimize = (img) => {
                if (ext === '.jpg' || ext === '.jpeg') {
                    return img.jpeg({ quality: 75, progressive: true });
                } else if (ext === '.png') {
                    return img.png({ compressionLevel: 9, adaptiveFiltering: true });
                }
                return img;
            };

            if (metadata.width > 768) {
                const resized = optimize(originalImage.clone().resize({ width: 768 }));
                await resized.toFile(outputPath);
                await resized.webp({ quality: 75 }).toFile(outputPath.replace(ext, '.webp'));

                const desktopPath = path.join(outputDir, `${baseName}-desktop${ext}`);
                await optimize(sharp(buffer)).toFile(desktopPath);
                await sharp(buffer)
                    .webp({ quality: 75 })
                    .toFile(desktopPath.replace(ext, '.webp'));
            } else {
                const optimized = optimize(originalImage);
                await optimized.toFile(outputPath);
                await optimized.webp({ quality: 75 }).toFile(outputPath.replace(ext, '.webp'));
            }
        })
    );

    if (isDev) browserSync.reload();
};

// --- SVG SPRITE ---
const svg = () =>
    gulp
        .src(paths.svg.src)
        .pipe(
            imagemin([
                svgo({
                    plugins: [
                        { name: 'removeXMLNS', active: true },
                        { name: 'removeViewBox', active: false },
                        { name: 'removeComments', active: true },
                        { name: 'cleanupIDs', active: false },
                    ],
                }),
            ])
        )
        .pipe(
            svgSprite({
                mode: {
                    symbol: {
                        sprite: spriteFileName,
                        dest: paths.svg.spriteDir,
                        prefix: '.svg--%s',
                        render: { css: false, scss: false },
                        example: false,
                    },
                },
            })
        )
        .pipe(gulp.dest(buildDir))
        .on('end', () => {
            if (isDev) browserSync.reload();
        });

// --- STYLES ---
const styles = async() => {
    const processors = [
        postcssImport(),
        postcssSimpleVars(),
        postcssPresetEnv({
            stage: 1,
            features: { 'nesting-rules': true },
        }),
    ];

    if (isDev) {
        return gulp
            .src(paths.styles.postCSSMainFile)
            .pipe(plumber({ errorHandler: handleError }))
            .pipe(sourcemaps.init())
            .pipe(gulpPostcss(processors))
            .pipe(rename({ basename: mainStylesFilesName, extname: '.css' }))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(paths.styles.CSSDirBuild))
            .pipe(browserSync.stream());
        // .on('end', () => browserSync.reload());
    } else {
        const cssInput = await fs.readFile(paths.styles.postCSSMainFile, 'utf8');
        const result = await postcss(processors).process(cssInput, {
            from: paths.styles.postCSSMainFile,
        });

        const { code } = lightningcss.transform({
            filename: `${mainStylesFilesName}.css`,
            code: Buffer.from(result.css),
            minify: true,
            targets: lightningcss.browserslistToTargets(browserslist()),
        });

        await fs.mkdir(paths.styles.CSSDirBuild, { recursive: true }); // <-- добавить
        await fs.writeFile(
        `${paths.styles.CSSDirBuild}/${mainStylesFilesName}.min.css`,
        code
        );
    }
};

// --- JS ---
const createIndexJSTask = (shouldReload = false) => async() => {
    const result = await esbuild.build({
        entryPoints: [paths.js.commonFile],
        bundle: true,
        minify: true,
        target: 'es2022',
        write: false,
        loader: { '.js': 'js', '.css': 'css' },
        outdir: 'out',
    });

    await Promise.all(
        result.outputFiles.map(async(file) => {
            if (file.path.endsWith('.js')) {
                await fs.mkdir(paths.js.buildSrc, { recursive: true });
                await fs.writeFile(path.join(paths.js.buildSrc, 'scripts.min.js'), file.contents);
            } else if (file.path.endsWith('.css')) {
                await fs.mkdir(path.join(buildDir, 'css'), { recursive: true });
                await fs.writeFile(path.join(buildDir, 'css', 'libs.min.css'), file.contents);
            }
        })
    );

    if (shouldReload && isDev) browserSync.reload();
};

const indexJSDevTask = () => createIndexJSTask(true)();
const indexJSBuildTask = () => createIndexJSTask(false)();

// --- TEMPLATES ---
const nunjucks = async() => {
    let productsSwiperData;
    try {
        if (isDev) {
            const jsonData = await fs.readFile('./src/data/products-mock.json', 'utf-8');
            productsSwiperData = JSON.parse(jsonData);
            console.log('✅ Using MOCK data');
        } else {
            productsSwiperData = await generateProductsData();
            console.log('✅ Using PROD data');
        }
    } catch (e) {
        throw new Error(`⚠️ Ошибка загрузки данных: ${e.message}`);
    }

    return gulp
        .src(paths.templates.pagesSrc)
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(
            nunjucksRender({
                path: paths.templates.layoutsSrc,
                data: {
                    isDev: isDev,
                    hcaptchaSiteKey: process.env.HCAPTCHA_SITEKEY || '',
                    productsSwiperData,
                },
            })
        )
        .pipe(gulp.dest(buildDir))
        .on('end', () => {
            if (isDev) browserSync.reload();
        });
};

// --- SERVER ---
const serve = () => {
    browserSync.init({
        proxy: 'http://localhost:3000',
        host: '192.168.0.2',
        notify: false,
        open: false,
        port: 3001,
    });
};

const startPHPServer = (cb) => {
    if (phpServer) phpServer.kill();

    phpServer = spawn('php', ['-S', 'localhost:3000', '-t', buildDir], {
        stdio: ['ignore', 'ignore', 'ignore'],
        shell: true,
    });

    process.on('exit', () => phpServer && phpServer.kill());
    process.on('SIGTERM', () => phpServer && phpServer.kill());
    process.on('SIGINT', () => phpServer && phpServer.kill());

    cb();
};

// --- MOCK DATA ---
const mockData = async() => {
    try {
        await generateProductsData(true);
        console.log('✅ Mock data created');
    } catch (e) {
        throw new Error(`⚠️ Ошибка создания данных: ${e.message}`);
    }
};

// --- WATCH ---
const watchFiles = () => {
    gulp.watch(paths.images.src, images);
    gulp.watch(paths.svg.src, svg);
    gulp.watch(paths.styles.postCSSFiles, styles);
    gulp.watch(paths.js.modules, indexJSDevTask);
    gulp.watch(paths.templates.src, nunjucks);
};

// --- BUILD HELPERS ---
const buildFonts = () => gulp.src(paths.build.fonts, { encoding: false }).pipe(gulp.dest(`${buildDir}/fonts`));
const buildBase = () => gulp.src(paths.build.base).pipe(gulp.dest(buildDir));
const copyVendor = () => gulp.src(paths.build.vendor).pipe(gulp.dest(`${buildDir}/vendor`));

const generateSitemap = () =>
    gulp
        .src(`${buildDir}/**/*.html`, { read: false })
        .pipe(sitemap({ siteUrl: process.env.SITE_URL || 'https://default-domain.com' }))
        .pipe(gulp.dest(buildDir));

// --- TASKS ---
const build = gulp.series(
    clean,
    images,
    svg,
    styles,
    indexJSBuildTask,
    nunjucks,
    generateSitemap,
    buildBase,
    buildFonts,
    copyVendor
);

const dev = gulp.series(
    build,
    gulp.parallel(startPHPServer, serve, watchFiles)
);

export { mockData, clean, styles, images, svg, build };

export default dev;
