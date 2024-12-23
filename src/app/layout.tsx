"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { walletConfig } from "@/utils/walletConfig";
import { clusterApiUrl } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const network = clusterApiUrl('mainnet-beta'); // Use 'mainnet-beta' for mainnet or 'testnet' for testnet
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ];
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}  >
        <ConnectionProvider endpoint={network}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
