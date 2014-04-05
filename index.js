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

githubUtils.getAllOrgRepos(github, org)
    .then(function(repos) {
        console.log('repos', repos.length);
        return Q.all(repos.map(function(repo) {
            return githubUtils.getContribsByRepoAndUser(github, org + '/' + repo.name);
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
