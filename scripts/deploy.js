const hre = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // we get the signers from ethers like we did in the test
  const [deployer] = await ethers.getSigners()
  //below we created the NFT and symbol
  const NAME = "TokenMaster"
  const SYMBOL = "TM"


  // We set the account and the variables and deploy
  const TokenMaster = await ethers.getContractFactory("TokenMaster")
  const tokenMaster = await TokenMaster.deploy(NAME, SYMBOL)// we deploy the name and symbol
  await tokenMaster.deployed() // we are wating to be deployed

  console.log(`Deployed TokenMaster Contract at: ${tokenMaster.address}\n`)//we log to the console, hey it was deployed

   // next we get 6 different occasions that we see on the application
  // List 6 events
  const occasions = [
    {
      name: "UFC Miami",//we we deploy we list the event this will show on terminal
      cost: tokens(3),
      tickets: 0,// these tickets are solld out
      date: "May 31",
      time: "6:00PM EST",
      location: "Miami-Dade Arena - Miami, FL"
    },
    {
      name: "ETH Tokyo",//we we deploy we list the event this will show on terminal
      cost: tokens(1),
      tickets: 125,
      date: "May 2",
      time: "1:00PM JST",
      location: "Tokyo, Japan"
    },
    {
      name: "ETH Privacy Hackathon",//we we deploy we list the event this will show on terminal
      cost: tokens(0.25),
      tickets: 200,
      date: "Jun 9",
      time: "10:00AM TRT",
      location: "Turkey, Istanbul"
    },
    {
      name: "Dallas Mavericks vs. San Antonio Spurs",//we we deploy we list the event this will show on terminal
      cost: tokens(5),
      tickets: 0,
      date: "Jun 11",
      time: "2:30PM CST",
      location: "American Airlines Center - Dallas, TX"
    },
    {
      name: "ETH Global Toronto",//we deploy we list the event this will show on terminal
      cost: tokens(1.5),
      tickets: 125,
      date: "Jun 23",
      time: "11:00AM EST",
      location: "Toronto, Canada"
    }
  ]


 // this for loop in JS we create one by one
 for (var i = 0; i < 5; i++) {
    const transaction = await tokenMaster.connect(deployer).list(
      occasions[i].name,
      occasions[i].cost,
      occasions[i].tickets,
      occasions[i].date,
      occasions[i].time,
      occasions[i].location,
    )

    await transaction.wait() //wait for the transation to get included into a block before we continue to the next one
    
    // below we log out to the console that has created an aoccasion
    console.log(`Listed Event ${i + 1}: ${occasions[i].name}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});