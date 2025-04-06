import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import * as lightningcss from "lightningcss";
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin';
import autoprefixer from 'gulp-autoprefixer';
import plumber from 'gulp-plumber';
import babel from 'gulp-babel';
import del from 'del';
import fs from "node:fs";

const { series, parallel, src, dest, watch } = gulp;

const sassWithCompiler = gulpSass(sass);
const jsPath = 'app/js'
const jsIndexFile = 'index.min.js'
const paths = {
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
        src: 'app/sass/**/*.sass',
        dest: 'app/css',
    },
    images: {
        src: 'app/img/**/*',
        dest: 'dist/img',
    },
    build: {
        base: ['app/*.html'],
        // base: ['app/*.html', 'app/.htaccess'],
        css: ['app/css/main.min.css'],
        js: [`${jsPath}/${jsIndexFile}`],
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
const styles = (done) => {
    gulp.src('app/sass/main.sass')
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sassWithCompiler.sync().on('error', sassWithCompiler.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(gulp.dest('dist/css'))
        .on('end', () => {
            const inputCss = fs.readFileSync('dist/css/main.css', 'utf-8');
            const outputCss = lightningcss.transform({
                filename: 'main.css',
                code: Buffer.from(inputCss),
                minify: true,
            }).code;
            fs.writeFileSync('dist/css/main.min.css', outputCss);
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
        // .pipe(babel({
        //     presets: [['@babel/preset-env', { modules: false }]]
        // }))
        .pipe(concat(jsIndexFile))
        .pipe(terser())
        .pipe(dest(paths.js.dest))
        .on('end', () => browserSync.reload());


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
                        // { name: 'removeViewBox', active: true },
                        { name: 'cleanupIDs', active: false },
                    ],
                }),
            ])
        )
        .pipe(dest(paths.images.dest));

// Serve Task with BrowserSync
const serve = () => {
    browserSync.init({
        server: "app",
        notify: false,
        open: false
    });
};

// Watch Task
const watchFiles = () => {
    watch(paths.styles.src, styles);
    watch(paths.js.common, series(libsJS, indexJS));
    watch('app/*.html').on('change', browserSync.reload);
};

// Build Tasks
const buildFiles = () => src(paths.build.base).pipe(dest(paths.build.dest));
const buildCSS = () => src(paths.build.css).pipe(dest(`${paths.build.dest}/css`));
const buildJS = () => src(paths.build.js).pipe(dest(`${paths.build.dest}/js`));
const buildFonts = () => src(paths.build.fonts).pipe(dest(`${paths.build.dest}/fonts`));

// Final Build Task
const build = series(clean, images, styles, libsJS, indexJS, buildFiles, buildCSS, buildJS, buildFonts);

// Development Task
const dev = parallel(serve, watchFiles);

export { clean, styles, libsJS, images, build};
export default series(clean, build, dev);
