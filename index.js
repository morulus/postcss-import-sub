"use strict";
var resolveId = require('postcss-import/lib/resolve-id.js');
var path = require('path');
const defaultExpr = /.*/i;
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
* Search module in rules existing
*/
function isHasModule(rules) {
  for (let i = 0; i < rules.length; ++i) {
    if (Object.protoype.hasOwnProperty.call(rules[i], 'module')) {
      return true;
    }
  }
  return false;
}

function alternate(config, origin) {
  /**
   * Support simple mode of rules definition
   */
  if (config instanceof Array) {
    config = {
      rules: config
    };
  }

  return Object.assign({}, (origin || {}), {
    resolve: function(id, base, options) {
      /**
       * Search module testing rules
       */
      const isModuleRequired = isHasModule(config.rules);
      /**
       * For best performance resolve module only if config has module prop.
       */
      let module = isModuleRequired ? resolveId(id, base, options) : null;
      /**
       * Define holders and calculate two general properties [id] and [folder]
       */
      const holders = {
        "[id]": id, // Is required query string as is (for example ../fonts.css)
        "[folder]": path.parse(base).dir.split(path.sep).pop() // Is top directory of base path (for example app/components/(button))
      };
      /**
       * Flow rules
       */
      config.rules
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
        return rule.id.test(id) && rule.base.test(base) && rule.module.test(module)
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
        if (rule.to) {
          /**
           * Resolve path to file
           */
           return replace(rule.to, holders);
        } else {
          return path.resolve(replace(rule.path, holders), id);
        }
      });
    }
  });
}

module.exports = alternate;
