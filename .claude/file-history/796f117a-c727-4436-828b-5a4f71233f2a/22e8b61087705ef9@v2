// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HeartDAO
 * @dev DAO Governance for AiCollabForTheKids Dating Platform
 *
 * Revenue Split (Gospel V1.3):
 * - 60% Shriners Children's Hospital
 * - 30% Platform Infrastructure
 * - 10% Founder Sustainability
 *
 * FOR THE KIDS! 💛
 */
contract HeartDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    Ownable
{
    // Revenue allocation percentages (in basis points, 10000 = 100%)
    uint256 public constant CHARITY_SHARE = 6000;      // 60%
    uint256 public constant INFRASTRUCTURE_SHARE = 3000; // 30%
    uint256 public constant FOUNDER_SHARE = 1000;      // 10%

    // Wallet addresses
    address public shrinersWallet;
    address public infrastructureWallet;
    address public founderWallet;

    // Royalty Founder tracking
    mapping(address => bool) public isRoyaltyFounder;
    mapping(address => string) public founderCard; // "ACE", "KING", "QUEEN", "JACK", "JOKER"
    uint256 public royaltyFounderCount;
    uint256 public constant MAX_ROYALTY_FOUNDERS = 5;

    // Events
    event RevenueDistributed(
        uint256 totalAmount,
        uint256 charityAmount,
        uint256 infraAmount,
        uint256 founderAmount,
        uint256 timestamp
    );

    event RoyaltyFounderMinted(
        address indexed founder,
        string cardType,
        uint256 timestamp
    );

    event ShrinersWalletUpdated(address oldWallet, address newWallet);
    event CharityDonationMade(address indexed donor, uint256 amount, string message);

    constructor(
        IVotes _token,
        address _shrinersWallet,
        address _infrastructureWallet,
        address _founderWallet
    )
        Governor("HeartDAO")
        GovernorSettings(
            1 days,    // Voting delay
            1 weeks,   // Voting period
            1e18       // Proposal threshold (1 token)
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        Ownable(msg.sender)
    {
        shrinersWallet = _shrinersWallet;
        infrastructureWallet = _infrastructureWallet;
        founderWallet = _founderWallet;
    }

    /**
     * @dev Distribute revenue according to Gospel V1.3 split
     */
    function distributeRevenue() external payable {
        require(msg.value > 0, "No revenue to distribute");

        uint256 charityAmount = (msg.value * CHARITY_SHARE) / 10000;
        uint256 infraAmount = (msg.value * INFRASTRUCTURE_SHARE) / 10000;
        uint256 founderAmount = msg.value - charityAmount - infraAmount;

        // Transfer to wallets
        (bool charitySuccess, ) = shrinersWallet.call{value: charityAmount}("");
        require(charitySuccess, "Charity transfer failed");

        (bool infraSuccess, ) = infrastructureWallet.call{value: infraAmount}("");
        require(infraSuccess, "Infrastructure transfer failed");

        (bool founderSuccess, ) = founderWallet.call{value: founderAmount}("");
        require(founderSuccess, "Founder transfer failed");

        emit RevenueDistributed(
            msg.value,
            charityAmount,
            infraAmount,
            founderAmount,
            block.timestamp
        );
    }

    /**
     * @dev Mint a Royalty Founder Card (only 5 ever)
     */
    function mintRoyaltyFounder(address founder, string calldata cardType) external onlyOwner {
        require(royaltyFounderCount < MAX_ROYALTY_FOUNDERS, "All Royalty cards minted");
        require(!isRoyaltyFounder[founder], "Already a Royalty Founder");
        require(
            keccak256(bytes(cardType)) == keccak256("ACE") ||
            keccak256(bytes(cardType)) == keccak256("KING") ||
            keccak256(bytes(cardType)) == keccak256("QUEEN") ||
            keccak256(bytes(cardType)) == keccak256("JACK") ||
            keccak256(bytes(cardType)) == keccak256("JOKER"),
            "Invalid card type"
        );

        isRoyaltyFounder[founder] = true;
        founderCard[founder] = cardType;
        royaltyFounderCount++;

        emit RoyaltyFounderMinted(founder, cardType, block.timestamp);
    }

    /**
     * @dev Check if address is Royalty Founder
     */
    function getRoyaltyStatus(address user) external view returns (bool isFounder, string memory card) {
        return (isRoyaltyFounder[user], founderCard[user]);
    }

    /**
     * @dev Direct donation to Shriners (100% goes to charity)
     */
    function donateToShriners(string calldata message) external payable {
        require(msg.value > 0, "No donation amount");

        (bool success, ) = shrinersWallet.call{value: msg.value}("");
        require(success, "Donation transfer failed");

        emit CharityDonationMade(msg.sender, msg.value, message);
    }

    /**
     * @dev Update Shriners wallet (requires DAO vote)
     */
    function updateShrinersWallet(address newWallet) external onlyGovernance {
        require(newWallet != address(0), "Invalid address");
        address oldWallet = shrinersWallet;
        shrinersWallet = newWallet;
        emit ShrinersWalletUpdated(oldWallet, newWallet);
    }

    // Required overrides
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
