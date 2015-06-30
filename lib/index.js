var hashmerge = require('hashmerge');
var readYaml = require('read-yaml');
var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');
var express = require('express');
var compression = require('compression');
var commander = require('commander');
var wrench = require('wrench');
var python = require('python');
var syncMe = require('sync-me');
var methodmissing = require('methodmissing');
var jasmine = require('jasmine');

embark = {}
embark.Tests = require('./test.js');
embark.Blockchain = require('./blockchain.js');
embark.Deploy = require('./deploy.js');
embark.Release = require('./ipfs.js');
embark.Config = require('./config/config.js');

module.exports = embark;

