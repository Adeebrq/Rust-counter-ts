import { clusterApiUrl, Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Wallet, AnchorProvider, Program, BN  } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

const fs= require('fs')


const PROGRAM_ID= new PublicKey("2knEFwe5EPyX5qTK8fYSZohucw1cdDhg7HK6BEiNmzSV")
const connection= new Connection(clusterApiUrl('devnet'), 'confirmed')
const payer =  Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./myKeypair.json", "utf8"))))

const idl= JSON.parse(fs.readFileSync("./idl/idl.json"))
const wallet= new NodeWallet(payer)
const provider= new AnchorProvider(connection, wallet, {commitment: "confirmed"})
const program= new Program(idl, PROGRAM_ID, provider)

async function getOrCreateAccount(startValue: number): Promise<PublicKey> {

    try {
        console.log("Trying to load existing keypair")

        const counterAccountkey= Keypair.fromSecretKey((Uint8Array.from(JSON.parse(fs.readFileSync("./counterAccount.json", "utf8")))))
        const counterAccount= counterAccountkey.publicKey
        return counterAccount
    } catch (error) {
        console.log("Exisiting keypair not found, generating new key")

        const counterAccountkey= Keypair.generate();
        const counterAccount= counterAccountkey.publicKey


        const accountInfo= await connection.getAccountInfo(counterAccount)

        if (!accountInfo){
            await program.methods.initialize( new BN(startValue)).accounts({
                counter: counterAccount,
                user: payer.publicKey,
                system_program: SystemProgram.programId
            }).signers([payer, counterAccountkey]).rpc()
    
            fs.writeFileSync("./counterAccount.json", JSON.stringify(Array.from(counterAccountkey.secretKey)))
            console.log("Successfully created-", counterAccount.toBase58())
    

        }else {
            console.log("Counter account already exists:", counterAccount.toBase58());


        }


        return counterAccount;
    }    
}


async function incrementCounter(counterAccount: PublicKey) {
    await program.methods.increment().accounts({
        counter: counterAccount
    }).rpc()

    console.log("Incremented successfully")


    
}


async function getCount(counterAccount: PublicKey): Promise<number> {
    const data= await program.account.counter.fetch(counterAccount) as any 
    return data.value

    
}

async function main() {

    console.log("the payer is", payer.publicKey.toBase58())

    const counterAccount=  await getOrCreateAccount(0);

    await incrementCounter(counterAccount)
    const count= await getCount(counterAccount)

    console.log("the current count is- ", count)


    
}
main();
