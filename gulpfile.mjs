import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import del from 'del';
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin';
import cache from 'gulp-cache';
import autoprefixer from 'gulp-autoprefixer';
import plumber from 'gulp-plumber';

const { series, parallel, src, dest, watch } = gulp;

const sassWithCompiler = gulpSass(sass);

const paths = {
    scripts: {
        common: 'app/js/common.js',
        libs: [
            'app/libs/jquery/dist/jquery.min.js',
            'app/libs/mmenu/jquery.mmenu.all.js',
            'app/libs/owl.carousel/owl.carousel.min.js',
            'app/libs/fotorama/fotorama.js',
            'app/libs/selectize/js/standalone/selectize.min.js',
            'app/libs/equalHeights/equalheights.js',
            'app/js/common.min.js',
        ],
        dest: 'app/js',
    },
    styles: {
        src: 'app/sass/**/*.sass',
        dest: 'app/css',
    },
    images: {
        src: 'app/img/**/*',
        dest: 'dist/img',
    },
    build: {
        base: ['app/*.html', 'app/.htaccess'],
        css: ['app/css/main.min.css'],
        js: ['app/js/scripts.min.js'],
        fonts: ['app/fonts/**/*'],
        dest: 'dist',
    },
};

// Helper Functions
const handleError = (err) => {
    console.error(err);
    this.emit('end');
};

// Clean Task
const clean = () => del(paths.build.dest);

// Styles Task
const styles = () =>
    src(paths.styles.src)
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sassWithCompiler.sync().on('error', sassWithCompiler.logError))
        .pipe(rename({ suffix: '.min' }))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 15 versions'], cascade: false }))
        .pipe(cleanCSS())
        .pipe(dest(paths.styles.dest))
        .pipe(browserSync.stream());

// JavaScript Tasks
const commonJs = () =>
    src(paths.scripts.common)
        .pipe(concat('common.min.js'))
        .pipe(terser())
        .pipe(dest(paths.scripts.dest));

const scripts = () =>
    src(paths.scripts.libs)
        .pipe(concat('scripts.min.js'))
        .pipe(dest(paths.scripts.dest))
        .pipe(browserSync.stream());

// Image Optimization Task
const images = () =>
    src(paths.images.src)
        .pipe(
            imagemin([
                gifsicle({ interlaced: true }),
                mozjpeg({ quality: 75, progressive: true }),
                optipng({ optimizationLevel: 5 }),
                svgo({
                    plugins: [
                        { name: 'removeViewBox', active: true },
                        { name: 'cleanupIDs', active: false },
                    ],
                }),
            ])
        )
        .pipe(cache(imagemin())) // Check cache functionality
        .pipe(dest(paths.images.dest));

// Serve Task with BrowserSync
const serve = (cb) => {
    browserSync.init({
        server: { baseDir: 'app' },
        notify: false,
    });
    cb();
};

// Watch Task
const watchFiles = () => {
    watch(paths.styles.src, styles);
    watch(['libs/**/*.js', paths.scripts.common], scripts);
    watch('app/*.html').on('change', browserSync.reload);
};

// Build Tasks
const buildFiles = () => src(paths.build.base).pipe(dest(paths.build.dest));
const buildCSS = () => src(paths.build.css).pipe(dest(`${paths.build.dest}/css`));
const buildJS = () => src(paths.build.js).pipe(dest(`${paths.build.dest}/js`));
const buildFonts = () => src(paths.build.fonts).pipe(dest(`${paths.build.dest}/fonts`));

// Final Build Task
const build = series(clean, images, styles, commonJs, scripts, buildFiles, buildCSS, buildJS, buildFonts);

// Development Task
const dev = parallel(watchFiles, serve);

export { clean, styles, scripts, images, build };
export default series(clean, build, dev);
