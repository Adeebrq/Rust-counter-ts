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














































// import { Connection, PublicKey, Keypair, clusterApiUrl, SystemProgram } from "@solana/web3.js";
// import {Program, BN, AnchorProvider} from "@project-serum/anchor"
// import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
// const fs= require("fs")


// const PROGRAM_ID= new PublicKey("2knEFwe5EPyX5qTK8fYSZohucw1cdDhg7HK6BEiNmzSV")
// const connection= new Connection(clusterApiUrl("devnet"), "confirmed")
// const payer= Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./myKeypair.json"))))



// const wallet= new NodeWallet(payer);
// const provider= new AnchorProvider(connection, wallet, {commitment: 'confirmed'})



// const idl= JSON.parse(fs.readFileSync("./idl/idl.json", "utf8"));
// const program= new Program(idl, PROGRAM_ID, provider)

// async function getOrCreateAccount(startValue: number = 0): Promise<PublicKey> {

//     try {
//         const counterAccount= Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./counterAccount.json", "utf8")))) 
//         console.log("Found existing counter account,", counterAccount.publicKey.toBase58())
//         return counterAccount.publicKey

//     } catch (error) {
//         const counterAccountkey= Keypair.generate();
//         const counterAccount= counterAccountkey.publicKey

//         const accountInfo = await connection.getAccountInfo(counterAccount);
//         if (!accountInfo) {
//             console.log("Existing counter account not found, creating one...");
//             await program.methods
//                 .initialize(new BN(startValue))
//                 .accounts({
//                     counter: counterAccount,
//                     user: payer.publicKey,
//                     systemProgram: SystemProgram.programId,
//                 })
//                 .signers([payer,counterAccountkey])
//                 .rpc();
//             console.log("Counter account created successfully:", counterAccount.toBase58());

//             fs.writeFileSync("./counterAccount.json", JSON.stringify(Array.from((counterAccountkey.secretKey))))
//             console.log("Account created & stored")
//         } else {
//             console.log("Counter account already exists:", counterAccount.toBase58());
//         }
    
//         return counterAccount;
//     }


// }

// async function incrementCounter(counterAccount: PublicKey) {

//     await program.methods.increment().accounts({
//         counter: counterAccount
//     }).rpc()
//     console.log("Count has been incremented")
    
// }

// async function getCount(counterAccount: PublicKey): Promise<number> {
//     const data = await program.account.counter.fetch(counterAccount) as any
//     return data.value    
// }

// async function main(){

//     console.log("Payer:", payer.publicKey.toBase58());

//     // Create or fetch the counter account
//     const counterAccount = await getOrCreateAccount(0); // Start with value 0

//     // Increment the counter
//     await incrementCounter(counterAccount);

//     // Fetch and display the counter value
//     const count = await getCount(counterAccount);
//     console.log("Current counter value:", count);

// }
// main();
