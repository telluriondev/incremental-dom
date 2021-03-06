/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var gulp = require('gulp');
var del = require('del');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var rollup = require('rollup-stream');
var closureCompiler = require('google-closure-compiler').gulp();
var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');
var eslint = require('gulp-eslint');
var sourcemaps = require('gulp-sourcemaps');
var replace = require('gulp-replace');
var karma = require('karma');
var path = require('path');
var buffer = require('vinyl-buffer');
var fs = require('fs');

var env = process.env;
var entryFileName = 'index.js';
var artifactName = 'incremental-dom';
var googModuleName = 'incrementaldom';
var srcs = [entryFileName, 'src/**/*.js'];
var tests = ['test/**/*.js'];
var karmaConfig = path.resolve('conf/karma.conf.js');

function clean() {
  return del(['dist/']);
}

function unit(done) {
  env.NODE_ENV = 'test';
  new karma.Server({
    configFile: karmaConfig,
    singleRun: true,
    browsers: ['Chrome', 'Firefox']
  }, done).start();
}

function unitPhantom(done) {
  env.NODE_ENV = 'test';
  new karma.Server({
    configFile: karmaConfig,
    singleRun: true,
    browsers: ['PhantomJS']
  }, done).start();
}

function unitWatch(done) {
  env.NODE_ENV = 'test';
  new karma.Server({
    configFile: karmaConfig,
    browsers: ['Chrome']
  }, done).start();
}

function lint() {
  return gulp.src(srcs.concat(tests))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function bundle(format) {
  return rollup({
    entry: entryFileName,
    sourceMap: true,
    banner: fs.readFileSync('./conf/license_header.txt'),
    plugins: [
      env.min === 'true' ? uglify({
          output: { comments: /@license/ },
          compress: { keep_fargs: false }
      }) : {},
      babel({
        exclude: 'node_modules/**',
        plugins: env.NODE_ENV ?
          ['transform-inline-environment-variables'] :
          []
      })
    ],
    format: format,
    moduleName: 'IncrementalDOM',
  });
}

function js() {
  env.NODE_ENV = 'development';
  env.min = false;

  return bundle('umd')
    .pipe(source(artifactName + '.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

function jsWatch() {
  gulp.watch(srcs, ['js']);
}

function jsMinWatch() {
  gulp.watch(srcs, ['js-min']);
}

function jsMin() {
  env.NODE_ENV = 'production';
  env.min = true;

  return bundle('umd')
    .pipe(source(artifactName + '-min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

function jsClosure(done) {
  delete env.NODE_ENV;
  env.min = false;
  var moduleDeclaration = 'goog.module(\'' + googModuleName + '\');';

  return bundle('cjs')
    .pipe(source(artifactName + '-closure.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(replace(/('|")use strict\1;/, moduleDeclaration))
    .pipe(replace("process.env.NODE_ENV !== 'production'", 'goog.DEBUG'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

function jsCommonJS() {
  delete env.NODE_ENV;
  env.min = false;

  return bundle('cjs')
    .pipe(source(artifactName + '-cjs.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

function jsDist() {
  // These must be run serially: clean must complete before any of the js
  // targets run. The js and jsMin targets cannot run in parallel as they both
  // change process.env.NODE_ENV. The CommonJS target could run in parallel
  // with the js and jsMin targets, but currently is not.
  return clean()
    .then(jsClosureChecks)
    .then(jsCommonJS)
    .then(js)
    .then(jsMin);
}

function jsClosureChecks() {
  return gulp.src(srcs)
    .pipe(closureCompiler({
      checks_only: 'true',
      externs: 'node_externs.js',
      jscomp_error: 'checkTypes',
      language_in: 'ECMASCRIPT6_STRICT',
      warning_level: 'VERBOSE'
    }));
}

gulp.task('clean', clean);
gulp.task('unit', unit);
gulp.task('unit-phantom', unitPhantom);
gulp.task('unit-watch', unitWatch);
gulp.task('lint', lint);
gulp.task('js', js);
gulp.task('js-watch', ['js'], jsWatch);
gulp.task('js-min', jsMin);
gulp.task('js-min-watch', ['js-min'], jsMinWatch);
gulp.task('js-dist', jsDist);
gulp.task('js-closure', jsClosure);
gulp.task('js-closure-checks', jsClosureChecks);
gulp.task('build', ['lint', 'unit'], js);
gulp.task('dist', ['lint', 'unit-phantom'], jsDist);

gulp.task('default', ['build']);
