"use client";

import * as React from "react";
import { useEffect, useState, use } from "react";
import Header from "@/components/Header";
import Chart from "@/components/Chart";
import TradePanel from "@/components/TradePanel";
import CoinInfo from "@/components/CoinInfo";
import { Data, TokenPageProps } from "@/utils/types";

export default function TokenPage({ params }: TokenPageProps) {
    const [data, setData] = useState<Data | null>(null);
    const [onRaydium, setonRaydium] = useState<boolean>(false);
    const unwrappedParams = use(params); // Unwrap the `params` Promise.
    const address = unwrappedParams.address;

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const response = await fetch(`/api/${address}`, {
                    method: "GET",
                });
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        const checkIfTokenIsOnRaydium = async (address: string) => {
            try {
                const raydiumApiUrl = `https://api-v3.raydium.io/mint/ids?mints=${address}`;
                const response = await fetch(raydiumApiUrl);
                const result = await response.json();
    
                if (result.success && result.data && Array.isArray(result.data) && result.data[0] !== null) {
                    setonRaydium(true);
                    return;
                }
                setonRaydium(false);
                return;
            } catch (error) {
                setonRaydium(false);
                console.error('Error checking token on Raydium');
                return;
            }
        }

        checkIfTokenIsOnRaydium(address);
        fetchAddress();
    }, [address]);

    if (!data) {
        return (
            <div className="min-h-screen bg-black text-white flex justify-center items-center">
                <div className="loader"></div>
            </div>
        );
    }


    const symbol = data.symbol as string;
    console.log("raydium "  + onRaydium);

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Header />

            <main className="max-w-[90rem] mx-auto px-2 md:px-4 lg:px-6 py-8 space-y-8">
                {/* Top Section: Chart and Trade Panel */}
                <section className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
                    {/* Chart Section */}
                    <div className="flex-1 bg-black rounded-lg p-6 shadow-lg h-full">
                        <Chart tokenAddress={address} symbol={symbol} marketCap="" onRaydium={onRaydium}/>
                    </div>

                    {/* Trade and Coin Info Section */}
                    <div className="flex flex-col gap-6 lg:gap-8 w-full lg:w-[35%] h-full py-14 lg:mt-16">
                        {/* Trade Panel */}
                        <div className="w-full bg-black rounded-lg px-6 shadow-lg flex-1 pt-6">
                            <TradePanel address={address} symbol={symbol} onRaydium={onRaydium}/>
                        </div>
                        <span className="text-xs sm:text-sm truncate w-full bg-black rounded-lg px-6 py-0 shadow-lg flex-1">
                            <strong>CA:</strong>{" "}
                            <a
                                href={`https://solscan.io/account/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:underline"
                            >
                                {address}
                            </a>
                        </span>
                        {/* Coin Info Section */}
                        <div className="w-full bg-black rounded-lg px-6 shadow-lg flex-1">
                            <CoinInfo data={data} />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
