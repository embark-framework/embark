pragma solidity ^0.4.17;

import "ownable.sol";

library Assert {
  event TestEvent(bool passed, string message);

  function triggerEvent(bool passed, string message) internal {
    TestEvent(passed, message);
  }
}

contract SimpleStorage is Ownable {
  uint public storedData;
  address public registar;
  event EventOnSet2(bool passed, string message);

  function() public payable { }

  function SimpleStorage(uint initialValue) public {
    storedData = initialValue;
  }

  function set(uint x) public {
    storedData = x;
//    for(uint i = 0; i < 1000; i++) {
//      storedData += i;
//    }
    Assert.triggerEvent(true, "hi");
  }

  function set2(uint x, uint unusedGiveWarning) public onlyOwner {
    storedData = x;
    emit EventOnSet2(true, "hi");
  }

  function get() public view returns (uint retVal) {
    return storedData;
  }

  function getS() public pure returns (string d) {
    return "hello";
  }

  function setRegistar(address x) public {
    registar = x;
  }

}
