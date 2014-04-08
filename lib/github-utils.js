'use strict';

var Q = require('q');
var _ = require('lodash');

module.exports.getAllOrgRepos = function(github, org) {
    var repos = [];
    return (function getPage(page) {
        return Q.nsend(github.org(org), 'repos', page, 100).spread(function(pageRepos) {
            repos = repos.concat(pageRepos);
            return pageRepos.length ? getPage(page + 1) : repos;
        });
    })(1);
};

/**
 * @param {octonode.client} github
 * @param {string} repo As ':user/:repo'
 */
module.exports.getContribsByRepoAndUser = function (github, repo) {
    var utils = this;
    return Q.nsend(github, 'get', '/repos/' + repo + '/stats/contributors')
        .spread(function(status, contribs) {
            // "If the data hasn’t been cached when you query a repository’s statistics,
            // you’ll receive a 202 response; a background job is also fired to
            // start compiling these statistics. Give the job a few moments to complete,
            // and then submit the request again."
            if (status == 202) {
                return Q.delay(10000).then(function () {
                    return utils.getContribsByRepoAndUser(github, repo);
                });
            }

            return contribs;
        });
};

/**
 * @param {Array} contribs As obtained from /repos/:org/:repo/stats/contributions
 */
module.exports.getContribsByUser = function (contribs) {
    return _(contribs)
        .map(function(contrib) {
            return {
                user: contrib.author.login,
                total: contrib.total,
                commits: _(contrib.weeks)
                    .sortBy('w')
                    .last(4)
                    .reduce(function(total, weeklyContribs) {
                        return total + weeklyContribs.c;
                    }, 0)
            };
        })
        .sortBy('commits')
        .reverse()
        .value();
};
