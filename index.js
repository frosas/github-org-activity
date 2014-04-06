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
var githubUtils = require('./lib/github-utils');
var Cache = require('./lib/cache');
var CacheFileAdapter = require('./lib/cache/adapter/file');
var throttle = require('./lib/throttle');

// Improve stack traces
require('longjohn');
Q.longStackSupport = true;

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

var cache = new Cache({
    adapter: new CacheFileAdapter({dir: 'cache'})
});

cache
    .get('org-' + org, function () {
        return githubUtils.getAllOrgRepos(github, org);
    })
    .then(function(repos) {
        return throttle(1, repos.map(function(repo) {
            return function () {
                var fullRepoName = org + '/' + repo.name;
                return cache
                    .get('repo-' + fullRepoName, function () {
                        return githubUtils.getContribsByRepoAndUser(github, fullRepoName);
                    })
                    .then(function (contribs) {
                        return {
                            repo: fullRepoName,
                            contribs: githubUtils.getContribsByUser(contribs)
                        };
                    });
            };
        }));
    })
    .then(function(contribs) {
        var contribsByUser = contribs.reduce(function(byUser, repoContribs) {
            repoContribs.contribs.forEach(function(userContribs) {
                if (!userContribs.commits) return;
                byUser[userContribs.user] = byUser[userContribs.user] || {};
                byUser[userContribs.user][repoContribs.repo] = userContribs.commits;
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
