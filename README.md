# Report

The report and its accompanying appendix can be found [here](https://github.com/henryli17/web3-ticketing-poc/tree/main/report).

# Local Deployment

All instructions below assume that you are in the **root directory** of the project unless explicitly stated and that you are using a **Unix-like OS**.

### Prerequisites
- [Node.js](https://nodejs.org/en/)
- [Truffle Suite](https://trufflesuite.com/docs/truffle/how-to/install/)
- MetaMask (running on [Google Chrome](https://www.google.com/intl/en_uk/chrome/))
   - [Version 10.27.0](https://github.com/MetaMask/metamask-extension/releases/download/v10.27.0/metamask-chrome-10.27.0.zip) is recommended due to a [bug on 10.28.1](https://github.com/MetaMask/metamask-extension/issues/18453) preventing MetaMask from switching networks
   - To install, visit `chrome://extensions` and drag `metamask-chrome-10.27.0.zip` into the Chrome window

### Required Ports
Please ensure none of the following ports are being used by any other applications: 
- `3000`
- `3001`
- `8545`
- `8555`

### 1. Installing dependencies
```bash
cd frontend && npm install --legacy-peer-deps &&
cd ../backend && npm install &&
cd ../eth && npm install
```

### 2. Run migrations and seed database
```bash
cd backend && npm run migrate && npm run seed
```

### 3. Start backend server
- Leave this server running and execute the proceeding commands in new terminal instances.

```bash
cd backend && npm start
```

### 4. Deploy smart contract
- Deploy the contract using Truffle.

```bash
cd eth && truffle migrate
```

- Copy the contract address from the terminal output. In the output example below it would be `0x532438C5D16EE7AA809d0fC6CE14bcC7134d9d89`.

```
Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.


Starting migrations...
======================
> Network name:    'development'
> Network id:      1678314346176
> Block gas limit: 30000000 (0x1c9c380)


1_initial_migration.js
======================

   Deploying 'Events'
   ------------------
   > transaction hash:    0xab9dede3c71784a9a0f21979c66ffb11455792ff008146a8c56bfd43fcbb91e2
   > Blocks: 0            Seconds: 0
   > contract address:    0x532438C5D16EE7AA809d0fC6CE14bcC7134d9d89
   > block number:        199
   > block timestamp:     1678314377
   > account:             0x3b26935917De7f5faC60F6d15FF02b1CF468DFb0
   > balance:             999.846952861158712963
   > gas used:            4974608 (0x4be810)
   > gas price:           2.500000008 gwei
   > value sent:          0 ETH
   > total cost:          0.012436520039796864 ETH

   > Saving artifacts
   -------------------------------------
   > Total cost:     0.012436520039796864 ETH

Summary
=======
> Total deployments:   1
> Final cost:          0.012436520039796864 ETH
```

### 5. Create `.env` for the backend server
- Set a temporary environment variable for the contract address copied from the previous step.

```bash
TEMP=<your contract address>
```

For example: `export TEMP=0x532438C5D16EE7AA809d0fC6CE14bcC7134d9d89`

- Create the `.env` file.

```bash
cd backend && echo "ETH_CONTRACT_ADDRESS=$TEMP" > .env
```

### 6. Restart backend server
To load the new environment variables we need to restart the backend server.

- This can be achieved by typing `rs` followed by the `Return ↩` key in the terminal instance running the backend server.

### 7. Deploy database events to smart contract
```bash
cd backend && npm run deploy
```

### 8. Start the frontend
- This should automatically launch the web application in your browser. If not, you can manually navigate to http://localhost:3000/.

```bash
cd frontend && npm start
```

### 9. Importing test accounts into MetaMask
When running the web application locally, a locally run blockchain is used. This is automatically run from the backend server. There are 10 accounts preloaded with 1000 ETH that can be used for testing.

- Follow the instructions on the [MetaMask website](https://support.metamask.io/hc/en-us/articles/360015489331-How-to-import-an-account#h_01G01W07NV7Q94M7P1EBD5BYM4) to import accounts using any of the following private keys:

| Private Key                                                          |
| -------------------------------------------------------------------- |
| `0x4397dbd437030df7c8ed3cb213f34aeea9786debd4bbd62767021eb19ae7d345` |
| `0x59025abe73ea743b663276546cfdefe7e6ceab2618d3d851c0053228d21b3e89` |
| `0x98545d87cbdb20fb4198b407d45c19a6ae476e7b327ec2511b11df34d9e0e36d` |
| `0x97b543ccd0b333450872f010287211f54b7442c261a956181cc5d7599825bc0d` |
| `0xae8e040c53e069b017b7582db2e4ea368a07a90806488b1c7d0f0d3bf23b79df` |
| `0x39bc36a89c1b732127bca39030874f30222dfad8415f102af6feaf5b60d6a6af` |
| `0xf927e60ffbb8a1965362ee4a97ccdea87cf9bb3a703620e37cf61f13cfbfdcd7` |
| `0x206a85417e715f3b8e99b69c990ecc97db264cc36cb901e8beddb4aeb08d1b9e` |
| `0xefeb100ca1c3763ccf962d09f4fe863f4c6c80238987f87d57fe9dbd0c012bb4` |
| `0xdba880a5c0554e06487b38b0105702fe2b2d387dded8066a68b8885869e70ab2` |

- Connect your MetaMask wallet at http://localhost:3000/, this should automatically prompt you to switch to the `Localhost 8545` Ethereum network.

- Confirm the account you have just imported has been connected by viewing the status in the MetaMask extension. 

### Troubleshooting
- If you have deployed locally more than once, the nonce MetaMask uses for the local blockchain can become out of sync. This will cause transactions to hang indefinitely. This can be fixed by reinstalling the MetaMask extension.

# Testing
- Run smart contract unit tests.

```bash
cd eth && truffle run coverage
```
