// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TokenMaster is ERC721 {
    address public owner; 
    uint256 public totalOccasions;
     uint256 public totalSupply;

     struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
    }

    mapping(uint256 => Occasion) occasions;
    mapping(uint256 => mapping(address => bool)) public hasBought;
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;
    mapping(uint256 =>mapping(address => uint256)) public ticketsBought;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor( 
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        owner = msg.sender; 
    }

    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location
    ) public onlyOwner { 
       
        totalOccasions++;
        occasions[totalOccasions] = Occasion(
            totalOccasions,
            _name,
            _cost,
            _maxTickets,
            _maxTickets,
            _date,
            _time,
            _location
        );
    } 
    function mint(uint256 _id, uint256 _seat) public payable {
        // Require that _id is not 0 
        require(_id != 0);
       require(_id <= totalOccasions, "Invalid _id: Exceeds total occasions");

        // Require that ETH sent is greater than cost
        require(msg.value >= occasions[_id].cost);
        
        // Require that the seat is not taken, and the seat exists
        require(seatTaken[_id][_seat] == address(0));
        require(_seat <= occasions[_id].maxTickets);
        require(ticketsBought[_id][msg.sender] <= 2);

        occasions[_id].tickets -= 1; // Update ticket count

        hasBought[_id][msg.sender] = true; // Update buying status
        seatTaken[_id][_seat] = msg.sender; // Assign seat
        ticketsBought[_id][msg.sender]++;
        
        seatsTaken[_id].push(_seat); 
        totalSupply++;

        _safeMint(msg.sender, totalSupply);
    }

    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        return occasions[_id];
    }

    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

     event Refund (
        address indexed recipient,
        uint256 amount 
    );

    function triggerRefund (
        address payable _recipient, 
        uint256 _seat,
        uint256 _id       
    ) public onlyOwner {
        uint256 amount = occasions[_id].cost;

    require(_recipient == seatTaken[_id][_seat], "Only the seat owner can request a refund");
    require(address(this).balance >= amount, "Insufficient contract balance");
    // Update seat ownership to the contract address 
    seatTaken[_id][_seat] = address(this);
    
    //Transfer the refund amount to the recipient
    _recipient.transfer(amount);

    emit Refund(_recipient, amount); 
}
    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }    
}
