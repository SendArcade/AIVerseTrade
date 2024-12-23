import { Data } from "@/utils/types";
import { FaTwitter, FaTelegram, FaExternalLinkAlt } from 'react-icons/fa';

export default function CoinInfo({ data }: { data: Data }) {
    return (
        <div className="text-gray-300 flex flex-col lg:flex-row items-center lg:items-start lg:space-x-8 space-y-6 lg:space-y-0 h-auto pb-0">
            {/* Left Side: Info */}
            <div className="lg:w-2/3 w-full space-y-2 flex-grow overflow-y-auto">
                <p className="text-sm">
                    <strong className="font-semibold text-white">Token Name:</strong>
                    <span className="text-green-400"> {data.name.slice(0, 15)}</span>
                </p>
                <p className="text-sm">
                    <strong className="font-semibold text-white">Ticker:</strong>
                    <span className="text-green-400"> {data.symbol.slice(0, 15)}</span>
                </p>
                <p className="text-sm">
                    <strong className="font-semibold text-white">Description:</strong>
                    <span className="text-gray-400 block mt-1"> {data.description.slice(0, 62)}</span>
                </p>
                <div className="mt-3 flex gap-3 overflow-hidden">
                    {data.website && (
                        <a
                            href={data.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-900 text-grey px-2 py-1 text-[10px] rounded-md hover:bg-gray-800 transition-all flex items-center gap-1"
                        >
                            <FaExternalLinkAlt className="text-gray-400 text-[10px]" /> Website
                        </a>
                    )}
                    {data.twitter && (
                        <a
                            href={data.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-900 text-grey px-2 py-1 text-[10px] rounded-md hover:bg-gray-800 transition-all flex items-center gap-1"
                        >
                            <FaTwitter className="text-gray-400 text-[10px]" />Twitter
                        </a>
                    )}
                    {data.telegram && (
                        <a
                            href={data.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-900 text-grey px-2 py-1 text-[10px] rounded-md hover:bg-gray-800 transition-all flex items-center gap-1"
                        >
                            <FaTelegram className="text-gray-400 text-[10px]" /> Telegram
                        </a>
                    )}
                </div>
            </div>

            {/* Right Side: Image */}
            <div className="lg:w-1/3 w-full flex justify-center lg:justify-end items-center mt-6 lg:mt-0">
                <img
                    src={data.image}
                    alt={`${data.name} logo`}
                    className="rounded-lg shadow-lg w-24 h-24 sm:w-36 sm:h-36 object-contain"
                />
            </div>
        </div>
    );
}
