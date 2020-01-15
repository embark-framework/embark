import { __ } from 'embark-i18n';
const {normalizeInput} = require('embark-utils');
import { BlockchainProcessLauncher } from './blockchainProcessLauncher';
import { BlockchainClient } from './blockchain';
import { ws, rpcWithEndpoint } from './check.js';
import DevTxs from "./devtxs";
const constants = require('embark-core/constants');

class Geth {
  constructor(embark, options) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.communicationConfig = embark.config.communicationConfig;
    // TODO get options from config instead of options
    this.locale = options.locale;
    this.logger = embark.logger;
    this.client = options.client;
    this.isDev = options.isDev;
    this.events = embark.events;
    this.plugins = options.plugins;

    if (!this.shouldInit()) {
      return;
    }

    this.events.request("blockchain:node:register", constants.blockchain.clients.geth, {
      isStartedFn: (isStartedCb) => {
        this._doCheck((state) => {
          return isStartedCb(null, state.status === "on");
        });
      },
      launchFn: (readyCb) => {
        this.events.request('processes:register', 'blockchain', {
          launchFn: (cb) => {
            this.startBlockchainNode(cb);
          },
          stopFn: (cb) => {
            this.stopBlockchainNode(cb);
          }
        });
        this.events.request("processes:launch", "blockchain", (err) => {
          if (err) {
            this.logger.error(`Error launching blockchain process: ${err.message || err}`);
          }
          this.setupDevTxs();
          readyCb();
        });
        this.registerServiceCheck();
      },
      stopFn: async (cb) => {
        await this.events.request2("processes:stop", "blockchain");
        cb();
      }
    });
  }

  async setupDevTxs() {
    const devTxs = new DevTxs(this.embark);
    await devTxs.init();
    try {
      await devTxs.startRegularTxs();
      this.logger.info("Regular transactions started");
    } catch (err) {
      this.logger.error(`Error starting regular transactions: ${err.message}`);
    }
  }

  shouldInit() {
    return (
      this.blockchainConfig.client === constants.blockchain.clients.geth &&
      this.blockchainConfig.enabled
    );
  }

  _getNodeState(err, version, cb) {
    if (err) return cb({ name: "Ethereum node not found", status: 'off' });

    let nodeName = "go-ethereum";
    let versionNumber = version.split("-")[0];
    let name = nodeName + " " + versionNumber + " (Ethereum)";
    return cb({ name, status: 'on' });
  }

  _doCheck(cb) {
    if (this.blockchainConfig.endpoint.startsWith('ws')) {
      return ws(this.blockchainConfig.endpoint, (err, version) => this._getNodeState(err, version, cb));
    }
    rpcWithEndpoint(this.blockchainConfig.endpoint, (err, version) => this._getNodeState(err, version, cb));
  }

  // TODO: need to get correct port taking into account the proxy
  registerServiceCheck() {
    this.events.request("services:register", 'Ethereum', (cb) => {
      this._doCheck(cb);
    }, 5000, 'off');
  }

  startBlockchainNode(callback) {
    if (this.blockchainConfig.isStandalone) {
      return new BlockchainClient(this.blockchainConfig, {
        clientName: 'geth',
        env: this.embark.env,
        certOptions: this.embark.config.webServerConfig.certOptions,
        logger: this.logger,
        events: this.events,
        isStandalone: true,
        fs: this.embark.fs
      }).run();
    }

    this.blockchainProcess = new BlockchainProcessLauncher({
      events: this.events,
      logger: this.logger,
      normalizeInput,
      blockchainConfig: this.blockchainConfig,
      locale: this.locale,
      client: this.client,
      isDev: this.isDev,
      embark: this.embark
    });

    this.blockchainProcess.startBlockchainNode(callback);
  }

  stopBlockchainNode(cb) {
    const message = __(`The blockchain process has been stopped. It can be restarted by running ${"service blockchain on".bold} in the Embark console.`);

    if (!this.blockchainProcess) {
      return cb();
    }

    this.blockchainProcess.stopBlockchainNode(() => {
      this.logger.info(message);
      cb();
    });
  }

}

module.exports = Geth;
