import { Commitment, TransactionSignature, TransactionConfirmationStatus, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js"
const fs = require('fs')
const BN= require("bn.js")
import * as borsh from "@project-serum/borsh"



async function main() {
    const connection= new Connection(clusterApiUrl('devnet'));
    const tx= new Transaction()
    const {blockhash, lastValidBlockHeight}= await connection.getLatestBlockhash();
    // const recipient =  new PublicKey("bobHAMGU2uUtGLJe7amEeAGTvcQGFLDy5nMdDrGSPZL")

    const borshSchema = borsh.struct([
        borsh.str("Name"),
        borsh.i8("Age"),
        borsh.i8("Marks1"),
        borsh.i8("Marks2")
    ])

    const data= {
        Name: "adeeb",
        Age: 21,
        Marks1: 69,
        Marks2: 42,
    }

   const buffer = Buffer.alloc(1000)
   borshSchema.encode(data, buffer)
   const bytes_used= buffer.slice(0, borshSchema.getSpan(buffer))


   console.log("The data in binary is, ", bytes_used)
   console.log("The number of bytes used are", borshSchema.getSpan(buffer))

   //decoding
   const {Name, Age, Marks1, Marks2}= borshSchema.decode(bytes_used)
   console.log("decoded data, ", Name, Age, Marks1, Marks2)




    // txnTracker(connection, airdrop, lastValidBlockHeight, "finalized" )
    // console.log("executed, here is the sig", airdrop)
    function txnTracker(
        connection: Connection,
        signature: string,
        lastValidBlockHeight: number,
        commitment: Commitment
    ): Promise<void>{
        return new Promise((resolve, reject)=>{
            let done= false
            console.log("Processing Txn")

            const subId = connection.onSignature(
                signature,
                async(result)=>{
                    if(!done){
                        console.log("subId, onSignature", subId)

                        await connection.removeSignatureListener(subId)
                        done= true
                        clearInterval(interval)
                        if (result.err) return result.err
                        resolve();
                    }
                },
                commitment
            )
            const interval = setInterval(async()=>{
               try {
                const res= await connection.getSignatureStatuses([signature])
                const status= res.value[0]
                const blockHeight= await connection.getBlockHeight();

                 if(blockHeight > lastValidBlockHeight && !done){
                    console.log("subId, getSignatureStatuses", subId)
                    clearInterval(interval)
                    await connection.removeSignatureListener(subId)
                    done= true
                    reject( new Error('Blockhash expired'))
                }

                if(status?.confirmationStatus === commitment){
                    if(!done){
                        console.log("subId, getSignatureStatuses", subId)
                        done= true
                        clearInterval(interval)
                        await connection.removeSignatureListener(subId)
                        resolve();
                    }
                }

               } catch (error) {
                done= true
                console.log("An error has occured")
                await connection.removeSignatureListener(subId)
                reject(error)
               }
            }, 1000)

        })

    }



}
main()




// airdrop donest require sendTransaction and confirmTransaction is optinonal
    // const keypair = Keypair.generate()
    // const keypairArray= Array.from(keypair.secretKey)
    // fs.writeFileSync('./myKeypair.json', JSON.stringify(keypairArray))
    // console.log("Storing keypair of ", keypair.publicKey.toBase58())