const { BigNumber } = require("@ethersproject/bignumber");

class Sniper {
  constructor(
    ethers,
    router,
    wallet,
    pathContracts,
    slippage,
    deadline,
    gasLimit,
    beforeSniping,
    eventEmitter
  ) {
    this.router = router;
    this.wallet = wallet;
    this.pathContracts = pathContracts;
    this.path = this.pathContracts.map((path) => path.getAddress());
    this.slippage = slippage;
    this.deadline = deadline;
    this.ethers = ethers;
    this.gasLimit = gasLimit;
    this.beforeSniping = beforeSniping;
    this.eventEmitter = eventEmitter;
  }

  async snipe(amount, autoApprove) {
    const fromDecimals = await this.pathContracts[0].decimals();
    const symbol = await this.pathContracts[0].symbol();
    this.eventEmitter.emit("AllowanceFetchStarted");
    const allowance = await this.router.getAllowance(this.path[0]);
    this.eventEmitter.emit("AllowanceFetchCompleted", {
      allowance: this.ethers.utils.formatUnits(allowance, fromDecimals),
      symbol,
    });

    const amountIn = this.ethers.utils.parseUnits(String(amount), fromDecimals);
    
    const toApprove = autoApprove > 0 ? this.ethers.utils.parseUnits(
      String(autoApprove),
      fromDecimals
    ) : BigNumber.from(0);

    let balance = await this.router.getBalance(this.pathContracts[0].getAddress());
    let formattedBalance = this.ethers.utils.formatUnits(balance, fromDecimals);
    this.eventEmitter.emit("BalanceFetched", {
      balance: formattedBalance,
      symbol,
    });

    if(balance.lt(amountIn)) {
      this.eventEmitter.emit("NotEnoughBalance", {
        balance: formattedBalance,
        requiredAmount: this.ethers.utils.formatUnits(amountIn, fromDecimals),
        symbol,
      });

      throw new Error('Not Enough Balance');
    }
    
    if (allowance.lt(amountIn)) {
      if (autoApprove > 0 && toApprove.gte(amountIn)) {
        let formattedAmount = this.ethers.utils.formatUnits(toApprove, fromDecimals);
        this.eventEmitter.emit("ApprovalStarted", {
          amount: formattedAmount,
          symbol,
        });
        await this.router.approve(this.pathContracts[0], autoApprove);

        this.eventEmitter.emit("ApprovalCompleted", {
          amount: formattedAmount,
          symbol,
        });
      } else {
        this.eventEmitter.emit("NotEnoughAllowance", {
          allowance: this.ethers.utils.formatUnits(allowance, fromDecimals),
          amount: this.ethers.utils.formatUnits(amountIn, fromDecimals),
          symbol,
        });

        throw new Error('Not Enough Allowance');
      }
    }

    return this.snipeFromExactToken(String(amount));
  }

  async snipeFromExactToken(amount) {
    const {
      amountIn,
      amountOutMin,
      fromDecimals,
      toDecimals,
      fromSymbol,
      toSymbol,
    } = await this.#getFormattedAmounts(amount);
    
    var options = { gasLimit: this.gasLimit }; // in wei

    this.eventEmitter.emit("SwapStarted", {
      amountIn: this.ethers.utils.formatUnits(amountIn, fromDecimals),
      amountOutMin: this.ethers.utils.formatUnits(amountOutMin, toDecimals),
      fromSymbol,
      toSymbol,
    });

    await this.#estimateSwapExactTokensForTokens(
      amountIn,
      amountOutMin,
      options
    );

    this.beforeSniping();

    return this.#swapExactTokensForTokens(amountIn, amountOutMin, options);
  }

  async #swapExactTokensForTokens(amountIn, amountOutMin, options) {
    const tx = await this.router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      this.path,
      this.wallet,
      this.deadline,
      options
    );

    return tx.wait();
  }

  async #estimateSwapExactTokensForTokens(amountIn, amountOutMin, options) {
    const gas = await this.router.estimateSwapExactTokensForTokens(
      amountIn,
      amountOutMin,
      this.path,
      this.wallet,
      this.deadline,
      options
    );

    if (gas > parseInt(this.gasLimit)) {
      this.eventEmitter.emit(
        "GasEstimationError",
        {
          gas: gas,
          gasLimit: this.gasLimit,
        },
        this
      );
    }
    this.eventEmitter.emit(
      "GasEstimationCompleted",
      {
        gas: gas,
        gasLimit: this.gasLimit,
      },
      this
    );
  }

  async #getFormattedAmounts(amount) {
    const fromDecimals = await this.pathContracts[0].decimals();
    const toDecimals = await this.pathContracts[
      this.pathContracts.length - 1
    ].decimals();
    
    const fromSymbol = await this.pathContracts[0].symbol();

    const toSymbol = await this.pathContracts[
      this.pathContracts.length - 1
    ].symbol();

    const amountIn = this.ethers.utils.parseUnits(amount, fromDecimals);
    
    const amountOutMin = await this.#getAmountMin(
      amountIn,
      toDecimals,
      toSymbol
    );
    
    return {
      amountIn,
      amountOutMin,
      fromDecimals,
      toDecimals,
      toSymbol,
      fromSymbol,
    };
  }

  async #getAmountMin(amountIn, toDecimals, toSymbol) {
    const amounts = await this.router.getAmountsOut(amountIn, this.path);

    const amtIndex = this.path.length - 1;
    const amountOutMin = amounts[amtIndex].sub(
      amounts[amtIndex].mul(this.slippage).div(100)
    );

    this.eventEmitter.emit(
      "AmountOutMinEstimationCompleted",
      {
        amount: this.ethers.utils.formatUnits(
          amountOutMin.toString(),
          toDecimals
        ),
        symbol: toSymbol,
      },
      this
    );

    return amountOutMin;
  }
}

module.exports = Sniper;
