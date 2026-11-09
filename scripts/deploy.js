import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {

    console.log(
        "Deploying CredentialVerification contract..."
    );

    const CredentialVerification =
        await ethers.getContractFactory(
            "CredentialVerification"
        );

    const credentialVerification =
        await CredentialVerification.deploy();

    await credentialVerification.waitForDeployment();

    const contractAddress =
        await credentialVerification.getAddress();

    console.log(
        "CredentialVerification deployed successfully!"
    );

    console.log(
        "Contract address:",
        contractAddress
    );
}

main().catch((error) => {

    console.error(error);

    process.exitCode = 1;

});