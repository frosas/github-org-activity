'use strict';

var fs = require('fs');
var Q = require('q');
var md5 = require('MD5');

var Adapter = module.exports = function (params) {
    params = params || {};
    this._dir = params.dir || '.';
};

Adapter.prototype.get = function (id) {
    return Q.nsend(fs, 'readFile', this._getItemFile(id))
        .then(function (serializedData) { return JSON.parse(serializedData); });
};

Adapter.prototype.set = function (id, data) {
    var serializedData = JSON.stringify(data, null, 4);
    return Q.nsend(fs, 'writeFile', this._getItemFile(id), serializedData);
};

Adapter.prototype._getItemFile = function (id) {
    var fsFriendlyName = String(id).replace(/[^a-z0-9_\-\.]+/g, '-');
    return this._dir + '/cache-' + fsFriendlyName + '-' + md5(id) + '.json';
};