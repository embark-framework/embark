import {__} from 'embark-i18n';
import {AddressUtils} from 'embark-utils';
const async = require('async');
const Web3 = require('web3');
const embarkJsUtils = require('embarkjs').Utils;
const {ZERO_ADDRESS} = AddressUtils;

class EthereumBlockchainClient {

  constructor(embark, _options) {
    this.embark = embark;
    this.events = embark.events;

    this.embark.registerActionForEvent("deployment:contract:deployed", this.addContractJSONToPipeline.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.determineArguments.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.doLinking.bind(this));
    this.events.request("blockchain:client:register", "ethereum", this.getClient.bind(this));
    this.events.request("deployment:deployer:register", "ethereum", this.deployer.bind(this));
  }

  getClient() {
    return {};
  }

  async deployer(contract, done) {
    let provider = await this.events.request2("blockchain:client:provider", "ethereum");
    var web3 = new Web3(provider);
    // var web3 = new Web3("ws://localhost:8556")
    // web3.eth.getAccounts().then((accounts) => {
    let accounts = await web3.eth.getAccounts();
    let account = accounts[0];
    // let contractObject = this.blockchain.ContractObject({abi: contract.abiDefinition});
    console.dir("== ethereum contract deployer");
    let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.address);
    // let deployObject = this.blockchain.deployContractObject(contractObject, {arguments: contractParams, data: dataCode});
    let contractObject = contractObj.deploy({ arguments: (contract.args || []), data: ("0x" + contract.code) });

    if (contract.gas === 'auto' || !contract.gas) {
      let gasValue = await contractObject.estimateGas();
      let increase_per = 1 + (Math.random() / 10.0);
      contract.gas = Math.floor(gasValue * increase_per);
    }

    if (!contract.gasPrice) {
      let gasPrice = await web3.eth.getGasPrice();
      contract.gasPrice = contract.gasPrice || gasPrice;
    }

    // this.blockchain.deployContractFromObject(deployObject,
    console.dir({ arguments: contract.args, data: ("0x" + contract.code) });
    console.dir("------- send");

    embarkJsUtils.secureSend(web3, contractObject, {
      from: account, gas: contract.gas
    }, true, (err, receipt) => {
      if (err) {
        return done(err);
      }
      contract.deployedAddress = receipt.contractAddress;
      contract.transactionHash = receipt.transactionHash;
      done();
    }, (hash) => {
      console.dir('hash is ' + hash);
    });
    // })
  }

  async doLinking(params, callback) {
    let contract = params.contract;

    console.dir("= doLinking");

    if (!contract.linkReferences || !Object.keys(contract.linkReferences).length) {
      return callback(null, params);
    }
    let contractCode = contract.code;
    let offset = 0;

    async.eachLimit(contract.linkReferences, 1, (fileReference, eachCb1) => {
      async.eachOfLimit(fileReference, 1, (references, libName, eachCb2) => {
        let libContract = self.events.request2("contracts:contract", libName);

        async.eachLimit(references, 1, (reference, eachCb3) => {
          if (!libContract) {
            return eachCb3(new Error(__('{{contractName}} has a link to the library {{libraryName}}, but it was not found. Is it in your contract folder?'), {
              contractName: contract.className,
              libraryName: libName
            }));
          }

          let libAddress = libContract.deployedAddress;
          if (!libAddress) {
            return eachCb3(new Error(__("{{contractName}} needs {{libraryName}} but an address was not found, did you deploy it or configured an address?", {
              contractName: contract.className,
              libraryName: libName
            })));
          }

          libAddress = libAddress.substr(2).toLowerCase();

          // Multiplying by two because the original pos and length are in bytes, but we have an hex string
          contractCode = contractCode.substring(0, (reference.start * 2) + offset) + libAddress + contractCode.substring((reference.start * 2) + offset + (reference.length * 2));
          // Calculating an offset in case the length is at some point different than the address length
          offset += libAddress.length - (reference.length * 2);

          eachCb3();
        }, eachCb2);
      }, eachCb1);
    }, (err) => {
      contract.code = contractCode;
      callback(err, params);
    });
  }

  // TODO we can separate this into 3 separate methods, which will make it easier to test
  // determineArguments(suppliedArgs, contract, accounts, callback) {
  async determineArguments(params, callback) {
    const suppliedArgs = params.contract.args;
    const contract = params.contract;
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

    const self = this;

    let args = suppliedArgs;
    if (!Array.isArray(args)) {
      args = [];
      let abi = contract.abiDefinition.find((abi) => abi.type === 'constructor');

      for (let input of abi.inputs) {
        let inputValue = suppliedArgs[input.name];
        if (!inputValue) {
          this.logger.error(__("{{inputName}} has not been defined for {{className}} constructor", {inputName: input.name, className: contract.className}));
        }
        args.push(inputValue || "");
      }
    }

    function parseArg(arg, cb) {
      const match = arg.match(/\$accounts\[([0-9]+)]/);
      if (match) {
        if (!accounts[match[1]]) {
          return cb(__('No corresponding account at index %d', match[1]));
        }
        return cb(null, accounts[match[1]]);
      }
      let contractName = arg.substr(1);
      self.events.request('contracts:contract', contractName, (err, referedContract) => {
        // Because we're referring to a contract that is not being deployed (ie. an interface),
        // we still need to provide a valid address so that the ABI checker won't fail.
        cb(err, (referedContract.deployedAddress || ZERO_ADDRESS));
      });
    }

    function checkArgs(argus, cb) {
      async.map(argus, (arg, nextEachCb) => {
        if (Array.isArray(arg)) {
          return checkArgs(arg, nextEachCb);
        }
        if (arg[0] === "$") {
          return parseArg(arg, nextEachCb);
        }
        nextEachCb(null, arg);
      }, cb);
    }

    checkArgs(args, (err, realArgs) => {
      if (err) {
        return callback(err);
      }
      params.contract.args = realArgs;
      callback(null, params);
    });
  }

  addContractJSONToPipeline(params, cb) {
    console.dir("-- addContractJSONToPipeline");
    // TODO: check if this is correct json object to generate
    const contract = params.contract;

    this.events.request("pipeline:register", {
      path: [this.embark.config.embarkConfig.buildDir, 'contracts'],
      file: contract.className + '.json',
      format: 'json',
      content: contract
    }, cb);
  }

}

module.exports = EthereumBlockchainClient;
