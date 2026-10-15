const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PersonaNFT", function () {
  const price = ethers.parseEther("0.0001");
  const uri = "data:application/json;base64,eyJuYW1lIjoiVGVzdCJ9";

  async function deploy() {
    const [owner, alice] = await ethers.getSigners();
    const persona = await ethers.deployContract("PersonaNFT", [price]);
    return { persona, owner, alice };
  }

  it("mints when the fee is paid", async function () {
    const { persona, alice } = await deploy();
    await expect(persona.connect(alice).mint(uri, { value: price }))
      .to.emit(persona, "PersonaMinted")
      .withArgs(alice.address, 0);
    expect(await persona.ownerOf(0)).to.equal(alice.address);
    expect(await persona.tokenURI(0)).to.equal(uri);
    expect(await persona.totalMinted()).to.equal(1);
  });

  it("rejects underpayment", async function () {
    const { persona, alice } = await deploy();
    await expect(persona.connect(alice).mint(uri, { value: price - 1n }))
      .to.be.revertedWithCustomError(persona, "InsufficientPayment");
  });

  it("rejects an empty URI", async function () {
    const { persona, alice } = await deploy();
    await expect(persona.connect(alice).mint("", { value: price }))
      .to.be.revertedWithCustomError(persona, "EmptyTokenURI");
  });

  it("only lets the owner change the price and withdraw", async function () {
    const { persona, owner, alice } = await deploy();
    await persona.connect(alice).mint(uri, { value: price });

    await expect(persona.connect(alice).setMintPrice(0))
      .to.be.revertedWithCustomError(persona, "OwnableUnauthorizedAccount");
    await expect(persona.connect(alice).withdraw())
      .to.be.revertedWithCustomError(persona, "OwnableUnauthorizedAccount");

    await expect(persona.withdraw()).to.changeEtherBalances(
      [owner, persona],
      [price, -price]
    );
  });
});
