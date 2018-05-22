var async = require('async');
//require("../utils/debug_util.js")(__filename, async);
var Web3 = require('web3');
var Engine = require('../core/engine.js');
var RunCode = require('../core/runCode.js');
var TestLogger = require('./test_logger.js');

var getSimulator = function() {
  try {
    var sim = require('ethereumjs-testrpc');
    return sim;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(__('Simulator not found; Please install it with "%s"', 'npm install ethereumjs-testrpc --save'));
      console.log(__('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "%s"', 'npm install ethereumjs-testrpc@2.0 --save'));
      console.log('For more information see https://github.com/ethereumjs/testrpc');
      // TODO: should throw exception instead
      return process.exit();
    }
    console.log("==============");
    console.log(__("Tried to load testrpc but an error occurred. This is a problem with testrpc"));
    console.log(__('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "%s". Alternatively install node 6.9.1 and the testrpc 3.0', 'npm install ethereumjs-testrpc@2.0 --save'));
    console.log("==============");
    throw e;
  }
};

var Test = function(options) {
  this.options = options || {};
  this.simOptions = this.options.simulatorOptions || {};

  this.engine = new Engine({
    env: this.options.env || 'test',
    // TODO: confi will need to detect if this is a obj
    embarkConfig: this.options.embarkConfig || 'embark.json',
    interceptLogs: false
  });

  this.engine.init({
    logger: new TestLogger({logLevel: 'debug'})
  });

  this.web3 = new Web3();
  
  if (this.simOptions.node) {
    this.web3.setProvider(new this.web3.providers.HttpProvider(this.simOptions.node));
  } else {
    this.sim = getSimulator();
    this.web3.setProvider(this.sim.provider(this.simOptions));
  }
};

Test.prototype.getAccounts = function(cb) {
  this.web3.eth.getAccounts(function(err, accounts) {
    cb(err, accounts);
  });
};

Test.prototype.deployAll = function(contractsConfig, cb) {
  var self = this;
  
  async.waterfall([
      function getConfig(callback) {
        let _versions_default = self.engine.config.contractsConfig.versions;
        self.engine.config.contractsConfig = {contracts: contractsConfig, versions: _versions_default};
        callback();
      },
      function startServices(callback) {
        //{abiType: 'contracts', embarkJS: false}
        self.engine.startService("libraryManager");
        self.engine.startService("codeGenerator");
        self.engine.startService("web3", {
          web3: self.web3
        });
        self.engine.startService("deployment", {
          trackContracts: false
        });
        callback();
      },
      function deploy(callback) {
        self.engine.events.on('code-generator-ready', function () {
          self.engine.events.request('code-contracts-vanila', function(vanillaABI) {
            callback(null, vanillaABI);
          });
        });

        self.engine.deployManager.gasLimit = 6000000;
        self.engine.contractsManager.gasLimit = 6000000;
        self.engine.deployManager.fatalErrors = true;
        self.engine.deployManager.deployOnlyOnConfig = true;
        self.engine.deployManager.deployContracts(function(err, _result) {
          if (err) {
            callback(err);
          }
        });
      }
  ], function(err, result) {
    if (err) {
      console.log(__('terminating due to error'));
      process.exit(1);
    }
    // this should be part of the waterfall and not just something done at the
    // end
    self.web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        throw new Error(err);
      }
      self.web3.eth.defaultAccount = accounts[0];
      RunCode.doEval(result, {web3: self.web3});
      //cb();
      cb(accounts);
    });
  });
};

module.exports = Test;
