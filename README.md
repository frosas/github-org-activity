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

- Show stack traces on errors. It seems response objects are being thrown instead.
