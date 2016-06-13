var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('default', function(){
    gulp.src(['src/**/*.ts'])
    .pipe(ts({
        module: 'amd',
        removeComments: false
    }))
    .pipe(gulp.dest('out'));;
});