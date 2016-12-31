/* eslint no-debugger: 0 */
"use strict";
var fs = require('fs');
var path = require('path');
var resolve = require('resolve');
var resolveId = require('postcss-import/lib/resolve-id.js');
var AtImport = require('postcss-import');
const defaultExpr = /.*/i;
/**
* Replace to unix sep
*/
function sepToUnix(p) {
  return p.split(path.sep).join('/');
}
/**
* Test is file exists
*/
function testFileExists(filename) {
  return fs.existsSync(filename);
}
/**
* Simple replace string with key:value in holders
*/
function replace(str, holders) {
  for (let prop in holders) {
    if (holders.hasOwnProperty(prop)) {
      str = str.replace(prop, holders[prop]);
    }
  }
  return str;
}
/**
* Object fn surrogate
*/
function object(pairs) {
  let obj = {};
  for (let i = 0;i<pairs.length;++i) {
    obj[pairs[i][0]] = pairs[i][1];
  }
  return obj;
}
/**
* Transform regExpr exec result to hashmap with tagged keys
*
* Example:
* (with expr /components\/([\w]+)\/([\w\.]+\.css)/i):
* let holders = matchToHolders(["components/supra/style.css", "supra", "style.css"], 'base');
* console.log(holders);
* {
*   "[base: $0]": "components/supra/style.css"
*   "[base: $1]": "supra"
*   "[base: $2]": "style.css"
* }
*/
function matchToHolders(match, tag) {
  return object(match.map(function(val, index) {
    return ["<"+tag+":$"+index+">", val];
  }));
}
/**
* Filter rules with `to` prop
*/
function filterValidRule(rule) {
  return (rule.hasOwnProperty('to')&&typeof rule.to === "string") ||
  (rule.hasOwnProperty('path')&&typeof rule.path === "string");
}
/**
* Merge with defaults
*/
function mapDefaults(rule) {
  return Object.assign({}, {
    id: defaultExpr,
    base: defaultExpr,
    module: defaultExpr
  }, rule);
}
/**
* Make path with dot if it hasn't. This function assumes in advance that you giving to it a relative path.
*/
function forceRelative(p) {
  if (p.charAt(0) !== '.') {
    return p.charAt(0) === '/' ? p : './'+p;
  }
  return p;
}
/**
* Simple resolve path (usign path.resolve)
*/
function resolveSync(p, base) {
  if (!path.isAbsolute(p)) {
    p = path.resolve(base, p);
  }
  return p;
}
/**
* Resolve path the same way ans postcss-import
*
* @return {Promise}
*/
function resolveAsync(p, base) {
  if (!path.isAbsolute(p)) {
    return new Promise(function(r, j) {
      resolve(forceRelative(p), {
        basedir: base
      }, function(err, res) {
        if (err) {
          j(err);
        } else {
          r(res);
        }
      });
    });

  } else {

    return Promise.resolve(p);
  }
}
/**
* Search module in rules existing
*/
function isHasModule(rules) {
  for (let i = 0; i < rules.length; ++i) {
    if (Object.prototype.hasOwnProperty.call(rules[i], 'module')) {
      return true;
    }
  }
  return false;
}

function sub(options) {
  /**
   * Support simple mode of rules definition
   */
  if (options instanceof Array) {
    options = {
      sub: options
    };
  }
  /**
   * Defines root. It can be specified in options otherwise will taken from process.cwd()
   */
  const root = options.root || process.cwd();
  /**
   * Get custom resolve function if user has specified it
   */
  const userResolve = typeof options.resolve === "function" ? options.resolve : null;
  /**
   * Search module testing rules
   */
  const isModuleRequired = isHasModule(options.sub);
  /**
   * Define real options
   */
  return Object.assign({}, options, {
    resolve: function(id, base, importOptions) {
      /**
       * Replace window separate style to unix
       */
      base = sepToUnix(base);
      /**
       * Define holders and calculate two general properties [id] and [folder]
       */
      const holders = {
        "~": root,
        "<root>": root,
        "<id>": id, // Is required query string as is (for example ../fonts.css)
        "<folder>": path.parse(base).base.split('/').pop() // Is top directory of base path (for example app/components/(button))
      };
      /**
       * For best performance resolve module only if options has module prop.
       */
      return (isModuleRequired ? resolveId(id, base, importOptions) : Promise.resolve(''))
      .then(function(module) {
        /**
         * Flow rules
         */
        return [options.sub
        /**
         * We want only rules with `to` or `path` prop.
         */
        .filter(filterValidRule)
        /**
        * Merge with default expressions (id, base, module)
        */
        .map(mapDefaults)
        /*
        * Test each expression (id, base, module)
        */
        .filter(function(rule) {
          return rule.id.test(id) && rule.base.test(base) && rule.module.test(module);
        }), module];
      })
      .then(function(parcle) {
        return Promise.all(parcle[0].map(function(rule) {
          /**
           * Match id
           */
          let matchId = rule.id.exec(id);
          if (matchId) {
            Object.assign(holders, matchToHolders(matchId, 'id'));
          }
          /**
           * Match base
           */
          let matchBase = rule.base.exec(base);
          if (matchBase) {
            Object.assign(holders, matchToHolders(matchBase, 'base'));
          }
          /**
           * Match module (optional)
           */
          if (isModuleRequired) {
            let matchModule = rule.module.exec(parcle[1]);
            if (matchModule) {
              Object.assign(holders, matchToHolders(matchModule, 'module'));
            }
          }
          /**
           * Parse aliases and resolve final path
           */
          if (rule.to) {
            return resolveAsync(replace(rule.to, holders), base);
          } else {
            return resolveAsync(id, resolveSync(replace(rule.path, holders), base), importOptions);
          }
        }));
      })
      .then(function(files) {
        const existsFiles = files.filter(testFileExists);
        /**
        * If at least one of file exists, we returns them
        */
        if (existsFiles.length>0) {
          return existsFiles;
        }
        /**
        * On fail we must check for use resolve function to execute it
        */
        if (userResolve) {
          return userResolve(id, base, importOptions);
        }
        /**
        * On total fail just returns id, postcss-import will decide what to do.
        */
        return id;
      })
      .catch(function(e) {
        return id;
      });
    }
  });
}

module.exports = function substitute(options) {
  return AtImport(sub(options));
}

module.exports.sub = sub;
module.exports.process = AtImport.process;
module.exports.postcss = AtImport.postcss;
module.exports.AtImport = AtImport;
