class Erc20Contract {
  constructor(address, ethers, provider) {
    const abi = [
      // Read-Only Functions
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];
    this.address = address;
    this.erc20 = new ethers.Contract(address, abi, provider);
  }

  async decimals() {
    return this.erc20.decimals();
  }

  async symbol() {
    return this.erc20.symbol();
  }
  getAddress() {
    return this.address;
  }
}

module.exports = Erc20Contract;
