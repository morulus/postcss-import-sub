/* eslint no-undef: 0 */
/* eslint no-console: 0 */
"use strict";
var fs = require('fs');
var path = require('path');
const root = process.cwd();

const resolveEngine = {
  resolve: function(id, base, config) {
    return id;
  }
}

function resolveId(id, base, config) {
  return resolveEngine.resolve(id, base, config);
}

resolveId.setResolver = function(fn) {
  resolveEngine.resolve = fn;
}

jest.mock('postcss-import/lib/resolve-id.js', function() {
  return resolveId;
});

var sub = require('../index.js').sub;

function mockRender(config) {
  return function(id, base, options) {
    return Promise.resolve(true)
    .then(function() {
      return config.resolve(id, path.join(root, base), options||{});
    })
    .then(path.relative.bind(path));
  }
}

fs.__setMockFiles = {
  app: {
    Components: {
      Box: ["red.css","blue.css"]
    }
  }
}

describe('postcss-import-sub', () => {
  it ('strict [id] substitution', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        to: /blue\.css/
      }
    ]));
    return render("red\.css", "app/Components/Box/")
    .then(function(module) {
      expect().toBe("app/Components/Box/blue.css");
    });
  });
});
