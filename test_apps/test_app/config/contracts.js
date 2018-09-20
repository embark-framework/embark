module.exports = {
  default: {
    deployment: {
      host: "localhost",
      port: 8546,
      type: "ws"
    },
    dappConnection: [
      "$WEB3",
      "ws://localhost:8546",
      "http://localhost:8550",
      "http://localhost:8545",
      "http://localhost:8550"
    ],
    gas: "auto",
    contracts: {
      Ownable: {
        deploy: false
      },
      SimpleStorage: {
        fromIndex: 0,
        args: [100],
        onDeploy: ["SimpleStorage.methods.setRegistar(web3.eth.defaultAccount).send()"]
      },
      AnotherStorage: {
        args: ["$SimpleStorage"]
      },
      Token: {
        deploy: false,
        args: [1000]
      },
      Test: {
        onDeploy: ["Test.methods.changeAddress('$MyToken')"]
      },
      MyToken: {
        instanceOf: "Token"
      },
      MyToken2: {
        instanceOf: "Token",
        args: [200]
      },
      AlreadyDeployedToken: {
        address: "0xece374063fe5cc7efbaca0a498477cada94e5ad6",
        instanceOf: "Token"
      },
      MyToken3: {
        instanceOf: "Tokn"
      },
      ContractArgs: {
        args: {
          initialValue: 123,
          "_addresses": ["$MyToken2", "$SimpleStorage"]
        }
      },
      SomeContract: {
        deployIf: 'MyToken.methods.isAvailable().call()',
        args: [
          ["$MyToken2", "$SimpleStorage"],
          100
        ]
      },
      ERC20: {
        file: "zeppelin-solidity/contracts/token/ERC20/ERC20.sol"
      },
      SimpleStorageTest: {
        file: "./some_folder/test_contract.sol",
        args: [1000]
      },
      Identity: {
        file: "https://github.com/status-im/contracts/blob/master/contracts/identity/Identity.sol"
      },
      SimpleStorageWithHttpImport: {
        fromIndex: 0,
        args: [100]
      },
      ENSRegistry: {
        "deploy": false
      },
      Resolver: {
        "deploy": false
      },
      FIFSRegistrar: {
        "deploy": false
      }
    },
    afterDeploy: [
      "Test.methods.changeAddress('$MyToken')",
      "web3.eth.getAccounts((err, accounts) => Test.methods.changeAddress(accounts[0]))"
    ]
  },
  development: {
    contracts: {
      MyToken2: {
        instanceOf: "Token",
        args: [2000]
      }
    }
  }
};
