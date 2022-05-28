const args = require("minimist")(process.argv.slice(2), {
  string: ["router", "target_wallet", "to_token", "from_token"],
});

const prompt = require("prompt-sync")({ sigint: true });
const cliUsage = require("command-line-usage");
const EventHandler = require("./event_handler");
const chalk = require("chalk");
require('dotenv').config();

const init = require('./init');


const logo = require('./logo');
const sections = [
  {
    content:
    logo
  },
  {
    header: "🦍 Aperitivo Sniping Bot",
    content:
      "This robot ape 🦍 let you degenz buy tokens from the command line",
  },
  {
    header: "Usage",
    content: [
      '% sniper {bold --chain} {underline Cronos} {bold --network} {underline testnet} {bold --from_token} {underline WCRO} {bold --wrap_before_swap} {underline 10} {bold --auto_approve} {underline 1000} {bold --through_token} {underline MMF} {bold --to_token} {underline MSHARE} {bold --amount} {underline 1000} {bold --slippage} {underline 1} {bold --target_wallet} {underline crowallet} {bold --router} {underline MMF} {bold --autoconfirm}',
    ],
  },
];

const usage = cliUsage(sections);

const requiredArgs = [
  "network",
  "router",
  "target_wallet",
  "amount",
  "to_token",
  "from_token",
  "slippage",
  "chain",
];

if (!requiredArgs.every((key) => Object.keys(args).includes(key))) {
  console.info(usage);
  process.exit(1);
}

const mnemonic = args.mnemonic || process.env.WALLET_MNEMONIC ||
  prompt.hide(
    "Input mnemonic (use --mnemonic if you want to pass it through command line):"
  );

const {sniper, router, configProvider, em} = init(mnemonic, args);

(async () => {
  if (args.wrap_before_swap) {
    let wrapReceipt = await router.wrapNativeToken(
      String(args.wrap_before_swap),
      configProvider.getWrappedContract()
    );
    console.log(`Wrap transaction hash: ${wrapReceipt.transactionHash}`);
  }
  let receipt = await sniper.snipe(
    String(args.amount),
    String(args.auto_approve)
  );
  console.log(`Transaction hash: ${receipt.transactionHash}`);
  process.exit(0);
})();

//events
const handler = new EventHandler(em, chalk);
handler.registerEvents();

