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
    gulp.src(['./icons/**/*.png'])
        .pipe(gulp.dest(`${DIR_DIST}/icons`)));

gulp.task('copy:public', () =>
    gulp.src(['./public/**/*'])
        .pipe(gulp.dest(`${DIR_DIST}/public`)));

gulp.task('copy:src', () =>
    gulp.src(['./src/**/*', '!./src/**/*.ts', '!./src/**/*.tsx'])
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
 **       Build       **
 **                   **
 ***********************/

const copyManifest = browser => () =>
    gulp.src([`./manifests/manifest-${browser}.json`], { base: './' })
        .pipe(rename(path => {
            if (path.basename === `manifest-${browser}`) {
                path.dirname = './';
                path.basename = path.basename.replace(/^manifest-.*/, 'manifest');
            }
        }))
        .pipe(gulp.dest(DIR_DIST));

gulp.task('build:chrome', gulp.series('build', copyManifest('chrome')));
gulp.task('build:edge', gulp.series('build', copyManifest('edge')));
gulp.task('build:firefox', gulp.series('build', copyManifest('firefox')));

/***********************
 **                   **
 **      Package      **
 **                   **
 ***********************/

const package = browser => () => {
    const zipFile = `hn-plus-${browser}.zip`;
    del(zipFile);

    return gulp.src([...FILES, `manifests/manifest-${browser}.json`], { base: './' })
        .pipe(rename(path => {
            path.dirname = path.dirname.replace(/^dist[/\\]+/, '').replace(/^dist$/, '.');

            if (path.basename === `manifest-${browser}`) {
                path.dirname = '.';
                path.basename = path.basename.replace(/^manifest-.*/, 'manifest');
            }
        }))
        .pipe(zip(zipFile))
        .pipe(gulp.dest('./'));
}

gulp.task('package:chrome', gulp.series('build', package('chrome')));
gulp.task('package:edge', gulp.series('build', package('edge')));
gulp.task('package:firefox', gulp.series('build', package('firefox')));

gulp.task('package:all', gulp.series('build', gulp.parallel(package('chrome'), package('edge'), package('firefox'))));
gulp.task('package', gulp.parallel('package:all'));

/***********************
 **                   **
 **       Debug       **
 **                   **
 ***********************/

gulp.task('debug:chrome', gulp.parallel('build:chrome'));
gulp.task('debug:edge', gulp.parallel('build:edge'));
gulp.task('debug:firefox', gulp.series('package:firefox'));