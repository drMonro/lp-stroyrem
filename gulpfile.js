const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass')(require('sass')); // <-- Исправленный импорт
const browserSync = require('browser-sync');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const del = require('del');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const autoprefixer = require('gulp-autoprefixer');
const ftp = require('vinyl-ftp');
const notify = require("gulp-notify");


// Скрипты проекта

    gulp.task('common-js', function() {
        return gulp.src([
            'app/js/common.js',
            ])
        .pipe(concat('common.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/js'));
    });

    // gulp.task('scripts', gulp.parallel('common-js'), function() {
    gulp.task('scripts', function() {
        return gulp.src([
            'app/libs/jquery/dist/jquery.min.js',
            'app/libs/mmenu/jquery.mmenu.all.js',
            'app/libs/owl.carousel/owl.carousel.min.js',
            'app/libs/fotorama/fotorama.js',
            'app/libs/selectize/js/standalone/selectize.min.js',
            'app/libs/equalHeights/equalheights.js',
            // 'app/libs/PageScroll2id.min.js',
            'app/js/common.min.js', // Всегда в конце
        ])
        .pipe(concat('scripts.min.js'))
        // .pipe(uglify()) // Минимизировать весь js (на выбор)
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({stream: true}));
    });

    gulp.task('browser-sync', function() {
        browserSync({
            server: {
                baseDir: 'app'
            },
            notify: false,
            // tunnel: true,
            // tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
        });
    });

    gulp.task('sass', function() {
        return gulp.src('app/sass/**/*.sass')
        .pipe(sass().on("error", notify.onError()))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(autoprefixer(['last 15 versions']))
        .pipe(cleanCSS())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({stream: true}));
    });

gulp.task('watch', function() {
    gulp.watch('app/sass/**/*.sass', gulp.parallel('sass'));
    gulp.watch(['libs/**/*.js', 'app/js/common.js'], gulp.parallel('scripts'));
    gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('imagemin', function() {
    return gulp.src('app/img/**/*')
    .pipe(cache(imagemin()))
    .pipe(gulp.dest('dist/img'));
});


gulp.task('removedist', async function() {
    await del.sync('dist');
});

gulp.task('clearcache', function () { return cache.clearAll(); });


gulp.task('buildFiles', function() {
    return gulp.src([
        'app/*.html',
        'app/.htaccess',
        ]).pipe(gulp.dest('dist'));
});

gulp.task('buildCSS', function() {
    return gulp.src([
        'app/css/main.min.css',
        ]).pipe(gulp.dest('dist/css'));
});

gulp.task('buildJS', function() {
    return gulp.src([
        'app/js/scripts.min.js',
        ]).pipe(gulp.dest('dist/js'));
});

gulp.task('buildFonts', function() {
    return gulp.src([
        'app/js/scripts.min.js',
        ]).pipe(gulp.dest('dist/js'));
});


gulp.task('build', gulp.series('removedist', 'imagemin', 'sass', 'scripts', 'buildFiles', 'buildCSS', 'buildJS', 'buildFonts'));



gulp.task('default', gulp.parallel('watch', 'sass', 'scripts', 'browser-sync'));
