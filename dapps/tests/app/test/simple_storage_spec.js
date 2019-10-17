/*global contract, config, it, assert, web3*/
const SimpleStorage = require('Embark/contracts/SimpleStorage');
let accounts;
const {Utils} = require('Embark/EmbarkJS');

config({
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100],
        onDeploy: ["SimpleStorage.methods.setRegistar('$SimpleStorage').send()"]
      }
    }
  }
}, (err, theAccounts) => {
  accounts = theAccounts;
});

contract("SimpleStorage", function() {
  this.timeout(0);

  it("should set constructor value", async function() {
    let result = await SimpleStorage.methods.storedData().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });

  it("set storage value", function(done) {
    Utils.secureSend(web3, SimpleStorage.methods.set(150), {}, false, async function(err) {
      if (err) {
        return done(err);
      }
      let result = await SimpleStorage.methods.get().call();
      assert.strictEqual(parseInt(result, 10), 150);
      done();
    });
  });

  it("should set to self address", async function() {
    let result = await SimpleStorage.methods.registar().call();
    assert.strictEqual(result, SimpleStorage.options.address);
  });

  it('should have the right defaultAccount', function() {
    assert.strictEqual(accounts[0], web3.eth.defaultAccount);
  });

  it("should alias contract address", function() {
    assert.strictEqual(SimpleStorage.options.address, SimpleStorage.address);
  });

  // FIXME Events seem broken
  xit('listens to events', function(done) {
    SimpleStorage.once('EventOnSet2', async function(error, _result) {
      assert.strictEqual(error, null);
      let result = await SimpleStorage.methods.get().call();
      assert.strictEqual(parseInt(result, 10), 150);
      done(error);
    });

    SimpleStorage.methods.set2(150).send();
  });

  it("should revert with a value lower than 5", async function() {
    await assert.reverts(SimpleStorage.methods.set3(2), {from: web3.eth.defaultAccount}, 'Returned error: VM Exception while processing transaction: revert Value needs to be higher than 5');
  });
});
