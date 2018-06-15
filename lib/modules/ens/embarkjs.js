import namehash from 'eth-ens-namehash';

/*global web3*/
let __embarkENS = {};

// resolver interface
__embarkENS.resolverInterface = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "addr",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "content",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "kind",
        "type": "bytes32"
      }
    ],
    "name": "has",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "setAddr",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "name": "setContent",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "name",
        "type": "string"
      }
    ],
    "name": "setName",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "contentType",
        "type": "uint256"
      }
    ],
    "name": "ABI",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "type": "function"
  }
];

__embarkENS.setProvider = function (jsonObject) {
  this.ens = JSON.parse(jsonObject);
};

__embarkENS.resolve = function(name) {
  const self = this;

  if (self.ens === undefined) return;

  let node = namehash.hash(name);
  
  return self.ens.methods.resolver(node).call().then((resolverAddress) => {
    let resolverContract = new web3.eth.Contract(self.resolverInterface, resolverAddress);
    return resolverContract.methods.addr(node).call();
  }).then((addr) => {
    return addr;
  }).catch(err => err);
};

__embarkENS.lookup = function(address) {
  const self = this;

  if (self.ens === undefined) return;

  if (address.startsWith("0x")) address = address.slice(2);

  let node = namehash.hash(address.toLowerCase() + ".addr.reverse");

  return self.ens.methods.resolver(node).call().then((resolverAddress) => {
    let resolverContract = new web3.eth.Contract(self.resolverInterface, resolverAddress);
    return resolverContract.methods.name(node).call();
  }).then((name) => {
    if (name === "" || name === undefined) throw Error("ENS name not found");
    return name;
  }).catch(err => err);
};
