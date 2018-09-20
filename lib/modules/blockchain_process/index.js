const async = require('async');
const utils = require('../../utils/utils.js');
const constants = require('../../constants');
const BlockchainProcessLauncher = require('./blockchainProcessLauncher');

class BlockchainModule {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractsConfig = embark.config.contractsConfig;
    this.embark = embark;
    this.locale = options.locale;
    this.isDev = options.isDev;

    this.registerBlockchainProcess();
  }

  registerBlockchainProcess() {
    const self = this;
    this.events.request('processes:register', 'blockchain', (cb) => {
      console.dir("gonna check node connection");
      self.assertNodeConnection(true, (connected) => {
        if (connected === undefined) {
          console.dir("result is undefined");
        } else {
          console.dir("result is " + connected.toString());
        }
        //if (!err) return cb();
        if (connected) return cb();
        console.dir("blockchain not started, so gonna start one");
        self.startBlockchainNode(cb);
      });
    });
  }

  assertNodeConnection(noLogs, cb) {
    if (typeof noLogs === 'function') {
      cb = noLogs;
      noLogs = false;
    }
    const self = this;

    async.waterfall([
      // check if web3 is set
      // 
      function checkWeb3State(next) {
        self.events.request("blockchain:web3:isReady", (connected) => {
          console.dir("---> checking web3 state");
          console.dir(connected.toString());
          if (connected) {
            return next(connected);
          }
          next();
        });
      },
      function pingEndpoint(next) {
        if (!self.contractsConfig || !self.contractsConfig.deployment || !self.contractsConfig.deployment.host) {
          return next();
        }
        const {host, port, type, protocol}  = self.contractsConfig.deployment;
        utils.pingEndpoint(host, port, type, protocol, self.blockchainConfig.wsOrigins.split(',')[0], next);
      }
    ], function (err, _result) {
      if (err === true || err === undefined) {
        return cb(true);
      }
      return cb(false);
    });
  }

  startBlockchainNode(callback) {
    console.dir("||==> startBlockchainNode");
    const self = this;
    let blockchainProcess = new BlockchainProcessLauncher({
      events: self.events,
      logger: self.logger,
      normalizeInput: utils.normalizeInput,
      blockchainConfig: self.blockchainConfig,
      locale: self.locale,
      isDev: self.isDev
    });

    blockchainProcess.startBlockchainNode();
    self.events.once(constants.blockchain.blockchainReady, () => {
      console.dir("||==> blockchainReady");
      callback();
    });
    self.events.once(constants.blockchain.blockchainExit, () => {
      console.dir("||==> blockchainExit");
      self.provider.stop();
      callback();
    });
  }

}

module.exports = BlockchainModule;
