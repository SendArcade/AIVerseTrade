"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

import dotenv from "dotenv";
dotenv.config();

interface TradePanelProps {
  address: string;
  symbol: string;
}

export default function TradePanel({ address, symbol }: TradePanelProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [sol, setSol] = useState(0.00); // Default SOL input
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState({ priceN: 0.00, marketCapN: 0.00 });
  const [stash, setStash] = useState("0.00"); // Initialize stash correctly

  const [solSell, setSolSell] = useState("0.00");
  const [stashSell, setStashSell] = useState(0.00); // Initialize stash correctly

  const { publicKey, connected, sendTransaction, signTransaction } = useWallet();

  const fetchPriceData = async () => {
    try {
      const response = await fetch(`/api/${address}/price_Mcap`);
      if (response.ok) {
        const data = await response.json();
        setPriceData(data);
      } else {
        const errorData = await response.json();
        alert("Failed to fetch price data.");
      }
    } catch (error) {
      alert("An unexpected error occurred while fetching price data.");
    }
  };

  useEffect(() => {
    fetchPriceData();
    const intervalId = setInterval(fetchPriceData, 30000); // Fetch every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [address]);

  useEffect(() => {
    setStash((sol / priceData.priceN).toFixed(2));
  }, [sol, priceData]);

  useEffect(() => {
    setSolSell((stashSell * priceData.priceN).toFixed(2));
  }, [stashSell, priceData]);

  const handleBuyTrade = async () => {
    try {
      setLoading(true);

      if (!connected || !publicKey) {
        alert("Please connect your wallet.");
        setLoading(false);
        return;
      }
      if (!signTransaction) {
        alert("Your wallet does not support signing transactions.");
        return;
      }

      const BuyerPublicKey = publicKey.toString();

      const body = {
        BuyerPublicKey,
        address, // Address from prop
        amount: sol,
      };

      const response = await fetch(`/api/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const base64Tx = await response.json();
        const transactionBuffer = Buffer.from(base64Tx.base64Tx, "base64");
        const transaction = Transaction.from(transactionBuffer);

        const signedTransaction = await signTransaction(transaction);

        // Initialize the connection
        const connection = new Connection(
          "https://mainnet.helius-rpc.com/?api-key=5335ab3f-9c1d-413b-ab8b-da4069b18971",
          "confirmed"
        );
        const txId = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log("Transaction Signature:", txId);
      } else {
        alert("Failed to fetch transaction instruction.");
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSellTrade = async () => {
    try {
      setLoading(true);

      if (!connected || !publicKey) {
        alert("Please connect your wallet.");
        setLoading(false);
        return;
      }
      if (!signTransaction) {
        alert("Your wallet does not support signing transactions.");
        return;
      }

      const sellerPublicKey = publicKey.toString();

      const body = {
        sellerPublicKey,
        address, // Address from prop
        amount: stashSell,
      };

      const response = await fetch(`/api/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const base64Tx = await response.json();
        const transactionBuffer = Buffer.from(base64Tx.base64Tx, "base64");
        const transaction = Transaction.from(transactionBuffer);

        const signedTransaction = await signTransaction(transaction);

        // Initialize the connection
        const connection = new Connection(
          "https://mainnet.helius-rpc.com/?api-key=5335ab3f-9c1d-413b-ab8b-da4069b18971",
          "confirmed"
        );
        const txId = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log("Transaction Signature:", txId);
      } else {
        alert("Failed to fetch transaction instruction.");
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenBalance = async () => {
    try {
      if (!publicKey || !address) return 0;

      // Initialize the connection
      const connection = new Connection(
        "https://mainnet.helius-rpc.com/?api-key=5335ab3f-9c1d-413b-ab8b-da4069b18971",
        "confirmed"
      );

      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(new PublicKey(address), publicKey);

      // Fetch the account details
      const accountInfo = await getAccount(connection, tokenAccountAddress);

      // Return the balance (divide by 10^decimals to convert to the readable amount)
      return Number(accountInfo.amount) / 10 ** 6;
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      return 0;
    }
  };

  const handlePercentageClick = async (percentage: number) => {
    try {
      setLoading(true); // Indicate loading when fetching the balance

      // Fetch the current token balance
      const tokenBalance = await fetchTokenBalance();

      // Calculate the percentage of the balance
      const calculatedValue = ((percentage / 100) * tokenBalance).toFixed(2);

      // Update the stashSell state with the calculated value
      setStashSell(parseFloat(calculatedValue));
    } catch (error) {
      console.error("Error calculating percentage:", error);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <div className="bg-black rounded-lg shadow-lg space-y-6 max-w-md mx-auto">
      {/* Buy/Sell Toggle Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setMode("buy")}
          className={`flex-1 py-2 rounded-md text-white font-semibold ${mode === "buy" ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
            }`}
        >
          Buy
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`flex-1 py-2 rounded-md text-white font-semibold ${mode === "sell" ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
            }`}
        >
          Sell
        </button>
      </div>

      {/* Input and Output */}
      <div>
        <label className="block text-gray-400">From {mode === "buy" ? "SOL" : symbol}:</label>
        <input
          type="number"
          value={mode === "buy" ? sol : stashSell}
          onChange={mode === "buy" ? (e) => setSol(parseFloat(e.target.value) || 0) : (e) => setStashSell(parseFloat(e.target.value) || 0)}
          className="w-full mt-1 p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          min="0.01"
        />
        {/* Buttons for setting predefined values */}
        <div className="flex flex-start mt-2 space-x-2">
          {mode === "buy"
            ? [0.001, 0.01, 0.1, 1].map((value) => (
              <button
                key={value}
                onClick={() => setSol(value)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
              >
                {value} Sol
              </button>
            ))
            : [25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() =>
                  handlePercentageClick(percentage)
                }
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
              >
                {percentage}%
              </button>
            ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-400">{mode === "buy" ? stash : solSell} {mode === "buy" ? symbol : "SOL"}</label>
      </div>

      {/* Action Button */}
      <button
        onClick={mode === "buy" ? handleBuyTrade : handleSellTrade}
        disabled={loading}
        className={`w-full py-3 rounded-md font-semibold ${mode === "buy"
          ? "bg-green-500 hover:bg-green-400 text-black"
          : "bg-red-500 hover:bg-red-400 text-white"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "Processing..." : mode === "buy" ? "Place Buy Order" : "Place Sell Order"}
      </button>
    </div>
  );
}
