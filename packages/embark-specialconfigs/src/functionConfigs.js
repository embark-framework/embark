import { __ } from 'embark-i18n';
const Utils = require('./utils.js');

class FunctionConfigs {
  constructor(embark) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.config = embark.config;
  }

  async beforeAllDeployAction(cb) {
    try {
      const beforeDeployFn = this.config.contractsConfig.beforeDeploy;
      const logger = Utils.createLoggerWithPrefix(this.logger, 'beforeDeploy >');
      await beforeDeployFn({ logger });
      cb();
    } catch (err) {
      cb(new Error(`Error running beforeDeploy hook: ${err.message}`));
    }
  }

  async afterAllDeployAction(cb) {
    try {
      const logger = Utils.createLoggerWithPrefix(this.logger, 'afterAllDeploy >');
      const dependencies = await this.getDependenciesObject(logger);
      await this.config.contractsConfig.afterDeploy(dependencies);
      return cb();
    } catch (err) {
      return cb(new Error(`Error registering afterDeploy lifecycle hook: ${err.message}`));
    }
  }

  async doOnDeployAction(contract, cb) {
    try {
      const logger = Utils.createLoggerWithPrefix(this.logger, `${contract.className} > onDeploy >`);
      const dependencies = await this.getDependenciesObject(logger);
      await contract.onDeploy(dependencies);
      return cb();
    } catch (err) {
      return cb(new Error(`Error when registering onDeploy hook for ${contract.className}: ${err.message}`));
    }
  }

  async deployIfAction(params, cb) {
    const contract = params.contract;
    try {
      const logger = Utils.createLoggerWithPrefix(this.logger, 'deployIf >');
      const dependencies = await this.getDependenciesObject(logger);
      params.shouldDeploy = await contract.deployIf(dependencies);
      return cb(null, params);
    } catch (err) {
      return cb(new Error(`Error when registering deployIf hook for ${contract.className}: ${err.message}`));
    }
  }

  async beforeDeployAction(params, cb) {
    const beforeDeployFn = params.contract.beforeDeploy;
    const contract = params.contract;
    try {
      const logger = Utils.createLoggerWithPrefix(this.logger, 'beforeDeploy >');
      const dependencies = await this.getDependenciesObject(logger);
      await beforeDeployFn(dependencies);
      cb();
    } catch (e) {
      cb(new Error(`Error running beforeDeploy hook for ${contract.className}: ${e.message || e}`));
    }
  }

  getDependenciesObject(logger) {
    return new Promise(async (resolve, _reject) => {
      let contracts = await this.events.request2("contracts:list");

      let args = { contracts: {}, logger};
      for (let contract of contracts) {
        // TODO: for this to work correctly we need to add a default from address to the contract
        if (contract.deploy === false) continue;
        let contractInstance = await this.events.request2("runcode:eval", contract.className);
        args.contracts[contract.className] = contractInstance;
      }

      try {
        let web3Instance = await this.events.request2("runcode:eval", "web3");
        args.web3 = web3Instance;
      } catch (_err) {
      }

      resolve(args);
    });
  }

}

module.exports = FunctionConfigs;
