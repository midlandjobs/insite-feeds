// gulp pot
const gulp = require('gulp');
const gulpif = require('gulp-if');
const del = require('del');
const wpPot = require('gulp-wp-pot');
const replace = require('gulp-replace');
const rename = require('gulp-rename');

const config = {
  "text_domain" : "base-theme",
  "twig_files"  : "views/**/*.twig",
  // "twig_blocks"  : "inc/acf/blocks/views/**/*.twig",
  "php_files"   : "{*.php,!(vendor|node_modules|_dev|_bin|_woo_one|_woo_two)/**/*.php}", // all php files in all folders incl. root except page-templates
  "cacheFolder" : "views/temp",
  // "blocksCacheFolder" : "inc/acf/blocks/views/temp",
  "destFolder"  : "languages",
};

const gettext_regex = {
  simple: /(__|_e|translate|esc_attr__|esc_attr_e|esc_html__|esc_html_e)\(\s*?['"].+?['"]\s*?,\s*?['"].+?['"]\s*?\)/g,
  plural: /_n\(\s*?['"].*?['"]\s*?,\s*?['"].*?['"]\s*?,\s*?.+?\s*?,\s*?['"].+?['"]\s*?\)/g,
  disambiguation: /(_x|_ex|_nx|esc_attr_x|esc_html_x)\(\s*?['"].+?['"]\s*?,\s*?['"].+?['"]\s*?,\s*?['"].+?['"]\s*?\)/g,
  noop: /(_n_noop|_nx_noop)\((\s*?['"].+?['"]\s*?),(\s*?['"]\w+?['"]\s*?,){0,1}\s*?['"].+?['"]\s*?\)/g,
};

gulp.task('compile-twig', () => {
  return gulp.src(config.twig_files)
    .pipe(replace(gettext_regex.simple, match => `<?php ${match}; ?>`))
    .pipe(replace(gettext_regex.plural, match => `<?php ${match}; ?>`))
    .pipe(replace(gettext_regex.disambiguation, match => `<?php ${match}; ?>`))
    .pipe(replace(gettext_regex.noop, match => `<?php ${match}; ?>`))
    .pipe(rename({
      extname: '.php',
    }))
    .pipe(gulp.dest(config.cacheFolder));
});

gulp.task('compile-blocks-twig', () => {
  return gulp.src(config.twig_blocks)
    .pipe(replace(gettext_regex.simple, match => `<?php ${match}; ?>`))
    .pipe(replace(gettext_regex.plural, match => `<?php ${match}; ?>`))
    .pipe(replace(gettext_regex.disambiguation, match => `<?php ${match}; ?>`))
    .pipe(replace(gettext_regex.noop, match => `<?php ${match}; ?>`))
    .pipe(rename({
      extname: '.php',
    }))
    .pipe(gulp.dest(config.blocksCacheFolder));
});

gulp.task('generate-pot', () => {
  const output = gulp.src(config.php_files)
    .pipe(wpPot({
      domain: config.text_domain
    }))
    .pipe(gulp.dest(`${config.destFolder}/${config.text_domain}.pot`))
  return output;
});

gulp.task('clean-temp', function(){
   return del(['views/temp/**', 'views/temp'], {force: true});
});

gulp.task('clean-blocks-temp', function(){
   return del(['inc/acf/blocks/views/temp/**', 'inc/acf/blocks/views/temp'], {force: true});
});

// gulp.task('pot', gulp.series('compile-twig', 'compile-blocks-twig', 'generate-pot', 'clean-temp', 'clean-blocks-temp'));
gulp.task('pot', gulp.series('compile-twig', 'generate-pot', 'clean-temp'));

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