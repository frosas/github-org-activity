/* global describe, it */

'use strict';

var Cache = require('../../../lib/cache');
var assert = require('assert');
var Q = require('q');

describe('Cache', function () {
    describe('#get()', function () {
        it('calls onMiss() on miss', function () {
            var adapter = {
                set: function () { return Q(); },
                get: function () { return Q.reject(); }
            };
            return new Cache({adapter: adapter})
                .get('id', function () { return 'data'; })
                .then(function (data) { assert.equal(data, 'data'); });
        });
    });
});
