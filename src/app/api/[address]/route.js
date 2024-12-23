import { Connection, PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.HELIUS_RPC_URL;

if (!RPC_URL) throw new Error("HELIUS_RPC_URL is not defined in environment variables.");

const connection = new Connection(RPC_URL, "confirmed");
const umi = createUmi(RPC_URL).use(mplTokenMetadata());

async function getMetadata(address) {

    const mint = new PublicKey(address);
    const asset = await fetchDigitalAsset(umi, mint);

    if (!asset.metadata.uri) {
        return res.status(404).json({ error: "Metadata URI not found." });
    }

    const metadataResponse = await fetch(asset.metadata.uri);

    if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata. Status: ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json();
    return metadata;

}

export const GET = async (req, { params }) => {
    try {
        const {address} = await params;
        const metadata = await getMetadata(address);

        console.log(metadata);

        return new Response(
            JSON.stringify(metadata),
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
