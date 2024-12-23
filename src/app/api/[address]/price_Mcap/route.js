import { Connection, PublicKey } from '@solana/web3.js';
import { BondingCurveAccount } from 'pumpdotfun-sdk';
import dotenv from 'dotenv';

dotenv.config();

const PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const DEFAULT_COMMITMENT = 'finalized';
const DECIMALS = 6;
const connection = new Connection(process.env.HELIUS_RPC_URL, DEFAULT_COMMITMENT);

async function getBondingCurveAccount(mint) {
    try {
        const bondingCurvePDA = PublicKey.findProgramAddressSync(
            [Buffer.from('bonding-curve'), mint.toBuffer()],
            new PublicKey(PROGRAM_ID)
        )[0];

        const accountInfo = await connection.getAccountInfo(bondingCurvePDA, DEFAULT_COMMITMENT);
        if (!accountInfo) {
            throw new Error('Bonding curve account not found');
        }

        return BondingCurveAccount.fromBuffer(accountInfo.data);
    } catch (error) {
        console.error('Error fetching bonding curve account:', error.message);
        throw error; // Re-throwing error to be caught by the calling function
    }
}

async function getPriceAndMarketCap(mintAddress) {
    try {
        const mint = new PublicKey(mintAddress);
        const bondingCurveAccount = await getBondingCurveAccount(mint);

        const totalSupplyRaw = bondingCurveAccount.tokenTotalSupply;
        const virtualSolReserves = bondingCurveAccount.virtualSolReserves;
        const virtualTokenReserves = bondingCurveAccount.virtualTokenReserves;

        const pricePerTokenInLamports = (virtualSolReserves * 10n ** BigInt(DECIMALS)) / virtualTokenReserves;
        const pricePerTokenInSOL = Number(pricePerTokenInLamports) / 10 ** 9;

        const marketCapInLamports = (totalSupplyRaw * pricePerTokenInLamports) / (10n ** BigInt(DECIMALS));
        const marketCapInSOL = Number(marketCapInLamports) / 10 ** 9;

        return {
            price: pricePerTokenInSOL.toFixed(9),
            marketCap: marketCapInSOL.toFixed(9)
        };
    } catch (error) {
        console.error(`Error fetching price and market cap for ${mintAddress}:`, error.message);
        return null;
    }
}

export const GET = async (req, { params }) => {
    try {
        const { address } = await params;
        const { price, marketCap } = await getPriceAndMarketCap(address);

        if (price === null || marketCap === null) {
            return new Response(
                JSON.stringify({ error: "Failed to fetch price or market cap" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        let priceN = parseFloat(price);
        let marketCapN = parseFloat(marketCap);

        return new Response(
            JSON.stringify({ priceN, marketCapN }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
