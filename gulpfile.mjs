import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import del from 'del';
import imagemin from 'gulp-imagemin';
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
        dest: 'app/js'
    },
    styles: {
        src: 'app/sass/**/*.sass',
        dest: 'app/css'
    },
    images: {
        src: 'app/img/**/*',
        dest: 'dist/img'
    },
    build: {
        base: ['app/*.html', 'app/.htaccess'],
        css: ['app/css/main.min.css'],
        js: ['app/js/scripts.min.js'],
        fonts: ['app/fonts/**/*'],
        dest: 'dist'
    }
};

const clean = (cb) => {
    del.sync(paths.build.dest);
    cb();
};

const styles = () =>
    src(paths.styles.src)
        // .pipe(sassWithCompiler().on('error', sassWithCompiler.logError))
        .pipe(plumber()) // Добавляем plumber для предотвращения краха задачи
        .pipe(sassWithCompiler.sync().on('error', sassWithCompiler.logError))


        .pipe(rename({ suffix: '.min' }))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 15 versions'], cascade: false }))
        .pipe(cleanCSS())
        .pipe(dest(paths.styles.dest))
        .pipe(browserSync.stream());

const commonJs = () =>
    src(paths.scripts.common)
        .pipe(concat('common.min.js'))
        .pipe(uglify())
        .pipe(dest(paths.scripts.dest));

const scripts = () =>
    src(paths.scripts.libs)
        .pipe(concat('scripts.min.js'))
        .pipe(dest(paths.scripts.dest))
        .pipe(browserSync.stream());

const images = () =>
    src(paths.images.src)
        .pipe(cache(imagemin()))
        .pipe(dest(paths.images.dest));

const serve = (cb) => {
    browserSync.init({
        server: { baseDir: 'app' },
        notify: false
    });
    cb();
};

const watchFiles = () => {
    watch(paths.styles.src, styles);
    watch(['libs/**/*.js', paths.scripts.common], scripts);
    watch('app/*.html').on('change', browserSync.reload);
};

const buildFiles = () => src(paths.build.base).pipe(dest(paths.build.dest));
const buildCSS = () => src(paths.build.css).pipe(dest(`${paths.build.dest}/css`));
const buildJS = () => src(paths.build.js).pipe(dest(`${paths.build.dest}/js`));
const buildFonts = () => src(paths.build.fonts).pipe(dest(`${paths.build.dest}/fonts`));

const build = series(clean, images, styles, commonJs, scripts, buildFiles, buildCSS, buildJS, buildFonts);
const dev = parallel(watchFiles, serve);

export { clean, styles, scripts, images, build };
export default series(clean, build, dev);
