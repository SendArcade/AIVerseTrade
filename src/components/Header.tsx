import Link from "next/link";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from "@/utils/button.main";

export default function Header() {
  return (
    <header className="flex items-center justify-between py-4 px-6 bg-black shadow-md border-b border-gray-800">
      {/* Logo Section */}
      <Link href="http://aiverse.wtf/" className="text-white text-2xl font-bold hover:text-gray-400">
        AI Verse
      </Link>

      {/* Wallet Button */}
      {/* <UnifiedWalletButton
        overrideContent={
          <Button
            variant="special"
            className="bg-white text-black px-2 py-0.5 rounded-md font-semibold transition-all hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:outline-none"
          >
            Connect Wallet
          </Button>
        }
        currentUserClassName="border border-gray-600 rounded-sm h-9"
      /> */}
      <WalletMultiButton />

    </header>
  );
}
