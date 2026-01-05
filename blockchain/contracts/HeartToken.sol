// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HeartToken (HEART)
 * @dev Governance token for HeartDAO
 *
 * Token Distribution:
 * - Royalty Founders: 1000 HEART each (5 total = 5000 HEART)
 * - Premium Members: 10 HEART per month subscribed
 * - Early Bird Pre-orders: 50 HEART bonus
 *
 * FOR THE KIDS! 💛
 */
contract HeartToken is ERC20, ERC20Permit, ERC20Votes, Ownable {

    uint256 public constant ROYALTY_FOUNDER_ALLOCATION = 1000 * 10**18;
    uint256 public constant PREMIUM_MONTHLY_ALLOCATION = 10 * 10**18;
    uint256 public constant EARLY_BIRD_BONUS = 50 * 10**18;

    mapping(address => bool) public hasClaimedEarlyBird;

    event EarlyBirdClaimed(address indexed user, uint256 amount);
    event PremiumRewardMinted(address indexed user, uint256 months, uint256 amount);
    event RoyaltyFounderTokensMinted(address indexed founder, uint256 amount);

    constructor()
        ERC20("Heart Token", "HEART")
        ERC20Permit("Heart Token")
        Ownable(msg.sender)
    {
        // Mint initial treasury for DAO operations
        _mint(msg.sender, 100000 * 10**18); // 100k HEART treasury
    }

    /**
     * @dev Mint tokens for Royalty Founders (called when card is purchased)
     */
    function mintRoyaltyFounderTokens(address founder) external onlyOwner {
        _mint(founder, ROYALTY_FOUNDER_ALLOCATION);
        emit RoyaltyFounderTokensMinted(founder, ROYALTY_FOUNDER_ALLOCATION);
    }

    /**
     * @dev Claim early bird bonus (one time per wallet)
     */
    function claimEarlyBirdBonus() external {
        require(!hasClaimedEarlyBird[msg.sender], "Already claimed");
        hasClaimedEarlyBird[msg.sender] = true;
        _mint(msg.sender, EARLY_BIRD_BONUS);
        emit EarlyBirdClaimed(msg.sender, EARLY_BIRD_BONUS);
    }

    /**
     * @dev Mint premium subscription rewards
     */
    function mintPremiumReward(address user, uint256 months) external onlyOwner {
        uint256 amount = months * PREMIUM_MONTHLY_ALLOCATION;
        _mint(user, amount);
        emit PremiumRewardMinted(user, months, amount);
    }

    // Required overrides for ERC20Votes
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
