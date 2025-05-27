import gulp from 'gulp';
import svgSprite from 'gulp-svg-sprite';
import postcss from 'gulp-postcss';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import browserslist from 'browserslist';
import postcssSimpleVars from 'postcss-simple-vars';
import browserSync from 'browser-sync';
import gulpEsbuildProd, { createGulpEsbuild } from 'gulp-esbuild';
import rename from 'gulp-rename';
import * as lightningcss from 'lightningcss';
import imagemin, { svgo } from 'gulp-imagemin';
import sharp from 'sharp';
import glob from 'fast-glob';
import plumber from 'gulp-plumber';
import { deleteAsync as del } from 'del';
import path from 'path';
import fs from 'fs/promises';
import nunjucksRender from 'gulp-nunjucks-render';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();
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
    CSSDirSrc: `${srcDir}/css`,
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
    base: [
      `${srcDir}/manifest.json`,
      `${srcDir}/mail.php`,
      '.env',
      '.htaccess',
      'robots.txt',
    ],
    vendor: `vendor/**/*`,
    fonts: `${srcDir}/fonts/**/*`,
  },
};

// Helper Functions
const handleError = (err) => {
  console.error(err);
  this.emit('end');
};

// Clean Task
const clean = () => del(buildDir);

// Images Optimization Task
const images = async () => {
  const files = await glob(paths.images.src);

  await Promise.all(
    files.map(async (file) => {
      const buffer = await fs.readFile(file);
      const relativePath = path.relative(path.join(srcDir, imagesDir), file);
      const outputPath = path.join(paths.images.buildDir, relativePath);
      const outputDir = path.dirname(outputPath);

      await fs.mkdir(outputDir, { recursive: true });

      const ext = path.extname(file).toLowerCase();

      let image = sharp(buffer);

      if (ext === '.jpg' || ext === '.jpeg') {
        image = image.jpeg({ quality: 75, progressive: true });
      } else if (ext === '.png') {
        image = image.png({ compressionLevel: 9, adaptiveFiltering: true });
      }

      // Сохраняем оптимизированное оригинальное изображение
      await image.toFile(outputPath);

      // Создаём webp рядом с ним
      const webpPath = outputPath.replace(ext, '.webp');
      await sharp(buffer).webp({ quality: 75 }).toFile(webpPath);
    }),
  );

  browserSync.reload();
};

// svgSprite configuration
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
      ]),
    )
    .pipe(
      svgSprite({
        mode: {
          symbol: {
            render: {
              css: false,
              scss: false,
            },
            dest: paths.svg.spriteDir,
            prefix: '.svg--%s',
            sprite: spriteFileName,
            example: true,
          },
        },
      }),
    )
    .pipe(gulp.dest(buildDir))
    .on('end', () => browserSync.reload());

// Styles Task
const styles = () =>
  gulp
    .src(paths.styles.postCSSMainFile)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(
      postcss([
        postcssImport(),
        postcssSimpleVars(),
        postcssPresetEnv({
          stage: 1,
          features: {
            'nesting-rules': true,
          },
        }),
      ]),
    )
    .pipe(rename({ extname: '.css' }))
    .pipe(gulp.dest(paths.styles.CSSDirBuild))
    .on('end', async () => {
      try {
        const inputCss = await fs.readFile(paths.styles.CSSMainFile, 'utf-8');

        const minifiedCSS = lightningcss.transform({
          filename: `${mainStylesFilesName}.css`,
          code: Buffer.from(inputCss),
          minify: true,
          targets: lightningcss.browserslistToTargets(browserslist()),
        }).code;

        // Создаем директорию, если её нет
        await fs.mkdir(paths.styles.CSSDirBuild, { recursive: true });

        // Записываем минифицированный css
        await fs.writeFile(
          `${paths.styles.CSSDirBuild}/${mainStylesFilesName}.min.css`,
          minifiedCSS,
        );

        browserSync.reload();
      } catch (err) {
        console.error('Ошибка в styles task:', err);
      }
    });

const createIndexJSTask = (esbuildInstance, shouldReload = false) => {
  return () =>
    gulp
      .src(paths.js.commonFile)
      .pipe(
        esbuildInstance({
          entryPoints: [paths.js.commonFile],
          bundle: true,
          minify: true,
          outfile: 'scripts.min.js',
          target: 'es2015',
          loader: { '.js': 'js' },
        }),
      )
      .pipe(gulp.dest(paths.js.buildSrc))
      .on('end', () => {
        if (shouldReload) browserSync.reload();
      });
};

const wrapTask = (name, taskFn) => {
  const wrapped = (cb) => {
    const task = taskFn();
    return typeof task === 'function' ? task(cb) : task;
  };
  Object.defineProperty(wrapped, 'name', { value: name });
  return wrapped;
};

const indexJSDev = createIndexJSTask(
  createGulpEsbuild({ incremental: true }),
  true,
);
const indexJSBuild = createIndexJSTask(gulpEsbuildProd);

const indexJSDevTask = wrapTask('indexJSDevTask', indexJSDev);
const indexJSBuildTask = wrapTask('indexJSBuildTask', indexJSBuild);

// Templates Task (Nunjucks Rendering)
const nunjucks = () =>
  gulp
    .src(paths.templates.pagesSrc)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(
      nunjucksRender({
        path: paths.templates.layoutsSrc,
        data: {
          hcaptchaSiteKey: process.env.HCAPTCHA_SITEKEY || '',
        },
      }),
    )
    .pipe(gulp.dest(buildDir))
    .on('end', () => browserSync.reload());

// Serve Task with BrowserSync
const serve = () => {
  browserSync.init({
    proxy: 'http://localhost:3000', // ← проксируем PHP-сервер
    notify: false,
    open: false,
    port: 3001, // browserSync будет доступен на другом порту
  });
};

const startPHPServer = (cb) => {
  if (phpServer) phpServer.kill(); // Если уже запущен — перезапускаем

  phpServer = spawn('php', ['-S', 'localhost:3000', '-t', buildDir], {
    stdio: ['ignore', 'ignore', 'ignore'], // отключаем все выводы
    shell: true,
  });

  process.on('exit', () => phpServer && phpServer.kill());
  process.on('SIGTERM', () => phpServer && phpServer.kill());
  process.on('SIGINT', () => phpServer && phpServer.kill());

  cb();
};

// Watch Task
const watchFiles = () => {
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.svg.src, svg);
  gulp.watch(paths.styles.postCSSFiles, styles);
  gulp.watch(paths.js.modules, indexJSDevTask);
  gulp.watch(paths.templates.src, nunjucks);
};

// Build Tasks
const buildFonts = () =>
  gulp
    .src(paths.build.fonts, { encoding: false })
    .pipe(gulp.dest(`${buildDir}/fonts`));

const buildBase = () => gulp.src(paths.build.base).pipe(gulp.dest(buildDir));

const copyVendor = () =>
  gulp.src(paths.build.vendor).pipe(gulp.dest(`${buildDir}/vendor`));

// Final Build Task
const build = gulp.series(
  clean,
  images,
  svg,
  styles,
  indexJSBuildTask,
  nunjucks,
  buildBase,
  buildFonts,
  copyVendor,
);

// Development Task
const dev = gulp.parallel(startPHPServer, serve, watchFiles);

export { clean, styles, images, svg, nunjucks, build };

export default gulp.series(build, dev);
