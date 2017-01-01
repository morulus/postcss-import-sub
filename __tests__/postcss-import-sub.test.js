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
        id: /red\.css/,
        to: "blue.css"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/blue.css");
    });
  });

  it ('relative `to` substitution with dot', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        to: "./blue.css"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/blue.css");
    });
  });

  it ('absolute `to` substitution', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        to: "<root>/app/Components/Box/blue.css"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/blue.css");
    });
  });

  it ('relative `path` substitution with dot', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        path: "<root>/app/Theme/Components/Box/"
      }
    ]));
    return render("./red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('relative `path` substitution with without ending slash', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        path: "<root>/app/Theme/Components/Box"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('absolute `to` substitution with alias', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        to: "<root>/app/Theme/Components/Box/<id>"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('absolute `to` substitution with alias', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        to: "<root>/app/Theme/Components/Box/<id>"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('relative `path` with custom aliases', () => {
    const render = mockRender(sub([
      {
        id: /red\.css/,
        base: /Components\/([a-z0-9]+)\//i,
        path: "<root>/app/Theme/Components/<base:$1>/"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('absolute `to` with custom aliases', () => {
    const render = mockRender(sub([
      {
        id: /([a-z0-9]+)\.css/,
        base: /Components\/([a-z0-9]+)\//i,
        to: "<root>/app/Theme/Components/<base:$1>/<id:$1>.css"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('absolute `to` with custom aliases using module', () => {
    const render = mockRender(sub([
      {
        module: /\/([a-z0-9]+)\/([a-z0-9]+)\.css/i,
        to: "<root>/app/Theme/Components/<module:$1>/<module:$2>.css"
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('append mode', () => {
    const render = mockRender(sub([
      {
        module: /\/([a-z0-9]+)\/([a-z0-9]+)\.css/i,
        to: "<root>/app/Theme/Components/<module:$1>/<module:$2>.css",
        append: true
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("app/Components/Box/red.css");
      expect(module[1]).toBe("app/Theme/Components/Box/red.css");
    });
  });

  it ('append mode unresolved', () => {
    const render = mockRender(sub([
      {
        module: /no.css/i,
        to: "<root>/app/Theme/Components/<module:$1>/<module:$2>.css",
        append: true
      }
    ]));
    return render("red.css", "app/Components/Box/")
    .then(function(module) {
      expect(module[0]).toBe("red.css");
      expect(module.length).toBe(1);
    });
  });
});
