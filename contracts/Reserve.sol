pragma solidity ^0.4.17;

interface ERC20 {
    function totalSupply() public constant returns (uint256);

    function balanceOf(address tokenOwner)
        public
        constant
        returns (uint256 balance);

    function allowance(address tokenOwner, address spender)
        public
        constant
        returns (uint256 remaining);

    function transfer(address to, uint256 tokens) public returns (bool success);

    function approve(address spender, uint256 tokens)
        public
        returns (bool success);

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint256 tokens);
    event Approval(
        address indexed tokenOwner,
        address indexed spender,
        uint256 tokens
    );
}

contract MyReserve {
    //address of owner
    address public owner;
    // tradeFlag = true: allow trading
    bool public tradeFlag;
    //information about custom token
    struct Token {
        address addressToken;
        uint256 buyRate;
        uint256 sellRate;
    }
    //address of native token
    address public constant addressEth =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    Token public token;

    function MyReserve(address _token) public {
        owner = msg.sender;
        tradeFlag = true;
        token.addressToken = _token;
        token.buyRate = 1;
        token.sellRate = 2;
    }
    function depositEth() payable public {
        
    }
    function withdraw(address tokenAddress, uint256 amount) public onlyOwner {
        if (tokenAddress == token.addressToken) {
            ERC20(token.addressToken).transfer(msg.sender, amount);
            Transfer(token.addressToken, msg.sender, amount);
        } else {
            msg.sender.transfer(amount);
            Transfer(address(this), msg.sender, amount);
        }
    }

    function getExchangeRate(bool isBuy) public view returns (uint256) {
        if (isBuy) {
            return token.sellRate;
        } else {
            return token.buyRate;
        }
    }

    function setExchangeRates(uint256 buyRate, uint256 sellRate)
        public
        onlyOwner
    {
        token.buyRate = buyRate;
        token.sellRate = sellRate;
    }

    function setTradeFlag(bool value) public onlyOwner {
        tradeFlag = value;
    }

    function exchange(bool _isBuy, uint256 amount)
        public
        payable
        requireFlag
        returns (uint256)
    {
        if (_isBuy) {
            require((msg.value) == (amount));
            uint256 currentTokenBalance = ERC20(token.addressToken).balanceOf(
                address(this)
            );
            require(currentTokenBalance >= (amount / token.sellRate));

            ERC20(token.addressToken).transfer(
                msg.sender,
                amount / token.sellRate
            );
            Transfer(token.addressToken, msg.sender, amount / token.sellRate);
        } else {
            require(this.balance >= (amount * token.buyRate));
            ERC20(token.addressToken).transferFrom(msg.sender, this, amount);
            msg.sender.transfer(amount * token.buyRate);
            return amount * token.buyRate;
        }
    }

    function getBalance() public view returns (uint256) {
        return this.balance;
    }

    function getBalanceToken() public view returns (uint256) {
        uint256 amount = ERC20(token.addressToken).balanceOf(address(this));
        return amount;
    }

    function() public payable {}

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier requireFlag() {
        require(tradeFlag == true);
        _;
    }

    event Transfer(address indexed from, address indexed to, uint256 tokens);
}
