/* global describe, it */

'use strict';

var throttle = require('../../../lib/throttle');
var assert = require('assert');

describe('throttle()', function () {

    var func = function () { return 'value'; };

    it('throttles with max = 1 and 1 function', function () {
        return throttle(1, [func]).then(function (values) {
            assert.deepEqual(values, ['value']);
        });
    });

    it('throttles with max = 2 and 2 functions', function () {
        return throttle(2, [func, func]).then(function (values) {
            assert.deepEqual(values, ['value', 'value']);
        });
    });

    it('throttles with max = 1 and 3 functions', function () {
        return throttle(1, [func, func, func]).then(function (values) {
            assert.deepEqual(values, ['value', 'value', 'value']);
        });
    });
});
