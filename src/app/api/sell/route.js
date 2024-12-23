import { PumpFunSDK } from "pumpdotfun-sdk";
import { AnchorProvider } from '@coral-xyz/anchor';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.HELIUS_RPC_URL;
const connection = new Connection(RPC_URL, "confirmed");

const getProvider = () => {
    if (!process.env.HELIUS_RPC_URL) {
        throw new Error("Please set HELIUS_RPC_URL in .env file");
    }
    const RPC_URL = process.env.HELIUS_RPC_URL;
    const connection = new Connection(RPC_URL, "confirmed");
    return new AnchorProvider(connection, {}, { commitment: "finalized" });
};

async function sellToken(sellerPublicKey, tokenAddress, tokenAmount) {

    const SellerPublic = new PublicKey(sellerPublicKey);
    const mint = new PublicKey(tokenAddress);
    const SLIPPAGE_BASIS_POINTS = BigInt('2000');
    const SELL_AMOUNT_TOKEN = parseFloat(tokenAmount);

    const provider = getProvider();
    const sdk = new PumpFunSDK(provider);
    const transactionInstruction = await sdk.getSellInstructionsByTokenAmount(
        SellerPublic,
        mint,
        BigInt(SELL_AMOUNT_TOKEN*10**6),
        SLIPPAGE_BASIS_POINTS
    );

    return transactionInstruction;
}

export const POST = async (req, { params }) => {
    try {
        const body = await req.json();
        const { sellerPublicKey, address, amount } = body;

        console.log("Request Body:", body);

        if (!sellerPublicKey || !address || !amount) {
            return new Response(
                JSON.stringify({ error: "Missing required parameters" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        console.log("BuyerPublicKey:", sellerPublicKey, "Address:", address, "Amount:", amount);

        const pub = new PublicKey(sellerPublicKey);

        const transactionInstruction = await sellToken(sellerPublicKey, address, amount);
        let { blockhash } = await connection.getLatestBlockhash();
        transactionInstruction.recentBlockhash = blockhash;
        transactionInstruction.feePayer = pub;

        console.log("Transaction Instruction:", transactionInstruction);

        // const serializedTx = transactionInstruction.serializeMessage();
        const serializedTx = transactionInstruction.serialize({ verifySignatures: false });
        const base64Tx = serializedTx.toString('base64');
        console.log("Serialized Transaction (Base64):", base64Tx);

        return new Response(
            JSON.stringify({ base64Tx }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch memecoin" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};