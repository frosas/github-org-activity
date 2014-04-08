### Installation

```bash
$ npm install
```

### Usage

```bash
$ export GITHUB_USER=<user>
$ export GITHUB_PASSWORD=$(read -s && echo $REPLY) # Type your password and hit enter
$ node index.js <org>
```

### TODO

- Convert Octonode errors to actual errors.
- Set different max concurrencies for cache (1) and for GitHub (100)
- Are branches considered?
