const args = require("minimist")(process.argv.slice(2), {
  string: ["router", "target_wallet", "to_token", "from_token"],
});

const prompt = require("prompt-sync")({ sigint: true });
const cliUsage = require("command-line-usage");
const EventHandler = require("./event_handler");
const chalk = require("chalk");
require("dotenv").config();

const init = require("./init");

const logo = require("./logo");
const sections = [
  {
    content: logo,
  },
  {
    header: "🦍 Aperitivo Sniping Bot",
    content:
      "This robot ape 🦍 let you degenz buy tokens from the command line",
  },
  {
    header: "Usage",
    content: [
      "% sniper {bold --chain} {underline Cronos} {bold --network} {underline testnet} {bold --from_token} {underline WCRO} {bold --wrap_before_swap} {underline 10} {bold --auto_approve} {underline 1000} {bold --through_token} {underline MMF} {bold --to_token} {underline MSHARE} {bold --amount} {underline 1000} {bold --slippage} {underline 1} {bold --target_wallet} {underline crowallet} {bold --router} {underline MMF} {bold --autoconfirm}",
    ],
  },
  {
    header: "Options",
    content: [
      "{bold Required:}\n",

      "{blue --chain} Specify the chain on which you are going to operate (eg. BSC).\n",

      "{blue --network} Choose the network on which you are going to operate (eg. testnet, mainnet). That will automatically determine json rpc url from src/config.json\n",

      "{blue --router} Choose the dex router on which you are going to operate (eg. PANCAKE)\n",

      "{blue --target_wallet} Choose the wallet on which you are going to operate (eg. mywallet1)\n",

      "{blue --amount} Choose the amount (in token units, NOT wei - eg. 42)\n",

      "{blue --from_token} Choose the token you want to swap to obtain --to_token (eg. WBNB)\n",

      "{blue --through_token} Choose the token you want to swap as an intermediate step to obtain --to_token (eg. BUSD)\n",

      "{blue --to_token} Choose the token you want to obtain from the swap (eg. CAKE)\n",

      "{blue --slippage} slippage percentage (eg. with 1% you are going to accept up to 99% of the --to_token value in USD)\n",
      "\n{bold Optional:}\n",

      "{green --wrap_before_swap} wrap the specified amount of native token before the swap. You will need the same amount of native token (eg. --wrap_before_swap 10 on BSC will wrap 10 BNB, obtaining 10 WBNB before the swap)\n",

      "{green --auto_approve} approve the given amount of --from_token before swapping (eg. --from_token WBNB --auto_approve 10 will approve 10 WBNB before swapping. Is there's already enough allowance, the step will be skipped)\n",

      "{green --autoconfirm} skip the confirmation prompt and proceed to buy tokens without your confirmation (you degen!)",
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

const mnemonic =
  args.mnemonic ||
  process.env.WALLET_MNEMONIC ||
  prompt.hide(
    "Input mnemonic (use --mnemonic if you want to pass it through command line):"
  );
let sniper, router, configProvider, em;

try {
  ({ sniper, router, configProvider, em } = init(mnemonic, args));
} catch (e) {
  console.log(chalk.red(e.message));
  process.exit(1);
}

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
