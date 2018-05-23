const program = require('commander');
const promptly = require('promptly');
const utils = require('./utils/utils.js');
const Embark = require('../lib/index');
const i18n = require('./i18n/i18n.js');
const container = require('./ioc/container');

class Cmd {
  constructor() {
    this.version = require('../package.json').version;
    program.version(this.version);
  }

  process(args) {
    this.newApp();
    this.demo();
    this.build();
    this.run();
    this.blockchain();
    this.simulator();
    this.test();
    this.reset();
    this.graph();
    this.upload();
    this.versionCmd();
    this.otherCommands();

    //If no arguments are passed display help by default
    if (!process.argv.slice(2).length) {
      program.help();
    }

    program.parse(args);
  }

  newApp() {

    let validateName = function (value) {
      try {
        if (value.match(/^[a-zA-Z\s-]+$/)) return value;
      } catch (e) {
        throw new Error(__('Name must be only letters, spaces, or dashes'));
      }
    };

    program
      .command('new [name]')
      .description(__('New Application'))
      .option('--simple', __('create a barebones project meant only for contract development'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .action(function (name, options) {
        i18n.setOrDetectLocale(options.locale);
        this.embark = container.resolve(Embark);
        if (name === undefined) {
          return promptly.prompt(__("Name your app (default is %s):", 'embarkDapp'), {
            default: "embarkDApp",
            validator: validateName
          }, function (err, inputvalue) {
            if (err) {
              console.error(__('Invalid name') + ':', err.message);
              // Manually call retry
              // The passed error has a retry method to easily prompt again.
              err.retry();
            } else {
              //slightly different assignment of name since it comes from child prompt
              if (options.simple) {
                this.embark.generateTemplate('simple', './', inputvalue);
              } else {
                this.embark.generateTemplate('boilerplate', './', inputvalue);
              }
            }
          });
        } else {
          if (options.simple) {
            this.embark.generateTemplate('simple', './', name);
          } else {
            this.embark.generateTemplate('boilerplate', './', name);
          }
        }
      });
  }

  demo() {
    program
      .command('demo')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('create a working dapp with a SimpleStorage contract'))
      .action(function (options) {
        i18n.setOrDetectLocale(options.locale);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.generateTemplate('demo', './', 'embark_demo');
      });
  }

  build() {
    program
      .command('build [environment]')
      .option('--contracts', 'only compile contracts into Embark wrappers')
      .option('--logfile [logfile]', __('filename to output logs (default: none)'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('deploy and build dapp at ') + 'dist/ (default: development)')
      .action(function (env, _options) {
        i18n.setOrDetectLocale(_options.locale);
        _options.env = env || 'development';
        container.bind('logFile').toConstantValue(_options.logfile);
        container.bind('logLevel').toConstantValue(_options.loglevel);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.build(_options);
      });
  }

  run() {
    program
      .command('run [environment]')
      .option('-p, --port [port]', __('port to run the dev webserver (default: %s)', '8000'))
      .option('-b, --host [host]', __('host to run the dev webserver (default: %s)', 'localhost'))
      .option('--noserver', __('disable the development webserver'))
      .option('--nodashboard', __('simple mode, disables the dashboard'))
      .option('--no-color', __('no colors in case it\'s needed for compatbility purposes'))
      .option('--logfile [logfile]', __('filename to output logs (default: %s)', 'none'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('run dapp (default: %s)', 'development'))
      .action(function (env, options) {
        i18n.setOrDetectLocale(options.locale);

        // set container values
        container.bind('logFile').toConstantValue(options.logfile);
        container.bind('logLevel').toConstantValue(options.loglevel);

        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);

        this.embark.run({
          env: env || 'development',
          serverPort: options.port,
          serverHost: options.host,
          runWebserver: !options.noserver,
          useDashboard: !options.nodashboard,
          logger: this.logger,
          events: this.events
        });
      });
  }

  blockchain() {
    program
      .command('blockchain [environment]')
      .option('-c, --client [client]', __('Use a specific ethereum client or simulator (supported: %s)', 'geth, testrpc'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('run blockchain server (default: %s)', 'development'))
      .action(function (env, options) {
        i18n.setOrDetectLocale(options.locale);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        this.embark.blockchain(env || 'development', options.client || 'geth');
      });
  }

  simulator() {
    program
      .command('simulator [environment]')
      .description(__('run a fast ethereum rpc simulator'))
      .option('--testrpc', __('use testrpc as the rpc simulator [%s]', 'default'))
      .option('-p, --port [port]', __('port to run the rpc simulator (default: %s)', '8545'))
      .option('-h, --host [host]', __('host to run the rpc simulator (default: %s)', 'localhost'))
      .option('-a, --accounts [numAccounts]', __('number of accounts (default: %s)', '10'))
      .option('-e, --defaultBalanceEther [balance]', __('Amount of ether to assign each test account (default: %s)', '100'))
      .option('-l, --gasLimit [gasLimit]', __('custom gas limit (default: %s)', '8000000'))
      .option('--locale [locale]', __('language to use (default: en)'))

      .action(function (env, options) {
        i18n.setOrDetectLocale(options.locale);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.initConfig(env || 'development', {
          embarkConfig: 'embark.json',
          interceptLogs: false
        });
        this.embark.simulator({
          port: options.port,
          host: options.host,
          numAccounts: options.numAccounts,
          defaultBalance: options.balance,
          gasLimit: options.gasLimit
        });
      });
  }

  test() {
    program
      .command('test [file]')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('run tests'))
      .action(function (file, options) {
        i18n.setOrDetectLocale(options.locale);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.initConfig('development', {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        this.embark.runTests(file);
      });
  }

  upload() {
    program
      .command('upload [environment]')
      .option('--logfile [logfile]', __('filename to output logs (default: %s)', 'none'))
      .option('--loglevel [loglevel]', __('level of logging to display') + ' ["error", "warn", "info", "debug", "trace"]', /^(error|warn|info|debug|trace)$/i, 'debug')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('Upload your dapp to a decentralized storage') + ' (e.g this.embark upload ipfs).')
      .action(function (platform, env, _options) {
        i18n.setOrDetectLocale(_options.locale);
        _options.env = env || 'development';
        container.bind('logFile').toConstantValue(_options.logfile);
        container.bind('logLevel').toConstantValue(_options.loglevel);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.upload(platform, _options);
      });
  }

  graph() {
    program
      .command('graph [environment]')
      .option('--skip-undeployed', __('Graph will not include undeployed contracts'))
      .option('--skip-functions', __('Graph will not include functions'))
      .option('--skip-events', __('Graph will not include events'))
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('generates documentation based on the smart contracts configured'))
      .action(function (env, options) {
        i18n.setOrDetectLocale(options.locale);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.graph({
          env: env || 'development',
          logFile: options.logfile,
          skipUndeployed: options.skipUndeployed,
          skipFunctions: options.skipFunctions,
          skipEvents: options.skipEvents
        });
      });
  }

  reset() {
    program
      .command('reset')
      .option('--locale [locale]', __('language to use (default: en)'))
      .description(__('resets embarks state on this dapp including clearing cache'))
      .action(function (options) {
        i18n.setOrDetectLocale(options.locale);
        // resolve an instance of Embark with container values
        this.embark = container.resolve(Embark);
        this.embark.initConfig('development', {
          embarkConfig: 'embark.json', interceptLogs: false
        });
        this.embark.reset();
      });
  }

  versionCmd() {
    program
    .command('version')
    .description(__('output the version number'))
    .action(function () {
      console.log(this.version);
      process.exit(0);
    });
  }

  otherCommands() {
    program
      .action(function (cmd) {
        console.log((__('unknown command') + ' "%s"').red, cmd);
        let dictionary = ['new', 'demo', 'build', 'run', 'blockchain', 'simulator', 'test', 'upload', 'version'];
        let suggestion = utils.proposeAlternative(cmd, dictionary);
        if (suggestion) {
          console.log((__('did you mean') + ' "%s"?').green, suggestion);
        }
        console.log("type this.embark --help to see the available commands");
        process.exit(0);
      });
  }

}

module.exports = Cmd;
