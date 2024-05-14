const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('FlashLoan', () => {
    let token, flashLoan, FlashLoanReceiver
    let deployer
    
    beforeEach(async () => {
        // Setup accounts
        const accounts = await ethers.getSigners()
        deployer = accounts[0]

        // Load accounts
        const Token = await ethers.getContractFactory('Token')
        const FlashLoan = await ethers.getContractFactory('FlashLoan')
        const FlashLoanReceiver = await ethers.getContractFactory('FlashLoanReceiver')
        
        // Name, Symbol, Amount
        // Deploy token
        token = await Token.deploy('Dapp University', 'DAPP', '1000000')
        console.log(token.address)
        // Deploy flash loan pool
        flashLoan = await FlashLoan.deploy(token.target)

        // Approve tokens
        let transaction = await token.connect(deployer).approve(flashLoan.target, "1000000")
        await transaction.wait()

        // Deposit tokens into the pool
        transaction = await flashLoan.connect(deployer).depositTokens("1000000")
        await transaction.wait()

        // Deploy flash loan receiver
        flashLoanReceiver = await FlashLoanReceiver.deploy(flashLoan.target)
    })

    describe('Deployment', () => {
        it('sends tokens to the flashpool loan contract', async () =>{
            expect(await token.balanceOf(flashLoan.target)).to.equal('1000000')
        })
    })

    describe('Borrowing Funds', () => {
        it('borrows funds from the pool', async () => {
            let amount = "100"
            let transaction = await flashLoanReceiver.connect(deployer).executeFlashLoan(amount)
            let resule = await transaction.wait()

            await expect(transaction).to.emit(flashLoanReceiver, 'LoanReceived')
                .withArgs(token.target, amount)
        })
    })
})