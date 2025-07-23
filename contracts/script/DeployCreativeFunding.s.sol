// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArrowToken.sol";
import "../src/roughDraftNFT.sol";
import "../src/upgradedNFT.sol";
import "../src/CreativeFundingPlatform.sol";

contract DeployCreativeFunding is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with the account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ArrowToken
        console.log("Deploying ArrowToken...");
        ArrowToken arrowToken = new ArrowToken(deployer);
        console.log("ArrowToken deployed at:", address(arrowToken));

        // 2. Deploy RoughDraftNFT (no constructor args)
        console.log("Deploying RoughDraftNFT...");
        RoughDraftNFT roughDraftNFT = new RoughDraftNFT();
        console.log("RoughDraftNFT deployed at:", address(roughDraftNFT));

        // 3. Deploy UpgradedNFT (no constructor args)
        console.log("Deploying UpgradedNFT...");
        UpgradedNFT upgradedNFT = new UpgradedNFT(deployer);
        console.log("UpgradedNFT deployed at:", address(upgradedNFT));

        // 4. Deploy CreativeFundingPlatform
        console.log("Deploying CreativeFundingPlatform...");
        CreativeFundingPlatform platform = new CreativeFundingPlatform(
            address(roughDraftNFT),
            address(upgradedNFT),
            address(arrowToken),
            deployer
        );
        console.log("CreativeFundingPlatform deployed at:", address(platform));

        // 5. Transfer ownerships
        roughDraftNFT.transferOwnership(address(platform));
        upgradedNFT.transferOwnership(address(platform));
        arrowToken.transferOwnership(address(platform));

        // 6. Transfer ARROW tokens to platform
        uint256 platformTokens = 100_000_000 * 10 ** 18;
        arrowToken.transfer(address(platform), platformTokens);

        vm.stopBroadcast();

    }
}
