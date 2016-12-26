"use strict";
var fs = require('fs');
var path = require('path');
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
    return ["["+tag+":"+index+"]", val];
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
* Parse and resolve path
*/
function resolve(p, base, holders) {
  p = replace(p, holders);
  if (!path.isAbsolute(p)) {
    p = path.resolve(base, p);
  }
  return p;
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
       * For best performance resolve module only if options has module prop.
       */
      let module = isModuleRequired ? resolveId(id, base, importOptions) : '';
      /**
       * Define holders and calculate two general properties [id] and [folder]
       */
      const holders = {
        "~": root,
        "[root]": root,
        "[id]": id, // Is required query string as is (for example ../fonts.css)
        "[folder]": path.parse(base).base.split('/').pop() // Is top directory of base path (for example app/components/(button))
      };
      /**
       * Flow rules
       */
      const resultList = options.sub
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
      })
      .map(function(rule) {
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
          let matchModule = rule.module.exec(module);
          if (matchModule) {
            Object.assign(holders, matchToHolders(matchModule, 'module'));
          }
        }
        /**
         * Resolve
         */
        if (rule.to) {
          return resolve(rule.to, base, holders);
        } else {
          const p = resolve(rule.path, base, holders);
          return path.resolve(p, id);
        }
      })
      .filter(testFileExists);

      if (resultList.length>0) {
        return resultList;
      }

      if (userResolve) {
        return userResolve(id, base, importOptions);
      }

      return (isModuleRequired ? module : resolveId(id, base, importOptions));
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
