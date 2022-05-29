const Sniper = require("./sniper");
const Router = require("./router");
const ethers = require("ethers");
const eventHandler = require("./event_handler");
const Erc20Contract = require("./erc20_contract");
const { BigNumber } = require("@ethersproject/bignumber");
const { EventEmitter } = require("events");

jest.mock("ethers");
jest.mock("./router");
jest.mock("events");
jest.mock("./erc20_contract");

let commonSpies = [];

let happyPathSpies = [];

function initSniper() {
  const router = new Router();
  const contract1 = new Erc20Contract();
  const contract2 = new Erc20Contract();
  const em = new EventEmitter();
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  let spy = jest
    .spyOn(contract1, "getAddress")
    .mockImplementation(() => "0x12345");

  let spy2 = jest
    .spyOn(contract2, "getAddress")
    .mockImplementation(() => "0x123456");
  const beforeSniping = jest.fn();
  const pathContracts = [contract1, contract2];

  commonSpies = [
    {
      spyOn: contract1,
      method: "decimals",
      implementations: [() => Promise.resolve(18)],
    },
    {
      spyOn: contract2,
      method: "decimals",
      implementations: [() => Promise.resolve(18)],
    },
  ];

  happyPathSpies = [
    ...commonSpies,
    {
      spyOn: pathContracts[0],
      method: "symbol",
      implementations: [
        () => Promise.resolve("SVN"),
        () => Promise.resolve("SVN"),
      ],
    },
    {
      spyOn: pathContracts[1],
      method: "symbol",
      implementations: [() => Promise.resolve("MMF")],
    },
    {
      spyOn: router,
      method: "getAmountsOut",
      implementations: [
        () => Promise.resolve([BigNumber.from(100), BigNumber.from(100)]),
      ],
    },
    {
      spyOn: router,
      method: "swapExactTokensForTokens",
      implementations: [
        () =>
          Promise.resolve({
            wait: () => Promise.resolve(),
          }),
      ],
    },
    {
      spyOn: router,
      method: "getBalance",
      implementations: [() => Promise.resolve(BigNumber.from(10))],
    },
    {
      spyOn: router,
      method: "estimateSwapExactTokensForTokens",
      implementations: [() => Promise.resolve("5")],
    },
  ];

  const sniper = new Sniper(
    ethers,
    router,
    "0x123456789",
    pathContracts,
    1,
    deadline, // 10 minutes deadline
    10,
    beforeSniping,
    em
  );

  return { sniper, pathContracts, router, deadline, em, beforeSniping };
}

const setSpies = (spies) => {
  return spies.map((spyConfig) => {
    let spy = jest.spyOn(spyConfig.spyOn, spyConfig.method);
    spyConfig.implementations.map((implementation) => {
      spy.mockImplementationOnce(implementation);
    });

    return spy;
  });
};

