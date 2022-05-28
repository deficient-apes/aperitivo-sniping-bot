const log = console.log;

class EventHandler {
  constructor(eventEmitter, chalk) {
    this.em = eventEmitter;
    this.ch = chalk;
  }

  registerEvents() {
    const ch = this.ch;

    this.em.on("AllowanceFetchStarted", function () {
      log(ch.grey("Fetching allowance..."));
    });

    this.em.on("AllowanceFetchCompleted", function (data) {
      log(
        ch.grey("Allowance is ") +
          ch.blue.bold(data.allowance) +
          " " +
          ch.grey(data.symbol)
      );
    });

    this.em.on("NotEnoughAllowance", function (data) {
      log(
        "Allowance is not enough: current allowance is " +
          ch.blue.bold(data.allowance) +
          " for " +
          ch.grey(data.symbol) +
          ", you are trying to buy " +
          ch.red.bold(data.amount) +
          " " +
          ch.grey(data.symbol)
      );
      log(
        "Use the " +
          ch.blue.bold("--auto_approve") +
          " option to approve enough " +
          ch.grey(data.symbol) +
          " for the transaction"
      );
      process.exit();
    });

    this.em.on("ApprovalStarted", function (data) {
      log(
        ch.grey("Approving ") +
          ch.blue.bold(data.amount) +
          " " +
          ch.grey(data.symbol)
      );
    });

    this.em.on("ApprovalCompleted", function (data) {
      log(
        ch.grey("Approved: ") +
          ch.blue.bold(data.amount) +
          " " +
          ch.grey(data.symbol)
      );
    });

    this.em.on("BalanceFetched", function (data) {
        log(
          ch.grey("Balance: ") +
            ch.blue.bold(data.balance) +
            " " +
            ch.grey(data.symbol)
        );
      });

      this.em.on("NotEnoughBalance", function (data) {
        log(
            ch.grey("The transaction requires at least ") +
              ch.blue.bold(data.requiredAmount) +
              ch.grey(" "+data.symbol + ", your current balnce is ") +
              ch.red(data.balance)
          );
          process.exit();
      });

    this.em.on("GasEstimationError", function (data) {
      log(
        ch.grey("The transaction requires at least ") +
          ch.blue.bold(data.gas) +
          ch.grey(" gas, your limit is ") +
          ch.red(data.gasLimit)
      );
      process.exit();
    });

    this.em.on("SwapStarted", function (data) {
      log(
        ch.grey("Swapping ") +
          ch.blue.bold(data.amountIn) +
          " " +
          data.fromSymbol +
          " for a minimum of " +
          ch.blue.bold(data.amountOutMin) +
          " " +
          data.toSymbol
      );
    });
  }
}

module.exports = EventHandler;
