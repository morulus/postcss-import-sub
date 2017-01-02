"use strict";
const themeName = process.env.COLOR || 'default';

module.exports = {
  plugins: [
    require('../../index.js')([
      {
        base: /src/,
        id: /color\.css/,
        path: "<root>/themes/"+themeName+"/"
      }
    ]),
    require('postcss-simple-vars')
  ]
}
