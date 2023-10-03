const {
  expect
} = require("chai")

const NAME = "TokenMaster"
const SYMBOL = "TM"
const OCCASION_NAME = "ETH Texas"
const OCCASION_COST = ethers.utils.parseUnits('1', 'ether')
const OCCASION_MAX_TICKETS = 100
const OCCASION_DATE = "Apr 27"
const OCCASION_TIME = "10:00AM CST"
const OCCASION_LOCATION = "Austin, Texas"

describe("TokenMaster", () => {
  let tokenMaster
  let deployer, buyer, attacker

  beforeEach(async () => {
    [deployer, buyer, attacker] = await ethers.getSigners()
    const TokenMaster = await ethers.getContractFactory("TokenMaster")

    tokenMaster = await TokenMaster.deploy(NAME, SYMBOL)
    const transaction = await tokenMaster.connect(deployer).list(
      OCCASION_NAME,
      OCCASION_COST,
      OCCASION_MAX_TICKETS,
      OCCASION_DATE,
      OCCASION_TIME,
      OCCASION_LOCATION
    )
    await transaction.wait()
  })

  describe("Deployment", () => {
    it("Sets the name", async () => {
      expect(await tokenMaster.name()).to.equal(NAME)
    })

    it("Sets the symbol", async () => {
      expect(await tokenMaster.symbol()).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      expect(await tokenMaster.owner()).to.equal(deployer.address)
    })
  })

  describe("Occasions", () => {
    describe('Success', async () => {
      it("Updates occasions count", async () => {
        const totalOccasions = await tokenMaster.totalOccasions()
        expect(totalOccasions).to.be.equal(1)
      })

      it('Returns occasions attributes', async () => {
        const occasion = await tokenMaster.getOccasion(1)
        expect(occasion.id).to.be.equal(1)
        expect(occasion.name).to.be.equal(OCCASION_NAME)
        expect(occasion.cost).to.be.equal(OCCASION_COST)
        expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS)
        expect(occasion.date).to.be.equal(OCCASION_DATE)
        expect(occasion.time).to.be.equal(OCCASION_TIME)
        expect(occasion.location).to.be.equal(OCCASION_LOCATION)
      })
    })

    describe('Failure', async () => {
      it('Rejects non-owner from listing', async () => {
        await expect(tokenMaster.connect(attacker).list(
          OCCASION_NAME,
          OCCASION_COST,
          OCCASION_MAX_TICKETS,
          OCCASION_DATE,
          OCCASION_TIME,
          OCCASION_LOCATION
        )).to.be.reverted
      })
    })
  })

  describe("Minting", () => {
    const ID = 1
    const SEAT = 50
    const AMOUNT = ethers.utils.parseUnits('1', 'ether')
    describe("Success", () => {
      beforeEach(async () => {
        const transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, {
          value: AMOUNT
        })
        await transaction.wait()
      })

      it('Updates ticket count', async () => {
        const occasion = await tokenMaster.getOccasion(1)
        expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS - 1)
      })

      it('Updates buying status', async () => {
        const status = await tokenMaster.hasBought(ID, buyer.address)
        expect(status).to.be.equal(true)
      })

      it('Updates seat status', async () => {
        const owner = await tokenMaster.seatTaken(ID, SEAT)
        expect(owner).to.equal(buyer.address)
      })

      it('Updates overall seating status', async () => {
        const seats = await tokenMaster.getSeatsTaken(ID)
        expect(seats.length).to.equal(1)
        expect(seats[0]).to.equal(SEAT)
      })

      it('Updates the contract balance', async () => {
        const balance = await ethers.provider.getBalance(tokenMaster.address)
        expect(balance).to.be.equal(AMOUNT)
      })
    })

    describe("Failure", async () => {
      it("Rejects if id is 0", async () => {
        await expect(tokenMaster.connect(buyer).mint(0, 1, {
          value: AMOUNT
        })).to.be.reverted
      })

      it("Rejects insufficient amount", async () => {
        await expect(tokenMaster.connect(buyer).mint(1, 1, {
          value: ethers.utils.parseUnits('0.5', 'ether')
        })).to.be.reverted
      })

      it("Check if the seat is not taken", async () => {
        const validOccasionId = 1; 
        const validTakenSeat = 2; 
        await tokenMaster.connect(buyer).mint(validOccasionId, validTakenSeat, {
          value: AMOUNT
        })

        await expect(tokenMaster.connect(buyer).mint(validOccasionId, validTakenSeat, {
          value: AMOUNT
        })).to.be.reverted
      })

      it("Fails when seat number exceeds maxTickets", async () => {
        await expect(tokenMaster.connect(buyer).mint(1, 110, {
          value: AMOUNT
        })).to.be.reverted
      })

      it("Revert if user tries to buy more than two tickets", async () => {
        const Id = 1;
        await tokenMaster.connect(buyer).mint(Id, 1, {
          value: AMOUNT
        })

        await tokenMaster.connect(buyer).mint(Id, 2, {
          value: AMOUNT
        })

        await expect(
          tokenMaster.connect(buyer).mint(Id, 2, {
            value: AMOUNT
          })).to.be.reverted
      })
    })
  })

  describe("Withdrawing", () => {
    describe("Success", () => {
      const ID = 1
      const SEAT = 50
      const AMOUNT = ethers.utils.parseUnits("1", 'ether')
      let balanceBefore;
      let recipient;

      beforeEach(async () => {
        recipient = buyer
        balanceBefore = await ethers.provider.getBalance(deployer.address)
        let transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, {
          value: AMOUNT
        })
        await transaction.wait();
      })

      it('Updates the owner balance', async () => {
        transaction = await tokenMaster.connect(deployer).withdraw()
        await transaction.wait()
        const balanceAfter = await ethers.provider.getBalance(deployer.address)
        expect(balanceAfter).to.be.greaterThan(balanceBefore)
      })
    })

    describe("Failure", async () => {
      it("Rejects non-owner from Withdrawing", async () => {
        await expect(tokenMaster.connect(buyer).withdraw()).to.be.reverted
      })
    })
  })
})