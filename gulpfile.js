const gulp = require('gulp');

const del = require('del');
const rename = require('gulp-rename');
const ts = require('gulp-typescript');
const zip = require('gulp-zip');

/***********************
 **                   **
 **      Config       **
 **                   **
 ***********************/
const DIR_DIST = './dist';

const FILES = [
    `${DIR_DIST}/**/*`,
    'LICENSE',
    'README.md'
];

/***********************
 **                   **
 **       Build       **
 **                   **
 ***********************/

gulp.task('clean', () =>
    del(DIR_DIST, { force: true }));

gulp.task('copy:icons', () =>
    gulp.src('./icons/**/*.png')
        .pipe(gulp.dest(`${DIR_DIST}/icons`)));

gulp.task('copy:manifest', () =>
    gulp.src('./manifests/manifest-chrome.json')
        .pipe(rename(path => {
            path.dirname = './';
            path.basename = path.basename.replace(/^manifest-.*/, 'manifest');
        }))
        .pipe(gulp.dest(DIR_DIST)));

gulp.task('copy:public', () =>
    gulp.src('./public/**/*')
        .pipe(gulp.dest(`${DIR_DIST}/public`)));

gulp.task('copy:src', () =>
    gulp.src(['./src/**/*', '!./src/**/*.ts'])
        .pipe(gulp.dest(DIR_DIST)));

gulp.task('compile:src', () => {
    const tsProject = ts.createProject('tsconfig.json');

    return tsProject
        .src()
        .pipe(tsProject())
        .js
        .pipe(gulp.dest(DIR_DIST));
});

gulp.task('compile', gulp.series('copy:src', 'compile:src'));
gulp.task('build', gulp.series('clean', 'copy:icons', 'copy:public', 'compile'));

/***********************
 **                   **
 **     Dev Build     **
 **                   **
 ***********************/

const dev = browser => () =>
    gulp.src([...PKG_FILES, `manifests/manifest-${browser}.json`], { base: './' })
        .pipe(rename(path => {
            if (path.basename === `manifest-${browser}`) {
                path.dirname = './';
                path.basename = path.basename.replace(/^manifest-.*/, 'manifest');
            }
        }))
        .pipe(gulp.dest(DIR_DIST));

gulp.task('build:chrome', gulp.series('build', dev('chrome')));
gulp.task('build:debug', gulp.series('build', 'copy:manifest'));
gulp.task('build:edge', gulp.series('build', dev('edge')));
gulp.task('build:firefox', gulp.series('build', dev('firefox')));

/***********************
 **                   **
 **      Package      **
 **                   **
 ***********************/

const package = browser => () => {
    const zipFile = `hn-plus-${browser}.zip`;

    return gulp.series(
        del(zipFile),
        gulp.src([...FILES, `manifests/manifest-${browser}.json`], { base: './' })
            .pipe(rename(path => {
                if (path.basename === `manifest-${browser}`) {
                    path.dirname = './';
                    path.basename = path.basename.replace(/^manifest-.*/, 'manifest');
                }
            }))
            .pipe(zip(`hn-plus-${browser}.zip`))
            .pipe(gulp.dest('./')),
    );
}

gulp.task('package:chrome', package('chrome'));
gulp.task('package:edge', package('edge'));
gulp.task('package:firefox', package('firefox'));

gulp.task('package:all', gulp.parallel('package:chrome', 'package:edge', 'package:firefox'));
gulp.task('package', gulp.parallel('package:all'));