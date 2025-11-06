// Deploy KYCVerification smart contract to Ganache
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying KYCVerification Smart Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy contract
  const KYCVerification = await hre.ethers.getContractFactory("KYCVerification");
  console.log("\n⏳ Deploying contract...");
  
  const kycContract = await KYCVerification.deploy();
  await kycContract.waitForDeployment();

  const contractAddress = await kycContract.getAddress();
  console.log("✅ KYCVerification deployed to:", contractAddress);

  // Get deployment info
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  console.log("📦 Deployed at block:", blockNumber);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: blockNumber,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    abi: KYCVerification.interface.formatJson()
  };

  // Save to file
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, "KYCVerification.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to: deployments/KYCVerification.json");

  // Test contract
  console.log("\n🧪 Testing contract...");
  const stats = await kycContract.getStats();
  console.log("   Total Verifications:", stats[0].toString());
  console.log("   Contract Owner:", stats[1]);

  console.log("\n✨ Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("   1. Update backend .env with:");
  console.log(`      BLOCKCHAIN_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Restart backend service");
  console.log("   3. KYC verifications will now be stored on blockchain!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
