'use strict';

var Q = require('q');

module.exports = function (max, funcs) {
    var throttled = Q.defer();
    var initialFuncs = funcs.slice(0, Math.min(max, funcs.length));
    var remainingFuncs = funcs.slice(initialFuncs.length);
    var runSerially = function (func) {
        return Q(func()).finally(function () {
            var nextFunc = remainingFuncs.shift();
            if (nextFunc) {
                promises.push(runSerially(nextFunc).catch(function (error) {
                    throttled.reject(error);
                    throw error;
                }));
            } else {
                Q.all(promises).then(throttled.resolve);
            }
        });
    };
    var promises = initialFuncs.map(runSerially);
    return throttled.promise;
};
