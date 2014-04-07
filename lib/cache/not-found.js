'use strict';

var NotFound = module.exports = function () {
    this.message = 'Not found';
    this.stack = new Error().stack;
};

NotFound.prototype = Object.create(Error.prototype);
