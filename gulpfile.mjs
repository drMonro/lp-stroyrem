import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import svgSprite from 'gulp-svg-sprite';
import * as sass from 'sass';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import * as lightningcss from 'lightningcss';
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin';
import autoprefixer from 'gulp-autoprefixer';
import plumber from 'gulp-plumber';
import { deleteAsync as del } from 'del';
import fs from 'node:fs';

const { series, parallel, src, dest, watch } = gulp;
const sassWithCompiler = gulpSass(sass);

const buildPath = 'build/';

const appPath = 'app';
const jsPath = 'app/js';
const jsIndexFile = 'index.min.js';
const paths = {
  pictures: {
    src: 'app/media/images/**/*',
    dest: 'dist/media/images',
  },
  favicons: {
    src: 'app/media/favicons/**/*',
    dest: 'dist/media/favicons',
  },
  svg: {
    src: 'app/media/svg/**/*',
    // dest: 'dist/img',
  },
  js: {
    common: `${jsPath}/common.js`,
    libs: {
      file: 'libs.js',
      path: `${jsPath}/libs.js`,
      sources: [
        // 'app/libs/fotorama/fotorama.js',
        // 'app/libs/selectize/js/standalone/selectize.min.js',
        'node_modules/mmenu-light/dist/mmenu-light.js',
        'node_modules/swiper/swiper.min.js',
      ],
    },
    dest: jsPath,
  },
  styles: {
    // src: 'app/sass/**/*.sass',
    mainSASS: 'app/sass/main.sass',
    dest: 'app/css',
    css: 'app/css/main.min.css',
  },
  build: {
    // dest: 'dist',
    // base: ['app/*.html'],
    // base: ['app/*.html', 'app/.htaccess'],
    // css: ['app/css/main.min.css'],
    // js: [`${jsPath}/${jsIndexFile}`],
    // fonts: ['app/fonts/**/*'],
    // svg: 'app/media/sprite/sprite.svg',
  },
};

// Helper Functions
const handleError = (err) => {
  console.error(err);
  this.emit('end');
};

// Clean Task
const clean = () => del(paths.build.dest);

// Images Optimization Task
const imageminConfigForRaster = [
  gifsicle({ interlaced: true }),
  mozjpeg({ quality: 75, progressive: true }),
  optipng({ optimizationLevel: 5 }),
];

const pictures = () =>
  src(paths.pictures.src)
    .pipe(imagemin(imageminConfigForRaster))
    .pipe(dest(paths.pictures.dest))
    .pipe(browserSync.stream());

const favicons = () =>
  src(paths.favicons.src)
    .pipe(imagemin(imageminConfigForRaster))
    .pipe(dest(paths.favicons.dest))
    .on('end', () => browserSync.reload());

const images = series(pictures, favicons);

// svgSprite configuration
const svg = () =>
  src(paths.svg.src)
    .pipe(
      imagemin([
        svgo({
          plugins: [
            { name: 'removeXMLNS', active: true }, // Удаляем xmlns, если не требуется
            { name: 'removeViewBox', active: false }, // Если нужно оставить
            { name: 'removeComments', active: true }, // Удаляем комментарии
            { name: 'cleanupIDs', active: false }, // Для избежания конфликтов ID
          ],
        }),
      ]),
    )
    .pipe(
      svgSprite({
        mode: {
          symbol: {
            render: {
              css: false, // Не генерируем CSS
              scss: false, // Не генерируем SCSS
            },
            dest: 'media/sprite', // Папка назначения
            prefix: '.svg--%s', // Префикс для каждой иконки
            sprite: 'sprite.svg', // Имя итогового спрайта
            example: true, // Генерируем примерную страницу
          },
        },
      }),
    )
    .pipe(dest(appPath)) // Путь, куда сохраняем итоговые файлы
    .pipe(dest(paths.build.dest)) // Путь, куда сохраняем итоговые файлы
    .on('end', () => browserSync.reload());

// Styles Task
const styles = (done) => {
  gulp
    .src(paths.styles.mainSASS)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sassWithCompiler.sync().on('error', sassWithCompiler.logError))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['> 1%', 'last 2 versions'],
        cascade: false,
      }),
    )
    .pipe(gulp.dest(paths.styles.dest))
    .on('end', () => {
      const inputCss = fs.readFileSync(
        `${paths.styles.dest}/main.css`,
        'utf-8',
      );
      const outputCss = lightningcss.transform({
        filename: 'main.css',
        code: Buffer.from(inputCss),
        minify: true,
        targets: lightningcss.browserslistToTargets([
          '> 1%',
          'last 2 versions',
        ]),
      }).code;
      fs.writeFileSync(`${paths.styles.dest}/main.min.css`, outputCss);
      browserSync.reload();
      fs.writeFileSync(`${paths.styles.dest}/main.min.css`, outputCss);

      // .pipe(dest(`${paths.build.dest}/css`)
      done();
    });
};

// JavaScript Tasks
const libsJS = () =>
  src(paths.js.libs.sources)
    .pipe(concat(paths.js.libs.file))
    .pipe(dest(paths.js.dest))
    .pipe(browserSync.stream());

const indexJS = () =>
  src([paths.js.libs.path, paths.js.common])
    .pipe(concat(jsIndexFile))
    .pipe(terser())
    .pipe(dest(paths.js.dest))
    .on('end', () => browserSync.reload());

// Serve Task with BrowserSync
const serve = () => {
  browserSync.init({
    server: appPath,
    notify: false,
    open: false,
  });
};

// Watch Task
const watchFiles = () => {
  watch([paths.pictures.src, paths.favicons.src], images);
  watch(paths.svg.src, svg);
  watch(paths.styles.src, styles);
  watch(paths.js.common, indexJS);
  watch('app/*.html').on('change', browserSync.reload);
};

// Build Tasks
const buildFiles = () => src(paths.build.base).pipe(dest(paths.build.dest));
// const buildCSS = () =>
//   src(paths.build.css).pipe(dest(`${paths.build.dest}/css`));
const buildJS = () => src(paths.build.js).pipe(dest(`${paths.build.dest}/js`));
const buildFonts = () =>
  src(paths.build.fonts).pipe(dest(`${paths.build.dest}/fonts`));

// Final Build Task
const build = series(
  clean,
  images,
  svg,
  styles,
  libsJS,
  indexJS,
  buildFiles,
  // buildCSS,
  buildJS,
  buildFonts,
);

// Development Task
const dev = parallel(serve, watchFiles);

export { clean, styles, libsJS, images, svg, build };

export default series(clean, build, dev);
