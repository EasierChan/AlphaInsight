/**
 * for package the program.
 */
// can't catch the error.
var combiner = require('stream-combiner2');
var gulp = require('gulp');

var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-clean-css');
//var pngmin = require('imagemin-advpng');

gulp.task('html', function () {
    var combined = gulp.src('src/**/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('out'));

    combined.on('error', console.error.bind(console));
    return combined;
});

gulp.task('js', function () {
    return gulp.src('src/**/*.js')
        .pipe(uglify())
        .on('error',function (err) {
            console.log(err.message);
            this.end();
        })
        .pipe(gulp.dest('out'));
});

gulp.task('css', function () {
    return gulp.src('src/**/*.css')
        .pipe(cssmin())
        .pipe(gulp.dest('out'));
});

gulp.task('png', function () {
    return gulp.src('src/**/*.png')
        //.pipe(pngmin({optimizationLevel: 4})())
        .pipe(gulp.dest('out'));
});

gulp.task('json', function () {
    return gulp.src('src/**/*.json')
        .pipe(gulp.dest('out'));
});
gulp.task('default', ['html', 'js', 'css', 'png', 'json']);
