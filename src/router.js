class Router {
  constructor(provider, wallet, routerAddress, ethers) {
    this.provider = provider;
    this.ethers = ethers;
    this.wallet = wallet;
    this.routerAddress = routerAddress;
    this.account = this.wallet.connect(this.provider);
    this.routerContract = new ethers.Contract(
      String(routerAddress),
      [
        "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)",
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      ],
      this.account
    );
  }

  async swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    to,
    deadline,
    options
  ) {
    return this.routerContract.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      options
    );
  }

  async estimateSwapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    to,
    deadline,
    options
  ) {
    return this.routerContract.estimateGas.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      options
    );
  }

  async swapExactETHForTokens(amountOutMin, path, to, deadline, options) {
    return this.routerContract.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      options
    );
  }

  async estimateSwapExactETHForTokens(
    amountOutMin,
    path,
    to,
    deadline,
    options
  ) {
    return this.routerContract.estimateGas.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      options
    );
  }
  async getAmountsOut(amountIn, path) {
    return this.routerContract.getAmountsOut(amountIn, path);
  }

  async estimateGasFee() {
    const feeData = await this.provider.getFeeData();

    return this.ethers.utils.formatUnits(feeData.maxFeePerGas, "ether");
  }

  async getBalance(contract) {
    let balanceContract = new this.ethers.Contract(
      contract,
      ["function balanceOf(address account) external view returns(uint)"],
      this.account
    );
    return balanceContract.balanceOf(this.wallet.getAddress());
  }

  async getAllowance(contract) {
    let allowanceContract = new this.ethers.Contract(
      contract,
      [
        "function allowance(address owner, address spender) external view returns(uint)",
      ],
      this.account
    );
    return allowanceContract.allowance(
      this.wallet.getAddress(),
      this.routerAddress
    );
  }

  async approve(contract, amount) {
    const decimals = await contract.decimals();
    const hexAmount = this.ethers.utils
      .parseUnits(amount, decimals)
      .toHexString();

    let approveContract = new this.ethers.Contract(
      contract.getAddress(),
      ["function approve(address spender, uint amount) public returns(bool)"],
      this.account
    );
    const tx = await approveContract.approve(this.routerAddress, hexAmount);
    return tx.wait();
  }

  async wrapNativeToken(amount, wrappedTokenContract) {
    const nativeContract = new this.ethers.Contract(
      wrappedTokenContract,
      ["function deposit() payable"],
      this.account
    );

    const options = { value: this.ethers.utils.parseEther(amount) };

    const tx = await nativeContract.deposit(options);
    return tx.wait();
  }
}

module.exports = Router;
