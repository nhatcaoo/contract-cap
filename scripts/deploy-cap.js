// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
async function main() {
    const options = {value: ethers.utils.parseEther("100.0")}
    const D1 = await hre.ethers.getContractFactory('TestToken')
    const d1 = await D1.deploy("Duong1", "d1")
    await d1.deployed()
    console.log("d1: ", d1.address)
    const D2 = await hre.ethers.getContractFactory('TestToken')
    const d2 = await D2.deploy("Duong2", "d1")
    await d2.deployed()
    console.log("d2: ", d2.address)

    const Reserve1 = await ethers.getContractFactory('MyReserve')
    const reserve1 = await Reserve1.deploy(d1.address)
    await reserve1.deployed()
    const setExRate1 = await reserve1.setExchangeRates(100,200);
    await setExRate1.wait()
    const depositEth1 = await reserve1.depositEth(options)
    await depositEth1.wait()
    console.log("reserve1: ", reserve1.address)

    const Reserve2 = await ethers.getContractFactory('MyReserve')
    const reserve2 = await Reserve2.deploy(d2.address)
    await reserve2.deployed()
    const setExRate2 = await reserve2.setExchangeRates(100,300);
    await setExRate2.wait()
    const depositEth2 = await reserve2.depositEth(options)
    await depositEth2.wait()
    console.log("reserve2: ", reserve2.address)

    const transferTx = await d1.transfer(reserve1.address, ethers.utils.parseUnits("1000000", "ether"))
    await transferTx.wait()
    const transferTx2 = await d2.transfer(reserve2.address, ethers.utils.parseUnits("1000000", "ether"))
    await transferTx2.wait()
    const Exchange = await ethers.getContractFactory('Exchange')
    const exchange = await Exchange.deploy(d1.address, reserve1.address, d2.address, reserve2.address)
    await exchange.deployed()
    console.log("exchange: ", exchange.address)
    const approveTx1 = await d1.approve(exchange.address, ethers.utils.parseUnits("1000000", "ether"))
    await approveTx1.wait()
    const approveTx2 = await d2.approve(exchange.address, ethers.utils.parseUnits("1000000", "ether"))
    await approveTx2.wait()
    await transferTx2.wait()
    console.log((await exchange.getExchangeRate(d1.address, d2.address, 100)).toString())
    console.log((await exchange.getExchangeRate(d2.address, d1.address, 100)).toString())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
