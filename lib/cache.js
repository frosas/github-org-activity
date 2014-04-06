'use strict';

var Q = require('q');

var Cache = module.exports = function (params) {
    this._adapter = params.adapter;
    this._logger = params.logger || function () {};
};

Cache.prototype.get = function (id, onMiss) {
    var cache = this;
    return this._adapter.get(id).catch(function (error) {
        cache._logger.warn(error);
        return Q(onMiss()).then(function (data) {
            return cache._adapter.set(id, data).then(
                function () { return data; },
                function (error) {
                    cache._logger.warn(error);
                    return data;
                }
            );
        });
    });
};
