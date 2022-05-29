const CHAIN_NETWORKS_KEY = "networks";
const CHAIN_TOKEN_KEY = "token";
const CHAIN_JSON_RPC_URL_KEY = "json_rpc_url";
const CHAIN_WRAPPED_CONTRACT_KEY = "wrapped_contract";

class ConfigProvider {
  constructor(map, chain, network) {
    this.map = map;
    this.chain = chain;
    this.network = network;

    if (!map[chain]) {
      throw new Error("Invalid chain " + chain);
    }

    if (!map[chain][CHAIN_NETWORKS_KEY][network]) {
      throw new Error("Invalid network " + network + " under chain " + chain);
    }
  }

  isHex(num) {
    return Boolean(num.match(/^0x[0-9a-f]+$/i));
  }

  parse(key, type) {
    if (this.isHex(key)) {
      return key;
    }

    return this.map[this.chain][CHAIN_NETWORKS_KEY][this.network][type][key];
  }

  getValue(key, type) {
    this.#validateByType(key, type);

    return this.map[this.chain][CHAIN_NETWORKS_KEY][this.network][type][key];
  }

  getToken() {
    return this.map[this.chain][CHAIN_TOKEN_KEY];
  }

  getWrappedContract() {
    return this.map[this.chain][CHAIN_NETWORKS_KEY][this.network][
      CHAIN_WRAPPED_CONTRACT_KEY
    ];
  }

  getJsonRpcUrl() {
    return this.map[this.chain][CHAIN_NETWORKS_KEY][this.network][
      CHAIN_JSON_RPC_URL_KEY
    ];
  }

  isNativeToken(token) {
    return this.map[this.chain][CHAIN_TOKEN_KEY] === token;
  }

  #validateByType(key, type) {
    const validKeys = Object.keys(
      this.map[this.chain][CHAIN_NETWORKS_KEY][this.network][type]
    );

    if (
      !this.map[this.chain][CHAIN_NETWORKS_KEY][this.network][
        type
      ].hasOwnProperty(key)
    ) {
      throw new Error(
        "Invalid value for " + type + ", valid values: " + validKeys.join(",")
      );
    }

    return true;
  }
}

module.exports = ConfigProvider;
