/* eslint no-undef: 0 */
/* eslint no-console: 0 */
"use strict";
jest.mock('fs');
const fs = require('fs');
const path = require('path');
const root = process.cwd();

jest.mock('postcss-import/lib/resolve-id.js', function() {
  const path = require('path');
  const resolveEngine = {
    resolve: function(id, base, config) {
      console.warn('Resolve', id);
      return Promise.resolve(path.resolve(base, id));
    }
  }

  function resolveId(id, base, config) {
    return resolveEngine.resolve(id, base, config);
  }

  resolveId.setResolver = function(fn) {
    resolveEngine.resolve = fn;
  }

  return resolveId;
});

var sub = require('../index.js').sub;

function mockRender(config) {
  return function(id, base, options) {
    return Promise.resolve(config.resolve)
    .then(function(resolve) {
      return resolve(id, path.join(root, base), options||{});
    })
    .then(function(result) {
      if (!(result instanceof Array)) result = [result];
      return result.map(function(file) {
        return path.relative(root, file);
      });
    });
  }
}

fs.__setMockFiles([
  'app/Components/Box/blue.css',
  'app/Components/Box/red.css',
  'app/Theme/Components/Box/red.css',
]);

describe('postcss-import-sub', () => {
  it ('relative `to` substitution', () => {
    const render = mockRender(sub([
      {
        id: new RegExp("red\.css"),
        to: "blue.css"
      }
    ]));
    return render("red\.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/blue.css");
    });
  });

  it ('relative `to` substitution with dot', () => {
    const render = mockRender(sub([
      {
        id: new RegExp("red\.css"),
        to: "./blue.css"
      }
    ]));
    return render("red\.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/blue.css");
    });
  });

  it ('absolute `to` substitution', () => {
    const render = mockRender(sub([
      {
        id: new RegExp("red\.css"),
        to: "<root>/app/Components/Box/blue.css"
      }
    ]));
    return render("red\.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/blue.css");
    });
  });

  it ('relative `path` substitution with dot', () => {
    const render = mockRender(sub([
      {
        id: new RegExp("red\.css"),
        path: "<root>/app/Theme/Components/Box/"
      }
    ]));
    return render("red\.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('absolute `to` substitution with alias', () => {
    const render = mockRender(sub([
      {
        id: new RegExp("red\.css"),
        to: "<root>/app/Theme/Components/Box/<id>"
      }
    ]));
    return render("red\.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });
});
