// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RoyaltyHeartNFT
 * @dev NFT collection for the 5 Royalty Founder Cards
 *
 * Cards:
 * - Token 1: Ace of Hearts ♥️
 * - Token 2: King of Hearts 👑
 * - Token 3: Queen of Hearts 👸
 * - Token 4: Jack of Hearts 🃏
 * - Token 5: Joker's Heart 🎭 (Random drawing winner)
 *
 * These are the ONLY 5 that will EVER exist.
 * Each grants: Free premium for life, unlimited super likes, DAO voting power
 *
 * FOR THE KIDS! 💛
 */
contract RoyaltyHeartNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    uint256 public constant MAX_SUPPLY = 5;
    uint256 public constant CARD_PRICE = 1000 ether; // 1000 USD equivalent

    enum CardType { NONE, ACE, KING, QUEEN, JACK, JOKER }

    mapping(uint256 => CardType) public tokenCardType;
    mapping(CardType => bool) public cardMinted;
    mapping(CardType => string) public cardAnimationURI;

    // Joker winner gets to customize their animation
    string public jokerCustomAnimation;
    address public jokerWinner;

    event RoyaltyCardMinted(
        address indexed owner,
        uint256 indexed tokenId,
        CardType cardType,
        uint256 timestamp
    );

    event JokerAnimationSet(
        address indexed winner,
        string animationDescription,
        uint256 timestamp
    );

    constructor() ERC721("Royalty Heart Cards", "HEART") Ownable(msg.sender) {
        // Set default animation URIs (IPFS links to be updated)
        cardAnimationURI[CardType.ACE] = "ipfs://QmAceOfHeartsAnimation";
        cardAnimationURI[CardType.KING] = "ipfs://QmKingOfHeartsAnimation";
        cardAnimationURI[CardType.QUEEN] = "ipfs://QmQueenOfHeartsAnimation";
        cardAnimationURI[CardType.JACK] = "ipfs://QmJackOfHeartsAnimation";
        cardAnimationURI[CardType.JOKER] = "ipfs://QmJokerHeartAnimation";
    }

    /**
     * @dev Mint a Royalty Card (Ace, King, Queen, Jack)
     * Only callable by owner (after payment verified off-chain)
     */
    function mintRoyaltyCard(address to, CardType cardType) external onlyOwner {
        require(cardType != CardType.NONE && cardType != CardType.JOKER, "Invalid card type");
        require(!cardMinted[cardType], "Card already minted");
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        tokenCardType[tokenId] = cardType;
        cardMinted[cardType] = true;

        _setTokenURI(tokenId, cardAnimationURI[cardType]);

        emit RoyaltyCardMinted(to, tokenId, cardType, block.timestamp);
    }

    /**
     * @dev Mint the Joker card to random drawing winner
     * Called on Valentine's Day 2026
     */
    function mintJokerCard(address winner) external onlyOwner {
        require(!cardMinted[CardType.JOKER], "Joker already minted");
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(winner, tokenId);
        tokenCardType[tokenId] = CardType.JOKER;
        cardMinted[CardType.JOKER] = true;
        jokerWinner = winner;

        _setTokenURI(tokenId, cardAnimationURI[CardType.JOKER]);

        emit RoyaltyCardMinted(winner, tokenId, CardType.JOKER, block.timestamp);
    }

    /**
     * @dev Set custom animation for Joker (winner's choice)
     */
    function setJokerAnimation(string calldata animationDescription, string calldata newURI) external {
        require(msg.sender == jokerWinner, "Only Joker winner can customize");
        jokerCustomAnimation = animationDescription;

        // Find Joker token and update URI
        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            if (tokenCardType[i] == CardType.JOKER) {
                _setTokenURI(i, newURI);
                break;
            }
        }

        emit JokerAnimationSet(msg.sender, animationDescription, block.timestamp);
    }

    /**
     * @dev Get card details
     */
    function getCardDetails(uint256 tokenId) external view returns (
        CardType cardType,
        address owner,
        string memory animationURI
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (
            tokenCardType[tokenId],
            ownerOf(tokenId),
            tokenURI(tokenId)
        );
    }

    /**
     * @dev Get remaining cards available
     */
    function getRemainingCards() external view returns (
        bool aceAvailable,
        bool kingAvailable,
        bool queenAvailable,
        bool jackAvailable,
        bool jokerAvailable
    ) {
        return (
            !cardMinted[CardType.ACE],
            !cardMinted[CardType.KING],
            !cardMinted[CardType.QUEEN],
            !cardMinted[CardType.JACK],
            !cardMinted[CardType.JOKER]
        );
    }

    /**
     * @dev Check if address owns a Royalty Card
     */
    function isRoyaltyHolder(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    // Required overrides
    function _update(address to, address from, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, from, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
