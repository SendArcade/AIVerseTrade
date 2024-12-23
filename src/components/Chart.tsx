"use client";

import React, { useRef, useEffect, useState } from "react";
import { createChart, UTCTimestamp, CandlestickData } from "lightweight-charts";
import styles from "./Chart.module.css";
import { FaExternalLinkAlt } from 'react-icons/fa';

interface ChartProps {
  tokenAddress: string;
  symbol: string;
  marketCap: string;
}

const trimAddress = (address: string) => {
  return `${address.slice(0, 2)}...${address.slice(-2)}`;
};

const Chart: React.FC<ChartProps> = ({ tokenAddress, symbol, marketCap }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const [priceData, setPriceData] = useState({ priceN: 0.0, marketCapN: 0.0 });

  const fetchOHLCVData = async () => {
    try {
      const response = await fetch(`/api/${tokenAddress}/ohlcv`);
      if (response.ok) {
        const dataRes = await response.json();
        const candlestickData: CandlestickData[] = dataRes.candleStickData.map((item: any) => ({
          time: item.timestamp as UTCTimestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));

        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.setData(candlestickData);
        }
      } else {
        console.error("Failed to fetch OHLCV data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching OHLCV data:", error);
    }
  };

  const fetchPriceData = async () => {
    try {
      const response = await fetch(`/api/${tokenAddress}/price_Mcap`);
      if (response.ok) {
        const data = await response.json();
        setPriceData(data);
      } else {
        console.error("Failed to fetch price data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching price data:", error);
    }
  };

  useEffect(() => {
    fetchPriceData();
    const priceIntervalId = setInterval(fetchPriceData, 30000);

    return () => clearInterval(priceIntervalId);
  }, [tokenAddress]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chartHeight = window.innerWidth <= 768 ? 300 : 500;

    const chartContainer = chartContainerRef.current;
    const chart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: chartHeight,
      layout: {
        background: { color: "#1e1e1e" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#444", style: 0, visible: true },
        horzLines: { color: "#444", style: 0, visible: true },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          return date.getMinutes() % 1 === 0 ? date.getMinutes().toString().padStart(1, "0") : "";
        },
        minBarSpacing: 0.1,
        borderColor: "#444",
        visible: true,
        barSpacing: 10,
      },
      localization: {
        timeFormatter: (timestamp: UTCTimestamp) => {
          const date = new Date(timestamp * 1000);
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          const seconds = date.getSeconds().toString().padStart(2, "0");
          return `${hours}:${minutes}:${seconds}`;
        },
        priceFormatter: (price: number) => price.toFixed(9),
      },
      rightPriceScale: {
        borderColor: "#444",
        scaleMargins: {
          top: 0.001,  // Adjusts the upper margin
          bottom: 0,  // Adjusts the lower margin
        },
        autoScale: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceFormat: {
        type: "price",
        precision: 9,
        minMove: 0.00000001,
      },
    });

    chartInstanceRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    chart.timeScale().fitContent();

    const handleResize = () => {
      const width = chartContainer.clientWidth;
      const height = window.innerWidth < 768 ? 300 : 500;
      chart.resize(width, height);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    fetchOHLCVData();
    const ohlcvIntervalId = setInterval(fetchOHLCVData, 10000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(ohlcvIntervalId);
      chart.remove();
    };
  }, [tokenAddress]);

  return (
    <div className="w-full space-y-4">
      {/* Token Info Section */}
      <div className="flex flex-wrap items-center justify-between text-white p-2 gap-2 sm:flex-nowrap">
        <div className="flex space-x-2">
          <span className="text-xs sm:text-sm font-normal">
            <strong>Symbol:</strong> ${symbol}
          </span>
          <span className="text-xs sm:text-sm">
            <strong>MCap:</strong> {priceData.marketCapN} SOL
          </span>
        </div>

        {/* View On Pump.fun aligned to the right with an icon */}
        <a
          href={`https://pump.fun/coin/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm flex items-center space-x-1"
        >
          <span className="text-grey-900">
            View On Pump.fun:
          </span>
          <FaExternalLinkAlt className="text-grey-900 text-xs" />
        </a>
      </div>

      {/* Chart Container */}
      <div
        className={`w-full rounded-xl ${styles.chartContainer} bg-gray-900 shadow-xl`}
        ref={chartContainerRef}
      ></div>
    </div>
  );

};

export default Chart;
