# Secure Aadhaar Admin Server
This repository contains code for the Secure Aadhar Admin Server. This server automates the process of creating the user's digital identity.

The server listens on port `4000`, then creates a Participant `User`, his assets, `AccessHistory` and `Aadhaar` and then creates an Identity and binds the participant to it and sends the user a mail with the generated Identity card. This card will be used for all the intercations with the blockchain.

## Running
* Install the required npm modules
```bash
npm install
```

* Start the server
```bash
npm start
```

## Prerequisites
You need the following software to run this application:
* NodeJS
* npm
