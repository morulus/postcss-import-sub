"use strict";
const gulp = require('gulp');
const express = require('express');
const themeName = process.env.COLOR || 'default';
const chalk = require('chalk');
const launch = require('opn');
const path = require('path');

console.log(chalk.magenta('Build...'));

if (themeName !== 'default') {
  console.log(chalk.magenta('Using '+themeName+' theme'));
}

var postcss    = require('gulp-postcss');

gulp.src('src/postcss-logo.css')
.pipe( postcss([
  require('postcss-import-sub')([
    {
      base: /src/,
      id: /color\.css/,
      path: "<root>/themes/"+themeName+"/"
    }
  ]),
  require('postcss-simple-vars')
]) )
.pipe( gulp.dest('./build/') )
.on('end', function() {
  console.log(chalk.magenta('Completed'));

  const app = express();

  app.use(express.static('public'));

  app.get('/style.css', function (req, res) {
    res.sendFile(path.resolve(__dirname, './build/postcss-logo.css'));
  })

  app.listen(3000);

  console.log(chalk.magenta('Open http://localhost:3000/ to see result.'));
  launch('http://localhost:3000');
});
