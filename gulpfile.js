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
import imagemin, { mozjpeg, optipng, svgo } from 'gulp-imagemin';
import plumber from 'gulp-plumber';
import { deleteAsync as del } from 'del';
import fs from 'node:fs';
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
const images = () =>
  gulp
    .src(paths.images.src, { encoding: false })
    .pipe(
      imagemin([
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
      ]),
    )
    .pipe(gulp.dest(paths.images.buildDir))
    .on('end', () => browserSync.stream());

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
    .on('end', () => {
      const inputCss = fs.readFileSync(paths.styles.CSSMainFile, 'utf-8');
      const minifiedCSS = lightningcss.transform({
        filename: `${mainStylesFilesName}.css`,
        code: Buffer.from(inputCss),
        minify: true,
        targets: lightningcss.browserslistToTargets(browserslist()),
      }).code;

      if (!fs.existsSync(paths.styles.CSSDirBuild)) {
        fs.mkdirSync(paths.styles.CSSDirBuild, { recursive: true });
      }

      fs.writeFileSync(
        `${paths.styles.CSSDirBuild}/${mainStylesFilesName}.min.css`,
        minifiedCSS,
      );

      browserSync.reload();
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
    stdio: 'inherit',
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
