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


gulp.task('other', function () {
    return gulp.src('./**/glyphicons*.*')
        .pipe(gulp.dest('../AIRelease/linux-x64/resources/app'))
        .pipe(gulp.dest('../AIRelease/win-ia32/resources/app'));
});

gulp.task('html', function () {
    var combined = gulp.src('./**/*.html')
        //.pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('../AIRelease/linux-x64/resources/app'))
        .pipe(gulp.dest('../AIRelease/win-ia32/resources/app'));

    combined.on('error', console.error.bind(console));
    return combined;
});

gulp.task('js', function () {
    return gulp.src('./**/*.js')
        .pipe(uglify())
        .on('error', function (err) {
            console.log(err.message);
            this.end();
        })
        .pipe(gulp.dest('../AIRelease/linux-x64/resources/app'))
        .pipe(gulp.dest('../AIRelease/win-ia32/resources/app'));
});

gulp.task('css', function () {
    return gulp.src('./**/*.css')
        .pipe(cssmin())
        .pipe(gulp.dest('../AIRelease/linux-x64/resources/app'))
        .pipe(gulp.dest('../AIRelease/win-ia32/resources/app'));
});

gulp.task('png', function () {
    return gulp.src('./**/*.png')
        //.pipe(pngmin({optimizationLevel: 4})())
        .pipe(gulp.dest('../AIRelease/linux-x64/resources/app'))
        .pipe(gulp.dest('../AIRelease/win-ia32/resources/app'));
});

gulp.task('json', function () {
    return gulp.src('./**/*.json')
        .pipe(gulp.dest('../AIRelease/linux-x64/resources/app'))
        .pipe(gulp.dest('../AIRelease/win-ia32/resources/app'));
});


gulp.task('default', ['other','html', 'js', 'css', 'png', 'json']);
