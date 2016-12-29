/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */
'use strict';
const resolveEngine = {
  resolver: function(id, base, config) {}
}

function resolveId(id, base, config) {
  return resolveEngine.resolveId(id, base, config);
}

resolveId.setResolver = function(fn) {
  resolveEngine.resolver = fn;
}

jest.mock('postcss-import/lib/resolve-id.js', resolveId);
