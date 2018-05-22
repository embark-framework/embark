let fs = require('../core/fs.js');
let utils = require('../utils/utils.js');

class DeployTracker {
  constructor(options, cb) {
    const self = this;
    this.logger = options.logger;
    this.env = options.env;
    this.chainConfig = options.chainConfig;
    this.blockchain = options.blockchain;

    if (this.chainConfig === false) {
      this.currentChain = {contracts: []};
      return cb();
    }

    this.blockchain.getBlock(0, function(err, block) {
      let chainId = block.hash;

      if (self.chainConfig[chainId] === undefined) {
        self.chainConfig[chainId] = {contracts: {}};
      }

      self.currentChain = self.chainConfig[chainId];

      self.currentChain.name = self.env;
      cb();
    });

    // TODO: add other params
    //this.currentChain.networkId = "";
    //this.currentChain.networkType = "custom"
  }

  loadConfig(config) {
    this.chainConfig = config;
    return this;
  }

  trackContract(contractName, code, args, address) {
    this.currentChain.contracts[utils.sha3(code + contractName + args.join(','))] = {
      name: contractName,
      address: address
    };
  }

  getContract(contractName, code, args) {
    let contract = this.currentChain.contracts[utils.sha3(code + contractName + args.join(','))];
    if (contract && contract.address === undefined) {
      return false;
    }
    return contract;
  }

  // TODO: abstract this
  // chainConfig can be an abstract PersistentObject
  save() {
    if (this.chainConfig === false) {
      return;
    }
    fs.writeJSONSync("./chains.json", this.chainConfig, {spaces: 2});
  }
}

module.exports = DeployTracker;
