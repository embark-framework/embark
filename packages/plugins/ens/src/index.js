import {__} from 'embark-i18n';
import {recursiveMerge} from 'embark-utils';
const namehash = require('eth-ens-namehash');
const async = require('async');
import {ens} from 'embark-core/constants.json';
import {Utils as embarkJsUtils} from 'embarkjs';
import ensJS from 'embarkjs-ens';
import ensContractAddresses from './ensContractAddresses';
import EnsAPI from './api';
const ENSFunctions = ensJS.ENSFunctions;
const Web3 = require('web3');

const ensConfig = require('./ensContractConfigs');
const secureSend = embarkJsUtils.secureSend;

const reverseAddrSuffix = '.addr.reverse';
const ENS_WHITELIST = ens.whitelist;
const NOT_REGISTERED_ERROR = 'Name not yet registered';

// Price of ENS registration contract functions
const ENS_GAS_PRICE = 700000;

class ENS {
  constructor(embark, _options) {
    this.env = embark.env;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.config = embark.config;
    this.enabled = false;
    this.embark = embark;
    this.ensConfig = ensConfig;
    this.configured = false;
    this.initated = false;

    this.ensAPI = new EnsAPI(embark, {ens: this});

    this.events.request("namesystem:node:register", "ens", (readyCb) => {
      this.init(readyCb);
    }, this.executeCommand.bind(this));
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

  get web3DefaultAccount() {
    return (async () => {
      const web3 = await this.web3;
      if (!web3.eth.defaultAccount) {
        const accounts = await web3.eth.getAccounts();
        web3.eth.defaultAccount = accounts[0];
      }
      return web3.eth.defaultAccount;
    })();
  }

  async init(cb = () => {}) {
    if (this.initated || this.config.namesystemConfig === {} ||
      this.config.namesystemConfig.enabled !== true ||
      !this.config.namesystemConfig.available_providers ||
      this.config.namesystemConfig.available_providers.indexOf('ens') < 0) {
      return cb();
    }
    this.enabled = true;
    this.doSetENSProvider = this.config.namesystemConfig.provider === 'ens';

    this.registerActions();
    this.ensAPI.registerConsoleCommands();
    this.events.request("runcode:whitelist", 'eth-ens-namehash');
    this.initated = true;
    cb();
  }

  registerActions() {
    if (this.actionsRegistered) {
      return;
    }
    this.actionsRegistered = true;
    this.embark.registerActionForEvent("deployment:deployContracts:beforeAll", this.configureContractsAndRegister.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.modifyENSArguments.bind(this));
    this.embark.registerActionForEvent("deployment:deployContracts:afterAll", this.associateContractAddresses.bind(this));
    this.embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));
  }

  getEnsConfig() {
    return {
      env: this.env,
      registration: this.config.namesystemConfig.register,
      registryAbi: this.ensConfig.ENSRegistry.abiDefinition,
      registryAddress: this.ensConfig.ENSRegistry.deployedAddress,
      registrarAbi: this.ensConfig.FIFSRegistrar.abiDefinition,
      registrarAddress: this.ensConfig.FIFSRegistrar.deployedAddress,
      resolverAbi: this.ensConfig.Resolver.abiDefinition,
      resolverAddress: this.ensConfig.Resolver.deployedAddress
    };
  }

  executeCommand(command, args, cb) {
    switch (command) {
      case 'resolve': this.ensResolve(args[0], cb); break;
      case 'lookup': this.ensLookup(args[0], cb); break;
      case 'registerSubdomain': this.ensRegisterSubdomain(args[0], args[1], cb); break;
      default: cb(__('Unknown command %s', command));
    }
  }

  addArtifactFile(_params, cb) {
    const config = this.getEnsConfig();
    this.events.request("pipeline:register", {
      path: [this.config.embarkConfig.generationDir, 'config'],
      file: 'namesystem.json',
      format: 'json',
      content: Object.assign({}, this.embark.config.namesystemConfig, config)
    }, cb);
  }

  async setProviderAndRegisterDomains(cb = (() => {})) {
    const config = this.getEnsConfig();
    if (this.doSetENSProvider) {
      this.setupEmbarkJS(config);
    }

    const web3 = await this.web3;
    const networkId = await web3.eth.net.getId();
    const isKnownNetwork = Boolean(ensContractAddresses[networkId]);
    const shouldRegisterSubdomain = this.config.namesystemConfig.register && this.config.namesystemConfig.register.subdomains && Object.keys(this.config.namesystemConfig.register.subdomains).length;
    if (isKnownNetwork || !shouldRegisterSubdomain) {
      return cb();
    }

    this.registerConfigDomains(config, cb);
  }

  async setupEmbarkJS(config) {
    this.events.request("embarkjs:plugin:register", 'names', 'ens', 'embarkjs-ens');
    await this.events.request2("embarkjs:console:register", 'names', 'ens', 'embarkjs-ens');
    this.events.request("embarkjs:console:setProvider", 'names', 'ens', config);
  }

  async registerConfigDomains(config, cb) {
    const defaultAccount = await this.web3DefaultAccount;
    async.each(Object.keys(this.config.namesystemConfig.register.subdomains), (subDomainName, eachCb) => {
      const address = this.config.namesystemConfig.register.subdomains[subDomainName];
      const directivesRegExp = new RegExp(/\$(\w+\[?\d?\]?)/g);

      const directives = directivesRegExp.exec(address);
      if (directives && directives.length) {
        return eachCb();
      }
      this.safeRegisterSubDomain(subDomainName, address, defaultAccount, eachCb);
    }, cb);
  }

  async associateContractAddresses(params, cb) {
    if (!this.config.namesystemConfig.enabled) {
      return cb();
    }

    const defaultAccount = await this.web3DefaultAccount;

    await Promise.all(Object.keys(this.config.namesystemConfig.register.subdomains).map((subDomainName) => {
      return new Promise(async (resolve, _reject) => {
        const address = this.config.namesystemConfig.register.subdomains[subDomainName];
        const directivesRegExp = new RegExp(/\$(\w+\[?\d?\]?)/g);

        const directives = directivesRegExp.exec(address);
        if (!directives || !directives.length) {
          return resolve();
        }

        const contract = await this.events.request2("contracts:contract", directives[1]);
        if (!contract) {
          // if the contract is not registered in the config, it will be undefined here
          this.logger.error(__('Tried to register the subdomain "{{subdomain}}" as contract "{{contractName}}", ' +
            'but "{{contractName}}" does not exist. Is it configured in your contract configuration?', {
            contractName: directives[1],
            subdomain: subDomainName
          }));
          return resolve();
        }
        this.safeRegisterSubDomain(subDomainName, contract.deployedAddress, defaultAccount, (err) => {
          if (err) {
            this.logger.error(err);
          }
          resolve();
        });
      });
    }));

    cb();
  }

  safeRegisterSubDomain(subDomainName, address, defaultAccount, callback) {
    this.ensResolve(`${subDomainName}.${this.config.namesystemConfig.register.rootDomain}`, (error, currentAddress) => {
      if (currentAddress && currentAddress.toLowerCase() === address.toLowerCase()) {
        return callback();
      }

      if (error && error !== NOT_REGISTERED_ERROR) {
        this.logger.error(__('Error resolving %s', `${subDomainName}.${this.config.namesystemConfig.register.rootDomain}`));
        return callback(error);
      }

      const reverseNode = namehash.hash(address.toLowerCase().substr(2) + reverseAddrSuffix);
      this.registerSubDomain(defaultAccount, subDomainName, reverseNode, address.toLowerCase(), secureSend, callback);
    });
  }

  async registerSubDomain(defaultAccount, subDomainName, reverseNode, address, secureSend, cb) {
    const web3 = await this.web3;
    ENSFunctions.registerSubDomain(web3, this.ensContract, this.registrarContract, this.resolverContract, defaultAccount,
      subDomainName, this.config.namesystemConfig.register.rootDomain, reverseNode, address, this.logger, secureSend, cb, namehash);
  }

  createResolverContract(resolverAddress, callback) {
    this.events.request("blockchain:contract:create", {
      abi: this.ensConfig.Resolver.abiDefinition,
      address: resolverAddress
    }, (resolver) => {
      callback(null, resolver);
    });
  }

  async configureContractsAndRegister(_options, cb) {
    const NO_REGISTRATION = 'NO_REGISTRATION';
    const self = this;
    if (self.configured) {
      return cb();
    }
    const registration = this.config.namesystemConfig.register;
    const web3 = await this.web3;

    const networkId = await web3.eth.net.getId();

    if (ensContractAddresses[networkId]) {
      this.ensConfig = recursiveMerge(this.ensConfig, ensContractAddresses[networkId]);
    }

    this.ensConfig.ENSRegistry = await this.events.request2('contracts:add', this.ensConfig.ENSRegistry);
    await this.events.request2('deployment:contract:deploy', this.ensConfig.ENSRegistry);

    this.ensConfig.Resolver.args = [this.ensConfig.ENSRegistry.deployedAddress];
    this.ensConfig.Resolver = await this.events.request2('contracts:add', this.ensConfig.Resolver);
    await this.events.request2('deployment:contract:deploy', this.ensConfig.Resolver);

    async.waterfall([
      function checkRootNode(next) {
        if (!registration || !registration.rootDomain) {
          return next(NO_REGISTRATION);
        }
        if (!self.isENSName(registration.rootDomain)) {
          return next(__('Invalid domain name: {{name}}\nValid extensions are: {{extenstions}}',
            {name: registration.rootDomain, extenstions: ENS_WHITELIST.join(', ')}));
        }
        next();
      },
      function registrar(next) {
        const registryAddress = self.ensConfig.ENSRegistry.deployedAddress;
        const rootNode = namehash.hash(registration.rootDomain);
        self.ensConfig.FIFSRegistrar.args = [registryAddress, rootNode];

        self.events.request('contracts:add', self.ensConfig.FIFSRegistrar, (_err, contract) => {
          self.ensConfig.FIFSRegistrar = contract;
          self.events.request('deployment:contract:deploy', self.ensConfig.FIFSRegistrar, (err) => {
            return next(err);
          });
        });
      },
      function registerRoot(next) {
        let config = {
          registryAbi: self.ensConfig.ENSRegistry.abiDefinition,
          registryAddress: self.ensConfig.ENSRegistry.deployedAddress,
          registrarAbi: self.ensConfig.FIFSRegistrar.abiDefinition,
          registrarAddress: self.ensConfig.FIFSRegistrar.deployedAddress,
          resolverAbi: self.ensConfig.Resolver.abiDefinition,
          resolverAddress: self.ensConfig.Resolver.deployedAddress
        };

        async function send() {
          self.ensContract = new web3.eth.Contract(config.registryAbi, config.registryAddress);
          self.registrarContract = new web3.eth.Contract(config.registrarAbi, config.registrarAddress);
          self.resolverContract = new web3.eth.Contract(config.resolverAbi, config.resolverAddress);

          const defaultAccount = await self.web3DefaultAccount;

          const rootNode = namehash.hash(registration.rootDomain);
          const reverseNode = namehash.hash(defaultAccount.toLowerCase().substr(2) + reverseAddrSuffix);
          const owner = await self.ensContract.methods.owner(rootNode).call();

          if (owner === defaultAccount) {
            return next();
          }

          // Set defaultAccount as the owner of the Registry
          secureSend(web3, self.ensContract.methods.setOwner(rootNode, defaultAccount), {
            from: defaultAccount,
            gas: ENS_GAS_PRICE
          }, false).then(() => {
            // Set Registry's resolver to the one deployed above
            return secureSend(web3, self.ensContract.methods.setResolver(rootNode, config.resolverAddress), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then(() => {
            // Set reverse node's resolver to the one above (needed for reverse resolve)
            return secureSend(web3, self.ensContract.methods.setResolver(reverseNode, config.resolverAddress), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then(() => {
            // Set node to the default account in the resolver (means that the ENS node now resolves to the account)
            return secureSend(web3, self.resolverContract.methods.setAddr(rootNode, defaultAccount), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then(() => {
            // Set name of the reverse node to the root domain
            return secureSend(web3, self.resolverContract.methods.setName(reverseNode, registration.rootDomain), {
              from: defaultAccount,
              gas: ENS_GAS_PRICE
            }, false);
          }).then((_result) => {
            next();
          }).catch(err => {
            self.logger.error('Error while registering the root domain');
            if (err.message.indexOf('Transaction has been reverted by the EVM') > -1) {
              return next(__('Registration was rejected. Did you change the deployment account? If so, delete chains.json'));
            }
            next(err);
          });
        }
        send();
      }
    ], (err) => {
      self.configured = true;
      if (err && err !== NO_REGISTRATION) {
        self.logger.error('Error while deploying ENS contracts');
        self.logger.error(err.message || err);
        return cb(err);
      }
      self.ensAPI.registerAPIs();
      self.setProviderAndRegisterDomains(cb);
    });
  }

  modifyENSArguments(params, callback) {
    const self = this;

    function checkArgs(argus, cb) {
      async.map(argus, (arg, nextEachCb) => {
        if (Array.isArray(arg)) {
          return checkArgs(arg, nextEachCb);
        }

        if (!self.isENSName(arg)) {
          return nextEachCb(null, arg);
        }
        self.ensResolve(arg,  (err, address) => {
          if (err) {
            return nextEachCb(err);
          }
          nextEachCb(null, address);
        });
      }, cb);
    }

    checkArgs(params.contract.args, (err, realArgs) => {
      if (err) {
        return callback(err);
      }
      params.contract.args = realArgs;
      callback(null, params);
    });
  }

  ensResolve(name, cb) {
    ENSFunctions.resolveName(name, this.ensContract, this.createResolverContract.bind(this), cb, namehash);
  }

  ensLookup(address, cb) {
    ENSFunctions.lookupAddress(address, this.ensContract, namehash, this.createResolverContract.bind(this), cb);
  }

  ensRegisterSubdomain(subdomain, address, cb) {
    this.events.request("blockchain:defaultAccount:get", (_err, defaultAccount) => {
      this.safeRegisterSubDomain(subdomain, address, defaultAccount, cb);
    });
  }

  isENSName(name) {
    let test;
    if (typeof name !== 'string') {
      test = false;
    } else {
      test = ENS_WHITELIST.some(ensExt => name.endsWith(ensExt));
    }
    return test;
  }
}

module.exports = ENS;
