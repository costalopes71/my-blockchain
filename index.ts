import * as crypto from "crypto";
import { X448KeyPairOptions } from "node:crypto";

class Transaction {

    constructor(
        public amount: number, 
        public payer: string, 
        public payee: string
    ) { }

    toString(): string {
        return JSON.stringify(this);
    }
    
}

class Block {
    
    public nonce: number = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string | null, 
        public transaction: Transaction, 
        public ts = Date.now()
    ) { }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash("SHA256");
        hash.update(str).end();
        return hash.digest("hex");
    }

}

class Chain {

    public static instance = new Chain();

    chain: Block[];

    private constructor() {
        const genesisBlock: Block = new Block(null, new Transaction(100, "genesis", "satoshi"));
        this.chain = [genesisBlock];
    }

    get lastBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer): void {
    
        const verifier = crypto.createVerify("SHA256");
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }

    }

    // Proof of work system
    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️  mining...')

        while(true) {

            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substr(0,4) === '0000'){
            console.log(`Solved: ${solution}`);
            return solution;
            }

            // if not enough computation power, use this
            // if (solution === 100000) {
            //     console.log(`Solved: ${solution}`);
            //     return solution;
            // }

      solution += 1;
    }
  }

}

class Wallet {

    public publicKey: string;
    public privateKey: string;

    constructor() {
        
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }

    sendMoney(amount: number, payeePublicKey: string): void {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign("SHA256");
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);

        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }

}

// Example usage

const costalopes71: Wallet = new Wallet();
const malu: Wallet = new Wallet();
const molina: Wallet = new Wallet();

costalopes71.sendMoney(50, malu.publicKey);
malu.sendMoney(23, molina.publicKey);
molina.sendMoney(5, costalopes71.publicKey);

console.log(Chain.instance);

