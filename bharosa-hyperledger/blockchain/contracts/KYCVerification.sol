// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title KYCVerification
 * @dev Decentralized KYC Verification Registry on Blockchain
 * @notice This contract stores KYC verification records immutably
 */
contract KYCVerification {
    
    // Struct to store verification data
    struct Verification {
        bytes32 verificationHash;      // Hash of verification data
        string userId;                 // User identifier
        string documentType;           // Type of document (aadhaar, pan, etc.)
        uint256 timestamp;             // When verification was registered
        bool isValid;                  // Verification status
        address verifier;              // Who verified
    }
    
    // Mapping from verification hash to verification details
    mapping(bytes32 => Verification) public verifications;
    
    // Mapping from userId to list of verification hashes
    mapping(string => bytes32[]) public userVerifications;
    
    // Mapping to check if user has valid verification
    mapping(string => bool) public isUserVerified;
    
    // Total number of verifications
    uint256 public totalVerifications;
    
    // Contract owner
    address public owner;
    
    // Events
    event VerificationRegistered(
        bytes32 indexed verificationHash,
        string indexed userId,
        string documentType,
        uint256 timestamp,
        address verifier
    );
    
    event VerificationRevoked(
        bytes32 indexed verificationHash,
        string indexed userId,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    /**
     * @dev Constructor - sets contract deployer as owner
     */
    constructor() {
        owner = msg.sender;
        totalVerifications = 0;
    }
    
    /**
     * @dev Register a new KYC verification on blockchain
     * @param verificationHash Unique hash of verification data
     * @param userId User identifier
     * @param documentType Type of document verified
     * @return success Whether registration was successful
     */
    function registerVerification(
        bytes32 verificationHash,
        string memory userId,
        string memory documentType
    ) public returns (bool success) {
        require(verificationHash != bytes32(0), "Invalid verification hash");
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(!verifications[verificationHash].isValid, "Verification already exists");
        
        // Create verification record
        verifications[verificationHash] = Verification({
            verificationHash: verificationHash,
            userId: userId,
            documentType: documentType,
            timestamp: block.timestamp,
            isValid: true,
            verifier: msg.sender
        });
        
        // Add to user's verifications
        userVerifications[userId].push(verificationHash);
        
        // Mark user as verified
        isUserVerified[userId] = true;
        
        // Increment counter
        totalVerifications++;
        
        // Emit event
        emit VerificationRegistered(
            verificationHash,
            userId,
            documentType,
            block.timestamp,
            msg.sender
        );
        
        return true;
    }
    
    /**
     * @dev Get verification details by hash
     * @param verificationHash Hash to look up
     * @return isValid Whether verification exists and is valid
     * @return timestamp When it was registered
     * @return userId User who was verified
     * @return documentType Type of document
     */
    function getVerification(bytes32 verificationHash) 
        public 
        view 
        returns (
            bool isValid,
            uint256 timestamp,
            string memory userId,
            string memory documentType
        ) 
    {
        Verification memory v = verifications[verificationHash];
        return (v.isValid, v.timestamp, v.userId, v.documentType);
    }
    
    /**
     * @dev Check if a user has valid KYC verification
     * @param userId User to check
     * @return verified True if user has valid verification
     */
    function isVerified(string memory userId) public view returns (bool verified) {
        return isUserVerified[userId];
    }
    
    /**
     * @dev Get all verifications for a user
     * @param userId User to look up
     * @return hashes Array of verification hashes
     */
    function getUserVerifications(string memory userId) 
        public 
        view 
        returns (bytes32[] memory hashes) 
    {
        return userVerifications[userId];
    }
    
    /**
     * @dev Revoke a verification (only owner)
     * @param verificationHash Hash to revoke
     * @return success Whether revocation was successful
     */
    function revokeVerification(bytes32 verificationHash) 
        public 
        onlyOwner 
        returns (bool success) 
    {
        require(verifications[verificationHash].isValid, "Verification does not exist or already revoked");
        
        verifications[verificationHash].isValid = false;
        
        string memory userId = verifications[verificationHash].userId;
        
        // Check if user has other valid verifications
        bool hasOtherValid = false;
        bytes32[] memory userHashes = userVerifications[userId];
        for (uint i = 0; i < userHashes.length; i++) {
            if (verifications[userHashes[i]].isValid) {
                hasOtherValid = true;
                break;
            }
        }
        
        // Update user verification status
        isUserVerified[userId] = hasOtherValid;
        
        emit VerificationRevoked(verificationHash, userId, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Get contract statistics
     * @return total Total number of verifications
     * @return contractOwner Address of contract owner
     */
    function getStats() 
        public 
        view 
        returns (
            uint256 total,
            address contractOwner
        ) 
    {
        return (totalVerifications, owner);
    }
}
