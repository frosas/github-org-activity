/**
 * Usage:
 * $ export GITHUB_USER=<user>
 * $ export GITHUB_PASSWORD=`cat` # Type your password, hit enter and Ctrl+D
 * $ node index.js <org>
 */

/* global process */

'use strict';

var Q = require('q');
var octonode = require('octonode');
var _ = require('lodash');

Q.longStackSupport = true;
Q.onerror = function (error) {
    console.log(error);
};

var user = process.env.GITHUB_USER;
var password = process.env.GITHUB_PASSWORD;
var org = process.argv[2] || user;
var github = octonode.client({
    username: user,
    password: password
});

Q.nsend(github, 'limit').spread(function(left, max) {
    console.log('limit left', left, 'max', max);
}).done();

var getAllOrgRepos = function(github, org) {
    var repos = [];
    return (function getPage(page) {
        console.log('page', page);
        return Q.nsend(github.org(org), 'repos', page, 100).spread(function(pageRepos) {
            repos = repos.concat(pageRepos);
            return pageRepos.length ? getPage(page + 1) : repos;
        });
    })(1);
};

var sortMap = function (map, callback) {
    return _(map)
        .map(function (value, key) {
            return {key: key, value: value};
        })
        .sortBy(function (element) {
            return callback(element.value, element.key);
        })
        .reduce(function () {

        })
        .value();
};

/**
 * @param {Array} contribs As obtained from /repos/:org/:repo/stats/contributions
 */
var getLastWeekContribsByUser = function (contribs) {
    return _(contribs)
        .map(function(contrib) {
            return {
                user: contrib.author.login,
                total: contrib.total,
                commitsThisWeek: _(contrib.weeks)
                    .sortBy('w')
                    .last()
                    .c
            };
        })
        .sortBy('commitsThisWeek')
        .reverse()
        .value();
};

/**
 * @param {octonode.client} github
 * @param {string} repo As ':user/:repo'
 */
var getLastWeekContribsByRepoAndUser = function (github, repo) {
    return Q.nsend(github, 'get', '/repos/' + repo + '/stats/contributors')
        .spread(function(status, contribs) {
            console.log('repo contribs', repo);
            return getLastWeekContribsByUser(contribs);
        })
        .then(function(contribs) {
            return {repo: repo, contributions: contribs};
        });
};

getAllOrgRepos(github, org)
    .then(function(repos) {
        console.log('repos', repos.length);
        return Q.all(repos.map(function(repo) {
            return getLastWeekContribsByRepoAndUser(github, org + '/' + repo.name);
        }));
    })
    .then(function(contributions) {
        var contribsByUser = contributions.reduce(function(byUser, repoContributions) {
            repoContributions.contributions.forEach(function(userContributions) {
                if (userContributions.commitsThisWeek) {
                    byUser[userContributions.user] = byUser[userContributions.user] || {};
                    byUser[userContributions.user][repoContributions.repo] = userContributions.commitsThisWeek;
                }
            });
            return byUser;
        }, {});

        contribsByUser = _(contribsByUser)
            .map(function(contribs, user) {
                contribs.total = _.reduce(contribs, function(total, repoTotal) {
                    return total + repoTotal;
                }, 0);
                return {
                    user: user,
                    contribs: contribs
                };
            })
            .sortBy(function(userContribs) {
                return -userContribs.contribs.total;
            })
            .value();

        console.log(contribsByUser);
    })
    .done();
