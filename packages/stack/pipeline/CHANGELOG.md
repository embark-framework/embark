# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/embarklabs/embark/compare/v5.0.0-beta.0...v5.0.0) (2020-01-07)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.9](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2019-12-20)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.8](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2019-12-19)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.5](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2019-12-16)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.4](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@embark/blockchain:** make disabling blockchain feature work ([446197b](https://github.com/embarklabs/embark/commit/446197b))





# [5.0.0-alpha.3](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.2](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.1](https://github.com/embarklabs/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-pipeline





# [5.0.0-alpha.0](https://github.com/embarklabs/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* **@embark/stack/pipeline:** set missing `this.fs` to `embark.fs` ([86a9766](https://github.com/embarklabs/embark/commit/86a9766))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embarklabs/embark/issues/1985)) ([ed02cc8](https://github.com/embarklabs/embark/commit/ed02cc8))


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


### Bug Fixes

* **@embark/pipeline:** revise require in embarkArtifacts/contracts/index ([ff97aa5](https://github.com/embarklabs/embark/commit/ff97aa5))





# [4.1.0](https://github.com/embarklabs/embark/compare/v4.1.0-beta.6...v4.1.0) (2019-08-12)

**Note:** Version bump only for package embark-pipeline





# [4.1.0-beta.6](https://github.com/embarklabs/embark/compare/v4.1.0-beta.5...v4.1.0-beta.6) (2019-08-09)


### Bug Fixes

* **@embark/pipeline:** adjust ignore paths ([e58c552](https://github.com/embarklabs/embark/commit/e58c552))
* **@embark/pipeline:** check if config arg of writeStats is falsy ([9d81fc5](https://github.com/embarklabs/embark/commit/9d81fc5))
* **@embark/pipeline:** streamline contract index file creation ([810c3be](https://github.com/embarklabs/embark/commit/810c3be))


### Features

* **@embark/pipeline:** add minimalContractSize to remove bytecode ([b0cccae](https://github.com/embarklabs/embark/commit/b0cccae))
* **@embark/pipeline:** enable choosing which fields to filter out ([b5c81bd](https://github.com/embarklabs/embark/commit/b5c81bd))





# [4.1.0-beta.5](https://github.com/embarklabs/embark/compare/v4.1.0-beta.4...v4.1.0-beta.5) (2019-07-10)

**Note:** Version bump only for package embark-pipeline





# [4.1.0-beta.4](https://github.com/embarklabs/embark/compare/v4.1.0-beta.3...v4.1.0-beta.4) (2019-06-27)

**Note:** Version bump only for package embark-pipeline





# [4.1.0-beta.3](https://github.com/embarklabs/embark/compare/v4.1.0-beta.2...v4.1.0-beta.3) (2019-06-07)

**Note:** Version bump only for package embark-pipeline





# [4.1.0-beta.2](https://github.com/embarklabs/embark/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2019-05-22)


### Bug Fixes

* **@embark/pipeline:** ensure color methods for logs are available ([8ca6419](https://github.com/embarklabs/embark/commit/8ca6419))





# [4.1.0-beta.1](https://github.com/embarklabs/embark/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2019-05-15)

**Note:** Version bump only for package embark-pipeline
