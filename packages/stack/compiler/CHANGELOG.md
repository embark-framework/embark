# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embark-compiler





# [5.0.0-beta.0](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.10...v5.0.0-beta.0) (2020-01-03)


### Bug Fixes

* **@embark/snark:** Allow dapp to have no contracts ([2295f94](https://github.com/embarklabs/embark/commit/2295f94))





# [5.0.0-alpha.9](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)

**Note:** Version bump only for package embark-compiler





# [5.0.0-alpha.8](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)

**Note:** Version bump only for package embark-compiler





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)

**Note:** Version bump only for package embark-compiler





# [5.0.0-alpha.4](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@embark/tests:** Tests exiting early ([acd1d72](https://github.com/embarklabs/embark/commit/acd1d72))





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)

**Note:** Version bump only for package embark-compiler





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-compiler





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


### Features

* **@embark/compiler:** support :before and :after hooks on event compiler:contracts:compile ([#1878](https://github.com/embarklabs/embark/issues/1878)) ([043ccc0](https://github.com/embarklabs/embark/commit/043ccc0))


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

**Note:** Version bump only for package embark-compiler





# [4.1.0](https://github.com/embarklabs/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-compiler





# [4.1.0-beta.3](https://github.com/embarklabs/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embark-compiler





# [4.1.0-beta.1](https://github.com/embarklabs/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)

**Note:** Version bump only for package embark-compiler





# [4.0.0](https://github.com/embarklabs/embark/compare/v4.0.0-beta.2...v4.0.0) (2019-03-18)

**Note:** Version bump only for package embark-compiler





# [4.0.0-beta.1](https://github.com/embarklabs/embark/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2019-03-18)


### Bug Fixes

* supply missing tsconfig.json in packages/* ([376b6ca](https://github.com/embarklabs/embark/commit/376b6ca))


### Features

* add repository.directory field to package.json ([a9c5e1a](https://github.com/embarklabs/embark/commit/a9c5e1a))
* create async wrapper ([bc24598](https://github.com/embarklabs/embark/commit/bc24598))
* normalize README and package.json bugs, homepage, description ([5418f16](https://github.com/embarklabs/embark/commit/5418f16))
