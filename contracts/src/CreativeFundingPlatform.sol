// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// --- Interfaces ---

interface IRoughDraftNFT {
    struct ProjectInfo {
        address creator;
        uint256 fundingGoal;
        uint256 fundingRaised;
        string metadataURI;
        uint256 deadline;
        bool delivered;
        uint256 createdAt;
    }

    function getProject(uint256 projectId) external view returns (ProjectInfo memory);
    function markDelivered(uint256 projectId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenToProject(uint256 tokenId) external view returns (uint256);
    function backerContribution(uint256 projectId, address backer) external view returns (uint256);
}

interface IUpgradedNFT {
    function isUpgraded(uint256 tokenId) external view returns (bool);
    function upgradeNFT(address to, uint256 originalTokenId, string memory newMetadataURI) external returns (uint256);
}

interface IArrowToken {
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        bool revocable
    ) external;
}

// --- Main Contract ---

contract CreativeFundingPlatform is Ownable, ReentrancyGuard {
    IRoughDraftNFT public roughDraftNFT;
    IUpgradedNFT public upgradedNFT;
    IArrowToken public arrowToken;

    uint256 public constant CREATOR_UPFRONT_PERCENTAGE = 30;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 5;
    uint256 public constant ARROW_REWARD_PER_ETH = 1000 * 10 ** 18; // 1000 ARROW per ETH
    uint256 public constant VESTING_DURATION = 365 days;

    struct ProjectStatus {
        bool fundsReleased;
        uint256 totalRefunded;
        bool arrowDistributed;
        uint256 creatorPayout;
    }

    mapping(uint256 => ProjectStatus) public projectStatus;
    mapping(uint256 => uint256) public refundDeadline; // projectId => refund cutoff timestamp

    event CreatorPaidUpfront(uint256 indexed projectId, address indexed creator, uint256 amount);
    event ProjectDelivered(uint256 indexed projectId, address indexed creator);
    event NFTUpgraded(uint256 indexed projectId, address indexed backer, uint256 originalTokenId, uint256 newTokenId);
    event RefundClaimed(uint256 indexed projectId, address indexed backer, uint256 amount, uint256 tokenId);
    event RemainingFundsReleased(uint256 indexed projectId, address indexed creator, uint256 amount);
    event ArrowTokensDistributed(uint256 indexed projectId, uint256 totalAmount);

    constructor(
        address _roughDraftNFT,
        address _upgradedNFT,
        address _arrowToken,
        address initialOwner
    ) Ownable(initialOwner) {
        roughDraftNFT = IRoughDraftNFT(_roughDraftNFT);
        upgradedNFT = IUpgradedNFT(_upgradedNFT);
        arrowToken = IArrowToken(_arrowToken);
    }

    function releaseUpfrontPayment(uint256 projectId) external nonReentrant {
        IRoughDraftNFT.ProjectInfo memory project = roughDraftNFT.getProject(projectId);
        require(project.creator == msg.sender, "Only creator can claim upfront payment");
        require(!projectStatus[projectId].fundsReleased, "Already claimed");
        require(project.fundingRaised > 0, "No funds raised");

        uint256 upfront = (project.fundingRaised * CREATOR_UPFRONT_PERCENTAGE) / 100;
        uint256 fee = (upfront * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 creatorPayout = upfront - fee;

        projectStatus[projectId].fundsReleased = true;
        projectStatus[projectId].creatorPayout = creatorPayout;
        refundDeadline[projectId] = project.deadline + 90 days;

        payable(project.creator).transfer(creatorPayout);
        payable(owner()).transfer(fee);

        emit CreatorPaidUpfront(projectId, project.creator, creatorPayout);
    }

    function deliverProject(uint256 projectId, string memory upgradedMetadataURI) external {
        IRoughDraftNFT.ProjectInfo memory project = roughDraftNFT.getProject(projectId);
        require(project.creator == msg.sender, "Only creator can deliver");
        require(!project.delivered, "Already delivered");

        roughDraftNFT.markDelivered(projectId);
        emit ProjectDelivered(projectId, msg.sender);
    }

    function upgradeNFTAndClaimRewards(uint256 tokenId) external nonReentrant {
        require(roughDraftNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        uint256 projectId = roughDraftNFT.tokenToProject(tokenId);
        IRoughDraftNFT.ProjectInfo memory project = roughDraftNFT.getProject(projectId);

        require(project.delivered, "Project not delivered");
        require(!upgradedNFT.isUpgraded(tokenId), "Already upgraded");

        uint256 newTokenId = upgradedNFT.upgradeNFT(msg.sender, tokenId, project.metadataURI);

        uint256 contribution = roughDraftNFT.backerContribution(projectId, msg.sender);
        uint256 share = (contribution * 10000) / project.fundingRaised;

        uint256 remaining = (project.fundingRaised * 70) / 100;
        uint256 payout = (remaining * share) / 10000;

        if (payout > 0) {
            payable(msg.sender).transfer(payout);
        }

        uint256 arrowReward = (contribution * ARROW_REWARD_PER_ETH) / 1 ether;
        if (arrowReward > 0) {
            arrowToken.createVestingSchedule(
                msg.sender,
                arrowReward,
                block.timestamp,
                VESTING_DURATION,
                false
            );
        }

        emit NFTUpgraded(projectId, msg.sender, tokenId, newTokenId);
    }

    function claimRefund(uint256 tokenId) external nonReentrant {
        require(roughDraftNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        uint256 projectId = roughDraftNFT.tokenToProject(tokenId);
        IRoughDraftNFT.ProjectInfo memory project = roughDraftNFT.getProject(projectId);

        require(!project.delivered, "Project delivered");
        require(block.timestamp < refundDeadline[projectId], "Refund expired");
        require(!upgradedNFT.isUpgraded(tokenId), "Already upgraded");

        uint256 contribution = roughDraftNFT.backerContribution(projectId, msg.sender);
        require(contribution > 0, "No contribution");

        uint256 refund = (contribution * 70) / 100;
        upgradedNFT.upgradeNFT(msg.sender, tokenId, "refunded");

        payable(msg.sender).transfer(refund);
        emit RefundClaimed(projectId, msg.sender, refund, tokenId);
    }

    function releaseRemainingFunds(uint256 projectId) external nonReentrant {
        IRoughDraftNFT.ProjectInfo memory project = roughDraftNFT.getProject(projectId);
        require(project.creator == msg.sender, "Only creator");
        require(project.delivered, "Project not delivered");
        require(block.timestamp > refundDeadline[projectId], "Refund window open");

        uint256 total = (project.fundingRaised * 70) / 100;
        uint256 fee = (total * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 payout = total - fee;

        payable(project.creator).transfer(payout);
        payable(owner()).transfer(fee);

        emit RemainingFundsReleased(projectId, msg.sender, payout);
    }

    function getProjectStatus(uint256 projectId) external view returns (ProjectStatus memory) {
        return projectStatus[projectId];
    }

    function calculateBackerShare(uint256 projectId, address backer) external view returns (uint256) {
        uint256 contribution = roughDraftNFT.backerContribution(projectId, backer);
        IRoughDraftNFT.ProjectInfo memory project = roughDraftNFT.getProject(projectId);
        if (project.fundingRaised == 0) return 0;
        return (contribution * 10000) / project.fundingRaised;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
