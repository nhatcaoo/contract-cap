const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Petty NFT", function () {
    let [accountA, accountB, accountC] = []
    let pettyGacha
    let gold
    let address0 = "0x0000000000000000000000000000000000000000"
    let defaulBalance = ethers.utils.parseEther("1000000000")
    let priceGacha1 = ethers.utils.parseEther("100")
    let priceGacha2 = ethers.utils.parseEther("200")
    let priceGacha3 = ethers.utils.parseEther("300")
    let oneDay = 86400
    beforeEach(async () => {
        [accountA, accountB, accountC] = await ethers.getSigners();
        const Gold = await ethers.getContractFactory("Gold");
        gold = await Gold.deploy()
        await gold.deployed()
        const Petty = await ethers.getContractFactory("PettyGacha");
        pettyGacha = await Petty.deploy(gold.address)
        await pettyGacha.deployed()

        await gold.approve(pettyGacha.address, defaulBalance)

    })
    describe("openGacha", function () {
        it("should revert if gacha nonexistent", async function () {
            await expect(pettyGacha.openGacha(7, priceGacha1))
                .to.be.revertedWith("PettyGacha: invalid gacha")
        });
        it("should revert if price not match", async function () {
            await expect(pettyGacha.openGacha(1, priceGacha2))
                .to.be.revertedWith("PettyGacha: price not match")
        });
        it("should open gacha correctly gacha 1", async function () {
            var times = 3;
            for (var i = 1; i <= times; i++) {
                await pettyGacha.openGacha(1, priceGacha1)
                const petty = await pettyGacha._tokenIdToPetty(i)
                console.log(petty.rank)
                expect(await pettyGacha.ownerOf(i)).to.be.equal(accountA.address)
            }
            expect(await gold.balanceOf(pettyGacha.address)).to.be
                .equal(priceGacha1.mul(times))
            expect(await gold.balanceOf(accountA.address)).to.be
                .equal(defaulBalance.sub(priceGacha1.mul(times)))
        });
        it("should open gacha correctly gacha 2", async function () {
            var times = 3;
            for (var i = 1; i <= times; i++) {
                await pettyGacha.openGacha(2, priceGacha2)
                const petty = await pettyGacha._tokenIdToPetty(i)
                console.log(petty.rank)
                expect(await pettyGacha.ownerOf(i)).to.be.equal(accountA.address)
            }
            expect(await gold.balanceOf(pettyGacha.address)).to.be
                .equal(priceGacha2.mul(times))
            expect(await gold.balanceOf(accountA.address)).to.be
                .equal(defaulBalance.sub(priceGacha2.mul(times)))
        });
        it("should open gacha correctly gacha 3", async function () {
            var times = 3;
            for (var i = 1; i <= times; i++) {
                await pettyGacha.openGacha(3, priceGacha3)
                const petty = await pettyGacha._tokenIdToPetty(i)
                console.log(petty.rank)
                expect(await pettyGacha.ownerOf(i)).to.be.equal(accountA.address)
            }
            expect(await gold.balanceOf(pettyGacha.address)).to.be
                .equal(priceGacha3.mul(times))
            expect(await gold.balanceOf(accountA.address)).to.be
                .equal(defaulBalance.sub(priceGacha3.mul(times)))
        });
    })
    describe("breedPetties", function () {
        it("should revert if not owner", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(1, priceGacha1)
            await pettyGacha.openGacha(1, priceGacha1)
            await expect(pettyGacha.connect(accountB).breedPetties(1, 2))
                .to.be.revertedWith("PettyGacha: sender is not owner of token")
        });
        it("should revert if not same rank", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.openGacha(5, priceGacha1)
            await expect(pettyGacha.breedPetties(1, 2))
                .to.be.revertedWith("PettyGacha: must same rank")
        });
        it("should revert if petty is at the highest rank", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(6, priceGacha1)
            await pettyGacha.openGacha(6, priceGacha1)
            await expect(pettyGacha.breedPetties(1, 2))
                .to.be.revertedWith("PettyGacha: petties is at the highest rank")
        });
        it("should revert if nft hasnt been approved", async function () {
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.openGacha(4, priceGacha1)
            await expect(pettyGacha.breedPetties(1, 2))
                .to.be.revertedWith("PettyGacha: The contract is unauthorized to manage this token")
        });
        it("should breed correctly rank 1", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await expect(pettyGacha.ownerOf(1))
            .to
            .be.revertedWith("ERC721: owner query for nonexistent token")
            await expect(pettyGacha.ownerOf(2))
            .to
            .be.revertedWith("ERC721: owner query for nonexistent token")
            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);
            
            let breedInfo = await pettyGacha._idToBreedInfo(1)
            expect(breedInfo.startTime).to.be.equal(await block.timestamp)
            expect(breedInfo.breedTime).to.be.equal(oneDay)
            expect(breedInfo.owner).to.be.equal(accountA.address)
            expect(breedInfo.matron).to.be.equal(1)
            expect(breedInfo.sire).to.be.equal(2)
            expect(breedInfo.newRank).to.be.equal(2)
            // expect(await pettyGacha.ownerOf(3)).to.be.equal(accountA.address)
            // const petty1 = await pettyGacha._tokenIdToPetty(1)
            // const petty2 = await pettyGacha._tokenIdToPetty(2)
            // const petty3 = await pettyGacha._tokenIdToPetty(3)
            // expect(petty1.rank).to.be.equal(0)
            // expect(petty2.rank).to.be.equal(0)
            // expect(petty3.rank).to.be.equal(2)
        })
        it("should breed correctly rank 2", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(5, priceGacha1)
            await pettyGacha.openGacha(5, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await expect(pettyGacha.ownerOf(1))
            .to
            .be.revertedWith("ERC721: owner query for nonexistent token")
            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);
            await expect(pettyGacha.ownerOf(2))
            .to
            .be.revertedWith("ERC721: owner query for nonexistent token")
            let breedInfo = await pettyGacha._idToBreedInfo(1)
            expect(breedInfo.startTime).to.be.equal(await block.timestamp)
            expect(breedInfo.breedTime).to.be.equal(oneDay*2)
            expect(breedInfo.owner).to.be.equal(accountA.address)
            expect(breedInfo.matron).to.be.equal(1)
            expect(breedInfo.sire).to.be.equal(2)
            expect(breedInfo.newRank).to.be.equal(3)          
        })
    })
    describe("claimsPetty", function () {
        it("should revert if not owner", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await expect(pettyGacha.connect(accountB).claimsPetty(1))
            .to
            .be
            .revertedWith("PettyGacha: sender is not breed owner")
        })
        it("should revert if not exceed claim time rank 1", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await network.provider.send("evm_increaseTime", [oneDay * 1 - 1])
            await expect(pettyGacha.claimsPetty(1))
            .to
            .be
            .revertedWith("PettyGacha: breed time hasn't been exceeded")
        })
        it("should claim correctly rank 1", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.openGacha(4, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await network.provider.send("evm_increaseTime", [oneDay * 1 + 1])
            await pettyGacha.claimsPetty(1)
            const petty3 = await pettyGacha._tokenIdToPetty(3)
            expect(petty3.rank).to.be.equal(2)
            let breedInfo = await pettyGacha._idToBreedInfo(1)
            expect(breedInfo.startTime).to.be.equal(0)
            expect(breedInfo.breedTime).to.be.equal(0)
            expect(breedInfo.owner).to.be.equal(address0)
            expect(breedInfo.matron).to.be.equal(0)
            expect(breedInfo.sire).to.be.equal(0)
            expect(breedInfo.newRank).to.be.equal(0)
        })
        it("should revert if not exceed breed time rank 2", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(5, priceGacha1)
            await pettyGacha.openGacha(5, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await network.provider.send("evm_increaseTime", [oneDay * 2 - 1])
            await expect(pettyGacha.claimsPetty(1))
            .to
            .be
            .revertedWith("PettyGacha: breed time hasn't been exceeded")
        })
        it("should claim correctly rank 2", async function () {
            await pettyGacha.setApprovalForAll(pettyGacha.address, true)
            await pettyGacha.openGacha(5, priceGacha1)
            await pettyGacha.openGacha(5, priceGacha1)
            await pettyGacha.breedPetties(1, 2)
            await network.provider.send("evm_increaseTime", [oneDay * 2 + 1])
            await pettyGacha.claimsPetty(1)
            const petty3 = await pettyGacha._tokenIdToPetty(3)
            expect(petty3.rank).to.be.equal(3)
            let breedInfo = await pettyGacha._idToBreedInfo(1)
            expect(breedInfo.startTime).to.be.equal(0)
            expect(breedInfo.breedTime).to.be.equal(0)
            expect(breedInfo.owner).to.be.equal(address0)
            expect(breedInfo.matron).to.be.equal(0)
            expect(breedInfo.sire).to.be.equal(0)
            expect(breedInfo.newRank).to.be.equal(0)

        })
    })
})
