import gulp from 'gulp';
import svgSprite from 'gulp-svg-sprite';
import postcss from 'gulp-postcss';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import browserslist from 'browserslist';
import postcssSimpleVars from 'postcss-simple-vars';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import * as lightningcss from 'lightningcss';
import imagemin, { mozjpeg, optipng, svgo } from 'gulp-imagemin';
import plumber from 'gulp-plumber';
import { deleteAsync as del } from 'del';
import fs from 'node:fs';
import nunjucksRender from 'gulp-nunjucks-render';

const srcDir = 'src';
const buildDir = 'build';

const imagesDir = 'media/images';
const mainStylesFilesName = 'main';
const spriteFileName = 'sprite.svg';
const jsDir = 'js';
const jsLibsFile = 'libs.js';
const jsIndexFile = 'scripts.js';
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
    dirSrc: `${srcDir}/${jsDir}`,
    buildSrc: `${buildDir}/${jsDir}`,
    libs: {
      sources: [
        // 'app/libs/fotorama/fotorama.js',
        'node_modules/mmenu-light/dist/mmenu-light.js',
        'node_modules/swiper/swiper.min.js',
      ],
      file: `${srcDir}/${jsDir}/${jsLibsFile}`,
    },
    commonFile: `${srcDir}/${jsDir}/common.js`,
  },
  templates: {
    src: `${srcDir}/${templatesDir}/**/*.njk`,
    pagesSrc: `${srcDir}/${templatesDir}/pages/**/*.njk`,
    layoutsSrc: `${srcDir}/${templatesDir}`,
  },
  build: {
    base: [`${srcDir}/manifest.json`, `${srcDir}/mail.php`],
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
const styles = () => {
  return gulp
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
};

// JavaScript Tasks
const libsJS = () =>
  gulp
    .src(paths.js.libs.sources)
    .pipe(concat(jsLibsFile))
    .pipe(gulp.dest(paths.js.dirSrc));

const indexJS = () =>
  gulp
    .src([paths.js.libs.file, paths.js.commonFile])
    .pipe(concat(`${jsIndexFile}`))
    .pipe(gulp.dest(paths.js.buildSrc))
    .pipe(rename({ suffix: '.min' }))
    .pipe(terser())
    .pipe(gulp.dest(paths.js.buildSrc))
    .on('end', () => browserSync.reload());

// Templates Task (Nunjucks Rendering)
const nunjucks = () =>
  gulp
    .src(paths.templates.pagesSrc)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(
      nunjucksRender({
        path: paths.templates.layoutsSrc,
      }),
    )
    .pipe(gulp.dest(buildDir))
    .on('end', () => browserSync.reload());

// Serve Task with BrowserSync
const serve = () => {
  browserSync.init({
    server: buildDir,
    notify: false,
    open: false,
    middleware: (req, res, next) => {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      next();
    },
  });
};

// Watch Task
const watchFiles = () => {
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.svg.src, svg);
  gulp.watch(paths.styles.postCSSFiles, styles);
  gulp.watch(paths.js.commonFile, indexJS);
  gulp.watch(paths.templates.src, nunjucks);
};

// Build Tasks
const buildFonts = () =>
  gulp
    .src(paths.build.fonts, { encoding: false })
    .pipe(gulp.dest(`${buildDir}/fonts`));

const buildBase = () => gulp.src(paths.build.base).pipe(gulp.dest(buildDir));

// Final Build Task
const build = gulp.series(
  clean,
  images,
  svg,
  styles,
  libsJS,
  indexJS,
  nunjucks,
  buildBase,
  buildFonts,
);

// Development Task
const dev = gulp.parallel(serve, watchFiles);

export { clean, styles, libsJS, indexJS, images, svg, nunjucks, build };

export default gulp.series(build, dev);
