# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.9](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)


### Build System

* **deps:** bump web3[-*] from 1.2.1 to 1.2.4 ([7e550f0](https://github.com/embarklabs/embark/commit/7e550f0))


### BREAKING CHANGES

* **deps:** bump embark's minimum supported version of parity from
`>=2.0.0` to `>=2.2.1`. This is necessary since web3 1.2.4 makes use of the
`eth_chainId` RPC method (EIP 695) and that parity version is the earliest one
to implement it.

[bug]: https://github.com/ethereum/web3.js/issues/3283





# [5.0.0-alpha.8](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.6](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.5...v5.0.0-alpha.6) (2019-12-17)


### Bug Fixes

* **@cockpit/contracts:** ensure contract state is emitted in realtime ([aa5121a](https://github.com/embarklabs/embark/commit/aa5121a))





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.4](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.3](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-contracts-manager





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


### Features

* **@embark/test-runner:** make vm default node ([#1846](https://github.com/embarklabs/embark/issues/1846)) ([f54fbf0](https://github.com/embarklabs/embark/commit/f54fbf0))


### BREAKING CHANGES

* node: >=10.17.0 <12.0.0
npm: >=6.11.3
yarn: >=1.19.1

node v10.17.0 is the latest in the 10.x series and is still in the Active LTS
lifecycle. Embark is still not compatible with node's 12.x and 13.x
series (because of some dependencies), otherwise it would probably make sense
to bump our minimum supported node version all the way to the most recent 12.x
release.

npm v6.11.3 is the version that's bundled with node v10.17.0.

yarn v1.19.1 is the most recent version as of the time node v10.17.0 was
released.





## [4.1.1](https://github.com/embarklabs/embark/compare/v4.1.0...v4.1.1) (2019-08-28)

**Note:** Version bump only for package embark-contracts-manager





# [4.1.0](https://github.com/embarklabs/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-contracts-manager





# [4.1.0-beta.6](https://github.com/embarklabs/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)

**Note:** Version bump only for package embark-contracts-manager





# [4.1.0-beta.5](https://github.com/embarklabs/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)


### Bug Fixes

* **@embark/contracts-manager:** ensure ETH values sent through APIs are converted to string ([70ff3c1](https://github.com/embarklabs/embark/commit/70ff3c1))


### Features

* **@cockpit:** Pass tx value as wei and add validation ([536a402](https://github.com/embarklabs/embark/commit/536a402))





# [4.1.0-beta.4](https://github.com/embarklabs/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)


### Bug Fixes

* **@embark/solidity:** show a better error message in debug ([198a5dc](https://github.com/embarklabs/embark/commit/198a5dc))





# [4.1.0-beta.3](https://github.com/embarklabs/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)


### Features

* **@cockpit/explorer:** enable users to send ether through payable methods ([#1649](https://github.com/embarklabs/embark/issues/1649)) ([d10c0b7](https://github.com/embarklabs/embark/commit/d10c0b7))





# [4.1.0-beta.2](https://github.com/embarklabs/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)

**Note:** Version bump only for package embark-contracts-manager





# [4.1.0-beta.1](https://github.com/embarklabs/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)


### Features

* **@embar/contracts-manager:** add message for interface contracts ([334d3bc](https://github.com/embarklabs/embark/commit/334d3bc))
* **@embark/test-runner:** show interface contract message in tests ([f9d7a3f](https://github.com/embarklabs/embark/commit/f9d7a3f))
