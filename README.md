# Aperitivo Sniping Bot

This robot ape 🦍 let you degenz buy tokens from the command line

## ⚠️⚠️⚠️ Degen warning ⚠️⚠️⚠️

Aperitivo has been tested a lot against different chains, and the first release should be stable enough. 

But the software is distributed AS IS, use it at your own risk and DO YOUR OWN RESEARCH before using it.


## Prerequisites

The software should run on any recent Windows, Linux or MacOs machine armed with node.js v14 or later

## Installing

Once you download clone the repository, installing node modules with npm or yarn will be enough to start.

    npm -i
    
now it's time to review the configuration

    vim ./src/config.json
so that you can add your own wallets and configure chains, dex routers and tokens

## Usage
    ./src/aperitivo.js --chain BSC --network testnet --from_token WBNB --to_token CAKE --amount 1000 --slippage 1 --target_wallet crowallet --router PANCAKE --wrap_before_swap 1 --auto_approve 1 --autoconfirm
  
## Running the tests
    npm test

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code
of conduct, and the process for submitting pull requests to us.

## Versioning

We use [Semantic Versioning](http://semver.org/) for versioning. For the versions
available, see the [tags on this
repository](https://github.com/deficient-apes/aperitivo-sniping-bot/tags).


## License

## Please donate!
