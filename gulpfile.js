var combiner = require('stream-combiner2');
var gulp = require('gulp');

var uglify = require('gulp-uglify');

gulp.task('default', function(){
    var combined = combiner.obj([
        gulp.src('src/*.js'),
        uglify(),
        gulp.dest('out')
    ]);
    
    combined.on('error', console.error.bind(console));
    return combined;
});