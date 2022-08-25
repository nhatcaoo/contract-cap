pragma solidity ^0.4.17;

// import './Reserve.sol';
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

interface Reserve {
    function withdraw(address tokenAddress, uint256 amount) public;

    function getExchangeRate(bool isBuy) public view returns (uint256);

    function setExchangeRates(uint256 buyRate, uint256 sellRate) public;

    function setTradeFlag(bool value) public;

    function exchange(bool _isBuy, uint256 amount)
        public
        payable
        returns (uint256);

    function getBalance() public view returns (uint256);

    function getBalanceToken() public view returns (uint256);
}

contract Exchange {
    //address of owner
    address owner;
    //address of native token
    address public constant addressEth =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    mapping(address => Reserve) listReserves;

    function Exchange(
        address _token1,
        address _reserve1,
        address _token2,
        address _reserve2
    ) public {
        Reserve temp1 = Reserve(_reserve1);
        listReserves[_token1] = temp1;
        Reserve temp2 = Reserve(_reserve2);
        listReserves[_token2] = temp2;
        owner = msg.sender;
    }

    function addReserve(
        address reserveAddress,
        address tokenAddress,
        bool isAdd
    ) public {
        if (isAdd) {
            Reserve temp = Reserve(reserveAddress);
            listReserves[tokenAddress] = temp;
        } else {
            delete (listReserves[tokenAddress]);
        }
    }

    function setExchangeRate(
        address tokenAddress,
        uint256 buyRate,
        uint256 sellRate
    ) public onlyOwner {
        listReserves[tokenAddress].setExchangeRates(buyRate, sellRate);
    }

    function getExchangeRate(
        address srcToken,
        address destToken,
        uint256 amount
    ) public view returns (uint256) {
        if (destToken == srcToken) {
            return 1;
        }
        if (destToken != addressEth && srcToken != addressEth) {
            Reserve reserveDest = listReserves[destToken];
            Reserve reserveSrc = listReserves[srcToken];

            uint256 rateSellToSrc = reserveSrc.getExchangeRate(false);
            uint256 rateBuyFromDest = reserveDest.getExchangeRate(true);
            uint256 rate1 = (amount / rateSellToSrc) * rateBuyFromDest;
            return rate1;
        }
        if (srcToken == addressEth) {
            //swap from eth to custom token ~ buy token
            Reserve reserve = listReserves[destToken];
            uint256 rate = amount / reserve.getExchangeRate(true);
            return rate;
        }
        if (destToken == addressEth) {
            //swap from custom token to eth
            reserve = listReserves[srcToken];
            rate = amount * reserve.getExchangeRate(false);
            return rate;
        }
    }

    function exchangeTokens(
        address srcToken,
        address destToken,
        uint256 amount
    ) public payable {
        if (destToken == srcToken) {
            return;
        }
        Reserve reserveSrc = listReserves[srcToken];
        Reserve reserveDest = listReserves[destToken];
        uint256 amountTokenReturn = 0;
        uint256 amountEthReturn = 0;
        if (destToken != addressEth && srcToken != addressEth) {
            ERC20(srcToken).transferFrom(msg.sender, address(this), amount);
            ERC20(srcToken).approve(reserveSrc, amount);
            reserveSrc.exchange(false, amount);
            amountEthReturn = amount * reserveSrc.getExchangeRate(false);
            reserveDest.exchange.value(amountEthReturn)(true, amountEthReturn);
            amountTokenReturn =
                amountEthReturn /
                reserveDest.getExchangeRate(true);

            ERC20(destToken).transfer(msg.sender, amountTokenReturn);

            return;
        }
        if (srcToken == addressEth) {
            //swap from eth to custom token
            require((msg.value) == (amount));
            reserveDest.exchange.value(amount)(true, amount);
            amountTokenReturn = amount / reserveDest.getExchangeRate(true);
            ERC20(destToken).transfer(msg.sender, amountTokenReturn);
            return;
        }
        if (destToken == addressEth) {
            //swap from custom token to eth
            ERC20(srcToken).transferFrom(msg.sender, address(this), amount);
            ERC20(srcToken).approve(reserveSrc, amount);
            reserveSrc.exchange(false, amount);
            amountEthReturn = amount * reserveSrc.getExchangeRate(false);
            msg.sender.transfer(amountEthReturn);
            return;
        }
    }

    function sendToken(
        address srcToken,
        address destToken,
        uint256 amount
    ) public payable {
        ERC20(srcToken).transferFrom(msg.sender, address(this), amount);
        Reserve reserve = listReserves[srcToken];
        ERC20(srcToken).approve(reserve, amount);
        reserve.exchange(false, amount);
        msg.sender.transfer(this.balance);
    }

    function withdraw(address tokenAddress, uint256 amount) public onlyOwner {
        if (tokenAddress != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            ERC20(tokenAddress).transfer(msg.sender, amount);
        } else {
            msg.sender.transfer(amount);
        }
    }

    function() public payable {}

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
}