test("test snipe from tokens", async () => {
  const { sniper, pathContracts, router, deadline, em, beforeSniping } =
    initSniper();

  const spies = setSpies([
    ...happyPathSpies,
    {
      spyOn: ethers.utils,
      method: "parseUnits",
      implementations: [(amount, decimals) => "10", (amount, decimals) => "10"],
    },
    {
      spyOn: router,
      method: "getAllowance",
      implementations: [() => Promise.resolve(BigNumber.from(10))],
    },
    {
      spyOn: ethers.utils,
      method: "formatUnits",
      implementations: [
        (amount, decimals) => "11",
        (amount, decimals) => "10",
        (amount, decimals) => "100",
        (amount, decimals) => "10",
        (amount, decimals) => "100",
      ],
    },
  ]);

  await sniper.snipe(10, false);

  expect(pathContracts[0].decimals).toHaveBeenCalledTimes(2);
  expect(pathContracts[1].symbol).toHaveBeenCalledTimes(1);
  expect(ethers.utils.parseUnits).toHaveBeenCalledWith("10", 18);
  expect(ethers.utils.formatUnits).toHaveBeenCalledWith("99", 18);
  expect(router.getAmountsOut).toHaveBeenCalledWith("10", [
    "0x12345",
    "0x123456",
  ]);
  expect(router.swapExactTokensForTokens).toHaveBeenCalledWith(
    "10",
    BigNumber.from("99"),
    ["0x12345", "0x123456"],
    "0x123456789",
    deadline,
    { gasLimit: 10 }
  );
  expect(em.emit).toHaveBeenNthCalledWith(1, "AllowanceFetchStarted");
  expect(em.emit).toHaveBeenNthCalledWith(2, "AllowanceFetchCompleted", {
    allowance: "11",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(3, "BalanceFetched", {
    balance: "10",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(
    4,
    "AmountOutMinEstimationCompleted",
    { amount: "100", symbol: "MMF" },
    expect.anything()
  );
  expect(em.emit).toHaveBeenNthCalledWith(5, "SwapStarted", {
    amountIn: "10",
    amountOutMin: "100",
    fromSymbol: "SVN",
    toSymbol: "MMF",
  });
  expect(em.emit).toHaveBeenNthCalledWith(
    6,
    "GasEstimationCompleted",
    { gas: "5", gasLimit: 10 },
    expect.anything()
  );
  expect(beforeSniping).toHaveBeenCalledTimes(1);
  spies.map((spy) => {
    spy.mockRestore();
  });
});

test("test snipe from tokens not enough balance", async () => {
  const { sniper, pathContracts, router, deadline, em, beforeSniping } =
    initSniper();

  const spies = setSpies([
    ...commonSpies,
    {
      spyOn: pathContracts[0],
      method: "symbol",
      implementations: [
        () => Promise.resolve("SVN"),
        () => Promise.resolve("SVN"),
      ],
    },
    {
      spyOn: pathContracts[1],
      method: "symbol",
      implementations: [() => Promise.resolve("MMF")],
    },
    {
      spyOn: router,
      method: "getAmountsOut",
      implementations: [
        () => Promise.resolve([BigNumber.from(100), BigNumber.from(100)]),
      ],
    },
    {
      spyOn: ethers.utils,
      method: "parseUnits",
      implementations: [(amount, decimals) => "10", (amount, decimals) => "10"],
    },
    {
      spyOn: ethers.utils,
      method: "formatUnits",
      implementations: [
        (amount, decimals) => "11",
        (amount, decimals) => "9",
        (amount, decimals) => "10",
      ],
    },
    {
      spyOn: router,
      method: "getBalance",
      implementations: [() => Promise.resolve(BigNumber.from(9))],
    },
  ]);
  try {
    await sniper.snipe(10, false);
  } catch (e) {
    expect(e.message).toBe("Not Enough Balance");
  }

  expect(pathContracts[0].decimals).toHaveBeenCalledTimes(1);
  expect(pathContracts[1].symbol).toHaveBeenCalledTimes(0);
  expect(ethers.utils.parseUnits).toHaveBeenCalledWith("10", 18);
  expect(router.getAmountsOut).toHaveBeenCalledTimes(0);
  expect(router.swapExactTokensForTokens).toHaveBeenCalledTimes(0);
  expect(em.emit).toHaveBeenNthCalledWith(1, "AllowanceFetchStarted");
  expect(em.emit).toHaveBeenNthCalledWith(2, "AllowanceFetchCompleted", {
    allowance: "11",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(3, "BalanceFetched", {
    balance: "9",
    symbol: "SVN",
  });

  expect(em.emit).toHaveBeenNthCalledWith(4, "NotEnoughBalance", {
    balance: "9",
    symbol: "SVN",
    requiredAmount: "10",
  });
  expect(beforeSniping).toHaveBeenCalledTimes(0);
  spies.map((spy) => spy.mockRestore());
});

test("test snipe from tokens not enough allowance", async () => {
  const { sniper, pathContracts, router, em, beforeSniping } = initSniper();

  const spies = setSpies([
    ...commonSpies,
    {
      spyOn: pathContracts[0],
      method: "symbol",
      implementations: [
        () => Promise.resolve("SVN"),
        () => Promise.resolve("SVN"),
      ],
    },
    {
      spyOn: pathContracts[1],
      method: "symbol",
      implementations: [() => Promise.resolve("MMF")],
    },
    {
      spyOn: router,
      method: "getAmountsOut",
      implementations: [
        () => Promise.resolve([BigNumber.from(100), BigNumber.from(100)]),
      ],
    },
    {
      spyOn: ethers.utils,
      method: "parseUnits",
      implementations: [(amount, decimals) => "10", (amount, decimals) => "10"],
    },
    {
      spyOn: ethers.utils,
      method: "formatUnits",
      implementations: [
        (amount, decimals) => "11",
        (amount, decimals) => "9",
        (amount, decimals) => "0",
        (amount, decimals) => "10",
      ],
    },
    {
      spyOn: router,
      method: "getBalance",
      implementations: [() => Promise.resolve(BigNumber.from(12))],
    },
    {
      spyOn: router,
      method: "getAllowance",
      implementations: [() => Promise.resolve(BigNumber.from(0))],
    },
  ]);
  try {
    await sniper.snipe(10, false);
  } catch (e) {
    expect(e.message).toBe("Not Enough Allowance");
  }

  expect(pathContracts[0].decimals).toHaveBeenCalledTimes(1);
  expect(pathContracts[1].symbol).toHaveBeenCalledTimes(0);
  expect(ethers.utils.parseUnits).toHaveBeenCalledWith("10", 18);
  expect(router.getAmountsOut).toHaveBeenCalledTimes(0);
  expect(router.swapExactTokensForTokens).toHaveBeenCalledTimes(0);
  expect(em.emit).toHaveBeenNthCalledWith(1, "AllowanceFetchStarted");
  expect(em.emit).toHaveBeenNthCalledWith(2, "AllowanceFetchCompleted", {
    allowance: "11",
    symbol: "SVN",
  });

  expect(em.emit).toHaveBeenNthCalledWith(3, "BalanceFetched", {
    balance: "9",
    symbol: "SVN",
  });

  expect(em.emit).toHaveBeenNthCalledWith(4, "NotEnoughAllowance", {
    allowance: "0",
    amount: "10",
    symbol: "SVN",
  });
  expect(beforeSniping).toHaveBeenCalledTimes(0);
  spies.map((spy) => spy.mockRestore());
});

test("test snipe from tokens with approval and enough allowance", async () => {
  const { sniper, pathContracts, router, deadline, em, beforeSniping } =
    initSniper();

  const spies = setSpies([
    ...happyPathSpies,
    {
      spyOn: router,
      method: "getAllowance",
      implementations: [() => Promise.resolve(BigNumber.from(10))],
    },
    {
      spyOn: ethers.utils,
      method: "parseUnits",
      implementations: [
        (amount, decimals) => "10",
        (amount, decimals) => "10",
        (amount, decimals) => "10",
      ],
    },
    {
      spyOn: ethers.utils,
      method: "formatUnits",
      implementations: [
        (amount, decimals) => "11",
        (amount, decimals) => "10",
        (amount, decimals) => "100",
        (amount, decimals) => "10",
        (amount, decimals) => "100",
      ],
    },
  ]);

  await sniper.snipe(10, 10);

  expect(pathContracts[0].decimals).toHaveBeenCalledTimes(2);
  expect(pathContracts[1].symbol).toHaveBeenCalledTimes(1);
  expect(ethers.utils.parseUnits).toHaveBeenCalledWith("10", 18);
  expect(router.getAmountsOut).toHaveBeenCalledWith("10", [
    "0x12345",
    "0x123456",
  ]);
  expect(router.approve).toHaveBeenCalledTimes(0);
  expect(router.swapExactTokensForTokens).toHaveBeenCalledWith(
    "10",
    BigNumber.from("99"),
    ["0x12345", "0x123456"],
    "0x123456789",
    deadline,
    { gasLimit: 10 }
  );
  expect(em.emit).toHaveBeenNthCalledWith(1, "AllowanceFetchStarted");
  expect(em.emit).toHaveBeenNthCalledWith(2, "AllowanceFetchCompleted", {
    allowance: "11",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(3, "BalanceFetched", {
    balance: "10",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(
    4,
    "AmountOutMinEstimationCompleted",
    { amount: "100", symbol: "MMF" },
    expect.anything()
  );
  expect(em.emit).toHaveBeenNthCalledWith(5, "SwapStarted", {
    amountIn: "10",
    amountOutMin: "100",
    fromSymbol: "SVN",
    toSymbol: "MMF",
  });
  expect(em.emit).toHaveBeenNthCalledWith(
    6,
    "GasEstimationCompleted",
    { gas: "5", gasLimit: 10 },
    expect.anything()
  );
  expect(beforeSniping).toHaveBeenCalledTimes(1);
  spies.map((spy) => spy.mockRestore());
});

test("test snipe from tokens with approval and not enough allowance", async () => {
  const { sniper, pathContracts, router, deadline, em, beforeSniping } =
    initSniper();

  const spies = setSpies([
    ...happyPathSpies,
    {
      spyOn: router,
      method: "getAllowance",
      implementations: [() => Promise.resolve(BigNumber.from(0))],
    },
    {
      spyOn: ethers.utils,
      method: "parseUnits",
      implementations: [
        (amount, decimals) => BigNumber.from("10"),
        (amount, decimals) => BigNumber.from("10"),
        (amount, decimals) => BigNumber.from("10"),
      ],
    },
    {
      spyOn: ethers.utils,
      method: "formatUnits",
      implementations: [
        (amount, decimals) => "11",
        (amount, decimals) => "10",
        (amount, decimals) => "10",
        (amount, decimals) => "100",
        (amount, decimals) => "10",
        (amount, decimals) => "100",
      ],
    },
  ]);

  await sniper.snipe(10, 10);

  expect(pathContracts[0].decimals).toHaveBeenCalledTimes(2);
  expect(pathContracts[1].symbol).toHaveBeenCalledTimes(1);
  expect(ethers.utils.parseUnits).toHaveBeenCalledWith("10", 18);
  expect(router.getAmountsOut).toHaveBeenCalledWith(BigNumber.from("10"), [
    "0x12345",
    "0x123456",
  ]);
  expect(router.approve).toHaveBeenCalledWith(pathContracts[0], 10);
  expect(router.swapExactTokensForTokens).toHaveBeenCalledWith(
    BigNumber.from("10"),
    BigNumber.from("99"),
    ["0x12345", "0x123456"],
    "0x123456789",
    deadline,
    { gasLimit: 10 }
  );
  expect(em.emit).toHaveBeenNthCalledWith(1, "AllowanceFetchStarted");
  expect(em.emit).toHaveBeenNthCalledWith(2, "AllowanceFetchCompleted", {
    allowance: "11",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(3, "BalanceFetched", {
    balance: "10",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(4, "ApprovalStarted", {
    amount: "10",
    symbol: "SVN",
  });
  expect(em.emit).toHaveBeenNthCalledWith(5, "ApprovalCompleted", {
    amount: "10",
    symbol: "SVN",
  });

  expect(em.emit).toHaveBeenNthCalledWith(
    6,
    "AmountOutMinEstimationCompleted",
    { amount: "100", symbol: "MMF" },
    expect.anything()
  );

  expect(em.emit).toHaveBeenNthCalledWith(7, "SwapStarted", {
    amountIn: "10",
    amountOutMin: "100",
    fromSymbol: "SVN",
    toSymbol: "MMF",
  });
  expect(em.emit).toHaveBeenNthCalledWith(
    8,
    "GasEstimationCompleted",
    { gas: "5", gasLimit: 10 },
    expect.anything()
  );
  expect(beforeSniping).toHaveBeenCalledTimes(1);
  spies.map((spy) => spy.mockRestore());
});
