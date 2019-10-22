import { __ } from 'embark-i18n';
import {buildUrl, deconstructUrl, recursiveMerge} from "embark-utils";
const assert = require('assert').strict;
const async = require('async');
const chalk = require('chalk');
const path = require('path');
const { dappPath } = require('embark-utils');
import cloneDeep from "lodash.clonedeep";
const constants = require('embark-core/constants');
const Web3 = require('web3');
const deepEqual = require('deep-equal');

const coverage = require('istanbul-lib-coverage');
const reporter = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const Reporter = require('./reporter');

class TestRunner {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.fs = embark.fs;
    this.runners = [];
    this.files = [];

    this.configObj = embark.config;
    this.originalConfigObj = cloneDeep(embark.config);
    this.simOptions = {};

    this.events.setCommandHandler('tests:run', (options, callback) => {
      this.run(options, callback);
    });

    this.events.setCommandHandler('tests:runner:register', (pluginName, matchFn, addFn, runFn) => {
      // We unshift to give priority to runners registered after the default ones, making it
      // possible to override the ones Embark ships with. This will open the door for things
      // like Jest tests and such.
      this.runners.unshift({pluginName, matchFn, addFn, runFn});
    });

    this.events.setCommandHandler('tests:deployment:check', this.checkDeploymentOptions.bind(this));
    this.events.setCommandHandler('tests:blockchain:start', this.startBlockchainNode.bind(this));
  }

  run(options, cb) {
    const reporter = new Reporter(this.embark);
    const testPath = options.file || "test";

    this.setupGlobalVariables();

    async.waterfall([
      (next) => {
        this.events.request("config:contractsConfig:set", Object.assign(this.configObj.contractsConfig, {explicit: true}), next);
      },
      (next) => {
        this.getFilesFromDir(testPath, next);
      },
      (files, next) => {
        for(const file of files) {
          const runner = this.runners.find(r => r.matchFn(file));

          if (!runner) {
            this.logger.warn(`No runners registered for '${file}'`);
            continue;
          }

          runner.addFn(file);
        }

        next();
      },
      (next) => {
        reporter.header();

        options.reporter = reporter;
        const runnerFns = this.runners.map((runner) => {
          return (_cb) => { runner.runFn(options, _cb); };
        });

        async.series(runnerFns, next);
      }
    ], (err) => {
      reporter.footer();

      if (!options.coverage) {
        return cb(err, reporter.passes, reporter.fails);
      }

      try {
        this.generateCoverageReport();
        process.stdout.write(chalk`{blue Coverage report created. You can find it here:}\n{white.underline ${dappPath('coverage/index.html')}}\n`);

        if (options.noBrowser) {
          return cb(err, reporter.passes, reporter.fails);
        }

        const open = require('open');
        open(dappPath('coverage/index.html')).then(() => {
          cb(err, reporter.passes, reporter.fails);
        });
      } catch(e) {
        process.stdout.write(chalk`{red Coverage report could not be created:}\n{white ${e.message}}\n`);
        cb(e, reporter.passes, reporter.fails);
      }
    });
  }

  setupGlobalVariables() {
    assert.reverts = async function(method, params = {}, message) {
      if (typeof params === 'string') {
        message = params;
        params = {};
      }
      try {
        await method.send(params);
      } catch (error) {
        if (message) {
          assert.strictEqual(error.message, message);
        } else {
          assert.ok(error);
        }
        return;
      }
      assert.fail('Method did not revert');
    };

    assert.eventEmitted = function(transaction, event, values) {
      if (!transaction.events) {
        return assert.fail('No events triggered for the transaction');
      }
      if (values === undefined || values === null || !transaction.events[event]) {
        return assert.ok(transaction.events[event], `Event ${event} was not triggered`);
      }
      if (Array.isArray(values)) {
        values.forEach((value, index) => {
          assert.strictEqual(transaction.events[event].returnValues[index], value, `Value at index ${index} incorrect.\n\tExpected: ${value}\n\tActual: ${transaction.events[event].returnValues[index]}`);
        });
        return;
      }
      if (typeof values === 'object') {
        Object.keys(values).forEach(key => {
          assert.strictEqual(transaction.events[event].returnValues[key], values[key], `Value at key "${key}" incorrect.\n\tExpected: ${values[key]}\n\tActual: ${transaction.events[event].returnValues[key]}`);
        });
      }
    };

    global.assert = assert;

    global.embark = this.embark;

    global.increaseTime = async (amount) => {
      await this.evmMethod("evm_increaseTime", [Number(amount)]);
      await this.evmMethod("evm_mine");
    };
  }

  generateCoverageReport() {
    const coveragePath = dappPath(".embark", "coverage.json");
    const coverageMap = JSON.parse(this.fs.readFileSync(coveragePath));
    const map = coverage.createCoverageMap(coverageMap);
    const tree = reporter.summarizers.nested(map);

    const ctx = reporter.createContext({ dir: 'coverage' });
    const report = reports.create('html', { skipEmpty: false, skipFull: false });

    tree.visit(report, ctx);
  }

  getFilesFromDir(filePath, cb) {
    const {fs} = this;

    fs.stat(filePath, (err, fileStat) => {
      const errorMessage = `File "${filePath}" doesn't exist or you don't have permission to it`.red;
      if (err) {
        return cb(errorMessage);
      }
      let isDirectory = fileStat.isDirectory();
      if (isDirectory) {
        return fs.readdir(filePath, (err, files) => {
          if (err) {
            return cb(err);
          }
          async.map(files, (file, _cb) => {
            this.getFilesFromDir(path.join(filePath, file), _cb);
          }, (err, arr) => {
            if (err) {
              return cb(errorMessage);
            }
            cb(null, arr.reduce((a,b) => a.concat(b), []));
          });
        });
      }
      cb(null, [filePath]);
    });
  }

  async checkDeploymentOptions(config, options, cb = () => {}) {
    let resetServices = false;
    const blockchainConfig = config.blockchain || {};
    let {host, port, type, protocol} = blockchainConfig.endpoint ? deconstructUrl(blockchainConfig.endpoint) : {};
    const accounts = blockchainConfig.accounts;

    if (host && port && !['rpc', 'ws'].includes(type)) {
      return cb(__("contracts config error: unknown deployment type %s", type));
    }

    if (!type) {
      type = constants.blockchain.vm;
    }

    if (port !== this.simOptions.port || type !== this.simOptions.type || host !== this.simOptions.host) {
      resetServices = true;
    }

    const ogAccounts = this.simOptions.accounts;
    Object.assign(this.simOptions, {host, port, type, protocol, accounts, client: config.blockchain && config.blockchain.client});

    if (!resetServices && !deepEqual(accounts, ogAccounts)) {
      return this.plugins.emitAndRunActionsForEvent("accounts:reseted", {accounts}, cb);
    }

    if (!resetServices) {
      return cb();
    }

    const provider = await this.startBlockchainNode(options);
    cb(null, provider);
    return provider;
  }

  async startBlockchainNode(options, cb = () => {}) {
    let node = options.node;
    if (!this.simOptions.host && (node && node === constants.blockchain.vm)) {
      this.simOptions.type = constants.blockchain.vm;
      this.simOptions.client = constants.blockchain.vm;
    } else if (this.simOptions.host || (node && node !== constants.blockchain.vm)) {
      let options = this.simOptions;
      if (node && node !== constants.blockchain.vm) {
        options = deconstructUrl(node);
      }

      if (!options.protocol) {
        options.protocol = (options.type === "rpc") ? 'http' : 'ws';
      }
      Object.assign(this.simOptions, options);
      node = null;
    }

    this.configObj.blockchainConfig = recursiveMerge({}, this.originalConfigObj.blockchainConfig, {
      endpoint: this.simOptions.host ? buildUrl(this.simOptions.protocol, this.simOptions.host, this.simOptions.port, this.simOptions.type) : null,
      type: this.simOptions.type,
      accounts: this.simOptions.accounts,
      coverage: options.coverage
    });
    if (this.simOptions.client) {
      this.configObj.blockchainConfig.client = this.simOptions.client;
    }
    this.logger.trace('Setting blockchain configs:', this.configObj.blockchainConfig);
    await this.events.request2('config:blockchainConfig:set', this.configObj.blockchainConfig);

    try {
      await this.events.request2("blockchain:node:stop");
    } catch (e) {
      // Nothing to do here, the node probably wasn't even started
    }

    await this.events.request2("blockchain:node:start", this.configObj.blockchainConfig);
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    cb(null, provider);
    return provider;
  }

  get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  evmMethod(method, params = []) {
    return new Promise(async (resolve, reject) => {
      const web3 = await this.web3;
      const sendMethod = (web3.currentProvider.sendAsync) ? web3.currentProvider.sendAsync.bind(web3.currentProvider) : web3.currentProvider.send.bind(web3.currentProvider);
      sendMethod(
        {
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now().toString().substring(9)
        },
        (error, res) => {
          if (error) {
            return reject(error);
          }
          resolve(res.result);
        }
      );
    });
  }
}

module.exports = TestRunner;
