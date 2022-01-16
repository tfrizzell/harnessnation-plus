const gulp = require('gulp');
const rename = require('gulp-rename');
const zip = require('gulp-zip');

const files = [
    'data/**/*',
    'icons/**/*.png',
    'lib/**/*',
    'options/**/*',
    'public/**/*',
    'scripts/**/*',
    'background.html',
    'LICENSE',
    'README.md'
];

const package = browser => () =>
    gulp.src([...files, `manifests/manifest-${browser}.json`], { base: './' })
        .pipe(rename(path => {
            if (path.basename === `manifest-${browser}`) {
                path.dirname = './';
                path.basename = path.basename.replace(/^manifest-.*/, 'manifest');
            }
        }))
        .pipe(zip(`hn-plus-${browser}.zip`))
        .pipe(gulp.dest('./'));

gulp.task('package:chrome', package('chrome'));
gulp.task('package:edge', package('edge'));
gulp.task('package:firefox', package('firefox'));

gulp.task('package:all', gulp.parallel('package:chrome', 'package:edge', 'package:firefox'));
gulp.task('package', gulp.parallel('package:all'));