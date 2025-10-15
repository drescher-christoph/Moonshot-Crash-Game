// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.0;

contract MockEntropy {

    constructor() {

    }

    function requestV2(uint32 randomNumber)
        external
        payable
        returns (uint64 assignedSequenceNumber)
    {
        return _requestV2(randomNumber);
    }

    function requestV2()
        external
        payable
        returns (uint64 assignedSequenceNumber)
    {
        return _requestV2();
    }

    function _requestV2(
        uint32 userRandomNumber
    ) internal returns (uint64 assignedSequenceNumber) {
        assignedSequenceNumber = userRandomNumber;
        return assignedSequenceNumber;
    }

    function _requestV2() internal returns (uint64 assignedSequenceNumber) {
        if (block.timestamp % 2 == 0) {
            assignedSequenceNumber = 1;
        } else {
            assignedSequenceNumber = 0;
        }
        return assignedSequenceNumber;
    }



    function getFeeV2() external pure returns (uint128) {
        return 0.0001 ether;
    }
}