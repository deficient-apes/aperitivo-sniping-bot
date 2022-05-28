# Aperitivo Sniping Bot

This robot ape 🦍 let you degenz buy tokens from the command line

## ⚠️⚠️⚠️ Degen warning ⚠️⚠️⚠️

Aperitivo has been tested a lot against different chains, and the first release should be stable enough. 

But the software is distributed AS IS without warranty, use it at your own risk and DO YOUR OWN RESEARCH before using it.

**YOU COULD LOSE REAL TOKENS**

Please read [LICENSE.md](LICENSE.md)

## Prerequisites

The software should run on any recent Windows, Linux or MacOs machine armed with node.js v14 or later

## Installing

Once you download clone the repository, installing node modules with npm or yarn will be enough to start.

    npm install
    
now it's time to review the configuration

    vim ./src/config.json
so that you can add your own wallets and configure chains, dex routers and tokens:

    "BSC": {
        "token": "BNB",
        "networks": {
            "testnet": {
                "json_rpc_url": "https://data-seed-prebsc-1-s1.binance.org:8545/",
                "wrapped_contract": "0xae13d989dac2f0debff460ac112a837c89baa7cd",
                "routers_v2": {
                    "PANCAKE": "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
                },
                "contracts": {
                    "CAKE": "0xF9f93cF501BFaDB6494589Cb4b4C15dE49E85D0e",
                    "WBNB": "0xae13d989dac2f0debff460ac112a837c89baa7cd"
                },
                "wallets": {
                    "wallet1": "0x3fBbb88b19EC6953f919569ab9e6A5810DF40810"
                },
                "gas": {
                    "limit": 250000
                }
            }
        }  
    },

## Usage
    node ./src/aperitivo.js --chain BSC --network testnet --from_token WBNB --to_token CAKE --amount 1000 --slippage 1 --target_wallet crowallet --router PANCAKE --wrap_before_swap 1 --auto_approve 1 --autoconfirm
    
You will be asked for your wallet mnemonic, as you can see from the code it's not saved anywhere, it's just kept in memory while the bot runs. If you want you can use a .env file or an env variable specifying your mnemonic like this:

    WALLET_MNEMONIC="your precious 12 words"

### Options
Valid values are the one configured in [src/config.json](src/config.json).

### Required:

  `--chain` Specify the chain on which you are going to operate (eg. BSC). 
  
  `--network` Choose the network on which you are going to operate (eg. testnet, mainnet). That will automatically determine json rpc url from [src/config.json](src/config.json)
  
  `--router` Choose the dex router on which you are going to operate (eg. PANCAKE)
  
  `--target_wallet` Choose the wallet on which you are going to operate (eg. mywallet1)
  
  `--amount` Choose the amount (in token units, **NOT** wei - eg. 42)
  
  `--from_token` Choose the token you want to swap to obtain --to_token (eg. WBNB)
  
  `--through_token` Choose the token you want to swap as an intermediate step to obtain --to_token (eg. BUSD)
  
  `--to_token` Choose the token you want to obtain from the swap (eg. CAKE)
  
  `--slippage` slippage percentage (eg. with 1% you are going to accept up to 99% of the --to_token value in USD)

### Optional:

  `--wrap_before_swap` wrap the specified amount of native token before the swap. You will need the same amount of native token (eg. --wrap_before_swap 10 on BSC will wrap 10 BNB, obtaining 10 WBNB before the swap)
  
  `--auto_approve` approve the given amount of --from_token before swapping (eg. --from_token WBNB --auto_approve 10 will approve 10 WBNB before swapping. Is there's already enough allowance, the step will be skipped)
  
  `--autoconfirm` skip the confirmation prompt and proceed to buy tokens without your confirmation (you degen!)
  
## Please donate!
If you like this bot, please consider to donate! We accept BNB, ETH, CRO or whatever else is ERC-20 compatible:
    
    0x3fBbb88b19EC6953f919569ab9e6A5810DF40810
    

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

Please read [LICENSE.md](LICENSE.md)
    
