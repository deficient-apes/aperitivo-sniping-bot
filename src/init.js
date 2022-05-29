const ethers = require("ethers");
const prompt = require("prompt-sync")({ sigint: true });
const Router = require("./router");
const Sniper = require("./sniper");
const Erc20Contract = require("./erc20_contract");
const ConfigProvider = require("./config_provider");
const fs = require("fs");
const { EventEmitter } = require("events");

function init(mnemonic, args) {
  const em = new EventEmitter();

  let rawdata = fs.readFileSync(__dirname + "/config.json");
  let map = JSON.parse(rawdata);
  const configProvider = new ConfigProvider(map, args.chain, args.network);

  const wallet = ethers.Wallet.fromMnemonic(mnemonic);
  const provider = new ethers.providers.JsonRpcProvider(
    configProvider.getJsonRpcUrl()
  );
  const router = new Router(
    provider,
    wallet,
    configProvider.getValue(args.router, "routers_v2"),
    ethers,
    configProvider.getValue("WCRO", "contracts")
  );

  let fromToken = configProvider.getValue(String(args.from_token), "contracts");
  if (configProvider.isNativeToken(args.from_token)) {
    fromToken = configProvider.getWrappedContract();
  }
  let path = [fromToken];

  if (args.through_token) {
    path.push(configProvider.getValue(String(args.through_token), "contracts"));
  }
  path.push(configProvider.getValue(String(args.to_token), "contracts"));

  const pathContracts = path.map((address) => {
    return new Erc20Contract(address, ethers, provider);
  });

  let beforeSniping = () => {};
  if (!args.autoconfirm) {
    beforeSniping = () => {
      const proceed = prompt("Do you want to proceed? (y/n) ");
      if (proceed !== "y") {
        console.log("Aborting...");
        process.exit(1);
      }
    };
  }

  const sniper = new Sniper(
    ethers,
    router,
    configProvider.getValue(String(args.target_wallet), "wallets"),
    pathContracts,
    args.slippage,
    Math.floor(Date.now() / 1000) + 60 * 10,
    configProvider.getValue("limit", "gas"),
    beforeSniping,
    em
  );

  return { sniper, beforeSniping, router, configProvider, em };
}

module.exports = init;
