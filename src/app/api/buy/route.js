import { PumpFunSDK } from "pumpdotfun-sdk";
import { AnchorProvider } from '@coral-xyz/anchor';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

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

async function buyToken(BuyerPublicKey, tokenAddress, amount) {

    const BuyerPublic = new PublicKey(BuyerPublicKey);
    const mint = new PublicKey(tokenAddress);
    const SLIPPAGE_BASIS_POINTS = BigInt('2000');
    const BUY_AMOUNT_SOL = amount;

    const provider = getProvider();
    const sdk = new PumpFunSDK(provider);
    const transactionInstruction = await sdk.getBuyInstructionsBySolAmount(
        BuyerPublic,
        mint,
        BigInt(BUY_AMOUNT_SOL * LAMPORTS_PER_SOL),
        SLIPPAGE_BASIS_POINTS
    );

    return transactionInstruction;
}

async function checkIfTokenIsOnRaydium(mintAddress) {
    try {
        const raydiumApiUrl = `https://api-v3.raydium.io/mint/ids?mints=${mintAddress}`;
        const response = await fetch(raydiumApiUrl);
        const result = await response.json();

        if (result.success && result.data && Array.isArray(result.data) && result.data[0] !== null) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking token on Raydium:', error.message);
        return false;
    }
}

async function getSwapFee() {
    const url = "https://api-v3.raydium.io/main/auto-fee";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch swap fee: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.data?.default?.h) {
            const swapFee = data.data.default.h.toString();
            console.log("Swap Fee (h):", swapFee);
            return swapFee;
        } else {
            throw new Error("Swap fee not found in the response.");
        }
    } catch (error) {
        console.error("Error fetching swap fee:", error);
    }
}

// Fetch swap quote
async function getSwapQuote(inputMint, outputMint, amountIn, slippageBps, txVersion) {
    const url = `https://transaction-v1.raydium.io/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountIn}&slippageBps=${slippageBps}&txVersion=${txVersion}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch swap quote: ${await response.text()}`);
    }

    return await response.json();
}

// Fetch swap transactions
async function getSwapTransaction(swapResponse, computeUnitPriceMicroLamports, BuyerPublicKey, unwrapSol, wrapSol, txVersion) {

    const body = {
        computeUnitPriceMicroLamports,
        swapResponse,
        txVersion,
        wallet: BuyerPublicKey,
        unwrapSol: unwrapSol,
        wrapSol: wrapSol
    };

    const response = await fetch("https://transaction-v1.raydium.io/transaction/swap-base-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch swap transactions: ${await response.text()}`);
    }

    return await response.json();
}

export const POST = async (req, { params }) => {
    try {
        const body = await req.json();
        const { BuyerPublicKey, address, amount } = body;

        console.log("Request Body:", body);

        if (!BuyerPublicKey || !address || !amount) {
            console.log("Missing parameters:", { BuyerPublicKey, address, amount });
            return new Response(
                JSON.stringify({ error: "Missing required parameters" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        console.log("BuyerPublicKey:", BuyerPublicKey, "Address:", address, "Amount:", amount);

        const pub = new PublicKey(BuyerPublicKey);

        const checkRaydium = await checkIfTokenIsOnRaydium(address);
        if (checkRaydium) {

            const inputMint = "So11111111111111111111111111111111111111112";
            const outputMint = address;
            const amountIn = amount * LAMPORTS_PER_SOL;
            const slippageBps = 200;
            const txVersion = "V0";
            const isInputSol = inputMint === "So11111111111111111111111111111111111111112";
            const isOutputSol = outputMint === "So11111111111111111111111111111111111111112";
            const unwrapSol = !isInputSol;
            const wrapSol = !isOutputSol;

            const swapResponse = await getSwapQuote(inputMint, outputMint, amountIn, slippageBps, txVersion); // Step 1: Get quote
            console.log("Swap Quote:", swapResponse);

            const computeUnitPriceMicroLamports = await getSwapFee() ?? "5000";
            const swapTransactions = await getSwapTransaction(swapResponse, computeUnitPriceMicroLamports, BuyerPublicKey, unwrapSol, wrapSol, txVersion); // Step 2: Get transaction
            const base64Tx = swapTransactions.data[0].transaction;
            console.log("Serialized Transaction (Base64):", base64Tx);

            return new Response(
                JSON.stringify({ base64Tx }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }
        else {
            const transactionInstruction = await buyToken(BuyerPublicKey, address, amount);
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
        }
    } catch (error) {
        console.error("Backend Error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch memecoin" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};

