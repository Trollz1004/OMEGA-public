const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Configuration - UPDATE THESE FOR PRODUCTION
  const SHRINERS_WALLET = process.env.SHRINERS_WALLET || deployer.address;
  const INFRASTRUCTURE_WALLET = process.env.INFRASTRUCTURE_WALLET || deployer.address;
  const FOUNDER_WALLET = process.env.FOUNDER_WALLET || deployer.address;

  console.log("\n💛 FOR THE KIDS! - Deploying HeartDAO Contracts 💛\n");

  // 1. Deploy HeartToken (Governance Token)
  console.log("1. Deploying HeartToken...");
  const HeartToken = await hre.ethers.getContractFactory("HeartToken");
  const heartToken = await HeartToken.deploy();
  await heartToken.waitForDeployment();
  const heartTokenAddress = await heartToken.getAddress();
  console.log("   HeartToken deployed to:", heartTokenAddress);

  // 2. Deploy RoyaltyHeartNFT
  console.log("\n2. Deploying RoyaltyHeartNFT...");
  const RoyaltyHeartNFT = await hre.ethers.getContractFactory("RoyaltyHeartNFT");
  const royaltyNFT = await RoyaltyHeartNFT.deploy();
  await royaltyNFT.waitForDeployment();
  const royaltyNFTAddress = await royaltyNFT.getAddress();
  console.log("   RoyaltyHeartNFT deployed to:", royaltyNFTAddress);

  // 3. Deploy HeartDAO
  console.log("\n3. Deploying HeartDAO...");
  const HeartDAO = await hre.ethers.getContractFactory("HeartDAO");
  const heartDAO = await HeartDAO.deploy(
    heartTokenAddress,
    SHRINERS_WALLET,
    INFRASTRUCTURE_WALLET,
    FOUNDER_WALLET
  );
  await heartDAO.waitForDeployment();
  const heartDAOAddress = await heartDAO.getAddress();
  console.log("   HeartDAO deployed to:", heartDAOAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("💕 DEPLOYMENT COMPLETE 💕");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  HeartToken (HEART):", heartTokenAddress);
  console.log("  RoyaltyHeartNFT:", royaltyNFTAddress);
  console.log("  HeartDAO:", heartDAOAddress);
  console.log("\nRevenue Split Configuration:");
  console.log("  60% → Shriners:", SHRINERS_WALLET);
  console.log("  30% → Infrastructure:", INFRASTRUCTURE_WALLET);
  console.log("  10% → Founder:", FOUNDER_WALLET);
  console.log("\n💛 FOR THE KIDS! 💛\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      HeartToken: heartTokenAddress,
      RoyaltyHeartNFT: royaltyNFTAddress,
      HeartDAO: heartDAOAddress,
    },
    wallets: {
      shriners: SHRINERS_WALLET,
      infrastructure: INFRASTRUCTURE_WALLET,
      founder: FOUNDER_WALLET,
    },
  };

  console.log("\nDeployment Info (save this!):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
