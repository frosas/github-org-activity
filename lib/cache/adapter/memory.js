'use strict';

var Q = require('q');
var NotFound = require('../not-found');

var Adapter = module.exports = function () {
    this._items = {};
};

Adapter.prototype.set = function (id, data) {
    this._items[id] = data;
    return Q();
};

Adapter.prototype.get = function (id) {
    return id in this._items ? Q(this._items[id]) : Q.reject(new NotFound);
};
