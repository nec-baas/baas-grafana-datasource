'use strict';

const gulp = require('gulp');
const typescript  = require('gulp-typescript');

gulp.task('copy_html',() => {
    return gulp.src('src/partials/*.html').pipe(gulp.dest('./dist/partials/'));
});

gulp.task('copy_css', () => {
    return gulp.src('src/css/*.css').pipe(gulp.dest('./dist/css/'));
});
gulp.task('copy_img', () => {
    return gulp.src('src/img/*').pipe(gulp.dest('./dist/img/'));
});

gulp.task('copy_static', () => {
    return gulp.src(['src/plugin.json', 'LICENSE', 'README.md']).pipe(gulp.dest('./dist/'));
});

gulp.task('ts', () => {
    const tsProject = typescript.createProject("tsconfig.json");
    return gulp.src('src/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['copy_html', 'copy_css', 'copy_img', 'copy_static', 'ts']);