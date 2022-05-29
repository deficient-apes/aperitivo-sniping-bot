const Router = require("./router");
const ethers = require("ethers");

const { Contract, Wallet } = require("ethers");
const { WebSocketProvider } = require("@ethersproject/providers");
jest.mock("ethers");
jest.mock("@ethersproject/providers");

function initRouter() {
  const wallet = new Wallet();
  Contract.prototype.swapExactTokensForTokens = function () {};
  const routerContract = new Contract();
  const provider = new WebSocketProvider();

  ethers.Contract.mockReturnValueOnce(routerContract);
  const router = new Router(provider, wallet, "0x12345", ethers);
  return { routerContract, router, provider };
}

test("test Router constructor", () => {
  const wallet = new Wallet();
  const provider = new WebSocketProvider();
  wallet.connect.mockReturnValueOnce({ test: 1 });
  new Router(provider, wallet, "0x12345", ethers);
  expect(Contract).toHaveBeenCalledWith("0x12345", expect.anything(), {
    test: 1,
  });
  expect(wallet.connect).toHaveBeenCalledWith(provider);
});

test("swapExactTokensForTokens", async () => {
  const { routerContract, router } = initRouter();

  let spy = jest
    .spyOn(routerContract, "swapExactTokensForTokens")
    .mockImplementation(() => Promise.resolve());
  const deadline = new Date();
  await router.swapExactTokensForTokens(
    1,
    1,
    ["0x12345", "0x123456"],
    "0x1234567",
    deadline,
    { test: 1 }
  );
  expect(routerContract.swapExactTokensForTokens).toHaveBeenCalledWith(
    1,
    1,
    ["0x12345", "0x123456"],
    "0x1234567",
    deadline,
    { test: 1 }
  );
  spy.mockRestore();
});

test("estimateSwapExactTokensForTokens", async () => {
  const { routerContract, router } = initRouter();

  Contract.prototype.estimateGas = { swapExactTokensForTokens: () => {} };
  let spy = jest
    .spyOn(routerContract.estimateGas, "swapExactTokensForTokens")
    .mockImplementation(() => Promise.resolve());
  const deadline = new Date();
  await router.estimateSwapExactTokensForTokens(
    1,
    1,
    ["0x12345", "0x123456"],
    "0x1234567",
    deadline,
    { test: 1 }
  );
  expect(
    routerContract.estimateGas.swapExactTokensForTokens
  ).toHaveBeenCalledWith(1, 1, ["0x12345", "0x123456"], "0x1234567", deadline, {
    test: 1,
  });
  spy.mockRestore();
});

test("getAmountsOut", async () => {
  const { routerContract, router } = initRouter();

  Contract.prototype.getAmountsOut = () => {};
  let spy = jest
    .spyOn(routerContract, "getAmountsOut")
    .mockImplementation(() => Promise.resolve());
  await router.getAmountsOut(1, ["0x12345", "0x123456"]);
  expect(routerContract.getAmountsOut).toHaveBeenCalledWith(1, [
    "0x12345",
    "0x123456",
  ]);
  spy.mockRestore();
});

test("estimateGasFee", async () => {
  const { router, provider } = initRouter();

  Contract.prototype.getAmountsOut = () => {};
  let spy = jest
    .spyOn(provider, "getFeeData")
    .mockImplementation(() => Promise.resolve({ maxFeePerGas: 100 }));
  await router.estimateGasFee();
  expect(ethers.utils.formatUnits).toHaveBeenCalledWith(100, "ether");
  spy.mockRestore();
});
