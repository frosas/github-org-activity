'use strict';

var Q = require('q');

var Cache = module.exports = function (params) {
    this._adapter = params.adapter;
    this._logger = params.logger;
};

Cache.prototype.get = function (id, onMiss) {
    var cache = this;
    return this._adapter.get(id).catch(function (error) {
        if (cache._logger) cache._logger.error(error);
        return Q(onMiss()).then(function (data) {
            return cache._adapter.set(id, data).then(
                function () { return data; },
                function (error) {
                    if (cache._logger) cache._logger.error(error);
                    return data;
                }
            );
        });
    });
};
