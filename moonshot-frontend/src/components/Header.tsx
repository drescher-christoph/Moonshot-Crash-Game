import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";

export default function Header() {
  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <Image
            src="/images/logo-text.png"
            alt="Coinflip Logo"
            width={150}
            height={100}
            priority
          />
          {/* <h2 className="font-bold text-3xl">Moonshot</h2> */}
          <a
            href="https://github.com/drescher-christoph/Coinflip-Dapp" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <FaGithub size={22} />
            <span className="hidden sm:inline text-sm font-medium">GitHub</span>
          </a>
        </div>

        {/* Right Section */}
        <div>
          <ConnectButton showBalance={false} accountStatus="address" />
        </div>
      </div>
    </header>
  );
}