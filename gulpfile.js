// gulp stuff
const gulp = require('gulp');

// gulp style
'use strict';
 
var sass = require("gulp-sass")(require('sass')),
    postcss = require("gulp-postcss"),
    autoprefixer = require("autoprefixer"),
    cssnano = require("cssnano");

var paths = {
    styles: {
      src: "src/scss/*.scss",
      dest: "src/css/"
    }
};

function style() {
  return gulp
  .src(paths.styles.src)
  .pipe(sass())
  .on("error", sass.logError)
  // .pipe(postcss([autoprefixer(), cssnano()]))
  .pipe(gulp.dest(paths.styles.dest));
}

exports.style = style;

var build = gulp.parallel(style);

gulp.task('build', build);

gulp.task('default', build);