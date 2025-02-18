import web3, { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getKeyPairFromPrivateKey, createTransaction, sendAndConfirmTransactionWrapper, bufferFromUInt64, bufferFromString } from '../utils.js';
import { COMPUTE_BUDGET_PROGRAM_ID, GLOBAL, MINT_AUTHORITY, MPL_TOKEN_METADATA, PUMP_FUN_ACCOUNT, PUMP_FUN_PROGRAM, RENT, SYSTEM_PROGRAM } from './constants.js';

async function uploadMetadata(
    tokenName,
    tokenTicker,
    description,
    imageUrl,
    options
) {
    // Create metadata object
    const formData = new URLSearchParams();
    formData.append('name', tokenName);
    formData.append("symbol", tokenTicker);
    formData.append("description", description);

    formData.append("showName", "true");

    if (options?.twitter) formData.append('twitter', options.twitter);
    if (options?.telegram) formData.append("telegram", options.telegram);
    if (options?.website) formData.append("website", options.website);

    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const files = {
        file: new File([imageBlob], "image.png", { type: "image/png" }),
    };

    // Create form data with both metadata and file
    const finalFormData = new FormData();
    // Add all metadata fields
    for (const [key, value] of formData.entries()) {
        finalFormData.append(key, value);
    }
    // Add file if exists
    if (files?.file) {
        finalFormData.append('file', files.file);
    }


    const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: finalFormData
    });

    if (!metadataResponse.ok) {
        throw new Error(`Metadata upload failed: ${metadataResponse.statusText}`);
    }

    return await metadataResponse.json();
}

async function launchToken(deployerPrivatekey, name, symbol, uri) {
    console.log(deployerPrivatekey, name, symbol, uri);
    const connection = new Connection(
        "https://mainnet.helius-rpc.com/?api-key=5335ab3f-9c1d-413b-ab8b-da4069b18971",
        'confirmed'
    );

    const payer = await getKeyPairFromPrivateKey(deployerPrivatekey);
    const owner = payer.publicKey;

    //Create new wallet to be used as mint
    const mint = Keypair.generate();
    const mintPK = mint.publicKey.toBase58();

    const [bondingCurve, bondingCurveBump] = await PublicKey.findProgramAddress(
        [Buffer.from("bonding-curve"), mint.publicKey.toBuffer()],
        PUMP_FUN_PROGRAM
    );

    const [associatedBondingCurve, associatedBondingCurveBump] = PublicKey.findProgramAddressSync(
        [
            bondingCurve.toBuffer(),
            new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
            mint.publicKey.toBuffer()
        ],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
    );

    const [metadata, metadataBump] = await PublicKey.findProgramAddress(
        [Buffer.from("metadata"), MPL_TOKEN_METADATA.toBuffer(), mint.publicKey.toBuffer()],
        MPL_TOKEN_METADATA
    );

    const txBuilder = new Transaction();

    // Adding the Compute Budget instruction
    const computeBudgetInstruction = new TransactionInstruction({
        keys: [],
        programId: COMPUTE_BUDGET_PROGRAM_ID,
        data: Buffer.concat([
            Buffer.from(Uint8Array.of(3)), // discriminator for SetComputeUnitPrice
            bufferFromUInt64(100000) // microLamports
        ])
    });

    txBuilder.add(computeBudgetInstruction);

    const keys = [
        { pubkey: mint.publicKey, isSigner: true, isWritable: true }, // Mint account
        { pubkey: MINT_AUTHORITY, isSigner: false, isWritable: false }, // Mint authority
        { pubkey: bondingCurve, isSigner: false, isWritable: true }, // Bonding curve PDA
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true }, // Associated bonding curve PDA
        { pubkey: GLOBAL, isSigner: false, isWritable: false }, // Global config
        { pubkey: MPL_TOKEN_METADATA, isSigner: false, isWritable: false }, // Metadata program ID
        { pubkey: metadata, isSigner: false, isWritable: true }, // Metadata PDA
        { pubkey: owner, isSigner: true, isWritable: true }, // Owner account
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false }, // System program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Token program
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // Associated token account program
        { pubkey: RENT, isSigner: false, isWritable: false }, // Rent sysvar
        { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false }, // Pump fun account
        { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false } // Pump fun program ID
    ];

    const nameBuffer = bufferFromString(name);
    const symbolBuffer = bufferFromString(symbol);
    const uriBuffer = bufferFromString(uri);

    const data = Buffer.concat([
        Buffer.from("181ec828051c0777", "hex"),
        nameBuffer,
        symbolBuffer,
        uriBuffer
    ]);

    const instruction = new TransactionInstruction({
        keys: keys,
        programId: PUMP_FUN_PROGRAM,
        data: data
    });

    txBuilder.add(instruction);
    const latestBlockhash = await connection.getLatestBlockhash();
    txBuilder.recentBlockhash = latestBlockhash.blockhash;

    const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey);
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
    console.log(`Tx confirmed with signature: ${signature}`)
    console.log(`PUMP FUN: https://pump.fun/coin/${mintPK}`)

    return { signature, mintPK };
}

export const POST = async (req, { params }) => {
    try {
        const body = await req.json();
        const { tokenName, tokenTicker, description, imageUrl, options, privatekey } = body;

        console.log("Request Body:", body);

        if (!privatekey || !tokenName || !tokenTicker || !description || !imageUrl) {
            console.log("Missing parameters");
            return new Response(
                JSON.stringify({ error: "Missing required parameters" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { metadataUri } = await uploadMetadata(tokenName, tokenTicker, description, imageUrl, options);
        console.log("Metadata URI:", metadataUri);

        const { signature, mintPK } = await launchToken(privatekey, tokenName, tokenTicker, metadataUri);

        return new Response(
            JSON.stringify({ signature, mintPK }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Backend Error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch memecoin" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};

