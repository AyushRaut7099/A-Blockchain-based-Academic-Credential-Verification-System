// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CredentialVerification {

    address public owner;

    struct Credential {
        string studentName;
        string courseName;
        string institution;
        string credentialId;
        string ipfsCid;
        uint256 issueDate;
        bool isValid;
    }

    mapping(string => Credential) private credentials;


    // EVENTS

    event CredentialIssued(
        string credentialId,
        string studentName,
        string courseName,
        string ipfsCid
    );

    event CredentialRevoked(
        string credentialId
    );


    // CONSTRUCTOR

    constructor() {
        owner = msg.sender;
    }


    // MODIFIER

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner can perform this action"
        );
        _;
    }


    // ISSUE CREDENTIAL

    function issueCredential(
        string memory _credentialId,
        string memory _studentName,
        string memory _courseName,
        string memory _institution,
        string memory _ipfsCid
    ) public onlyOwner {

        require(
            bytes(_credentialId).length > 0,
            "Credential ID cannot be empty"
        );

        require(
            bytes(credentials[_credentialId].credentialId).length == 0,
            "Credential already exists"
        );

        credentials[_credentialId] = Credential({
            studentName: _studentName,
            courseName: _courseName,
            institution: _institution,
            credentialId: _credentialId,
            ipfsCid: _ipfsCid,
            issueDate: block.timestamp,
            isValid: true
        });

        emit CredentialIssued(
            _credentialId,
            _studentName,
            _courseName,
            _ipfsCid
        );
    }


    // VERIFY CREDENTIAL

    function verifyCredential(
        string memory _credentialId
    )
        public
        view
        returns (
            string memory studentName,
            string memory courseName,
            string memory institution,
            string memory ipfsCid,
            uint256 issueDate,
            bool isValid
        )
    {

        Credential memory credential =
            credentials[_credentialId];

        require(
            bytes(credential.credentialId).length > 0,
            "Credential does not exist"
        );

        return (
            credential.studentName,
            credential.courseName,
            credential.institution,
            credential.ipfsCid,
            credential.issueDate,
            credential.isValid
        );
    }


    // REVOKE CREDENTIAL

    function revokeCredential(
        string memory _credentialId
    ) public onlyOwner {

        require(
            bytes(credentials[_credentialId].credentialId).length > 0,
            "Credential does not exist"
        );

        require(
            credentials[_credentialId].isValid,
            "Credential is already revoked"
        );

        credentials[_credentialId].isValid = false;

        emit CredentialRevoked(_credentialId);
    }
}