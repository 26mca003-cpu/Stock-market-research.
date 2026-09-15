"use client";

import React, { useEffect, useRef, useState } from "react";
import { api, ChartData } from "@/lib/api";
import { BarChart3, Layers } from "lucide-react";

interface StockChartProps {
  ticker: string;
}

export default function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"6m" | "1y" | "5y">("1y");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [chartHeight, setChartHeight] = useState(380);

  // Responsive chart height per breakpoint
  useEffect(() => {
    const computeHeight = () => {
      const w = window.innerWidth;
      if (w < 480) return 260;
      if (w < 768) return 320;
      return 380;
    };
    const applyHeight = () => setChartHeight(computeHeight());
    applyHeight();
    window.addEventListener("resize", applyHeight);
    return () => window.removeEventListener("resize", applyHeight);
  }, []);

  // Fetch chart data on period change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getChart(ticker, period)
      .then((data) => {
        if (isMounted) {
          setChartData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching chart data:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ticker, period]);

  // Render TradingView Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.candles.length === 0) return;

    let chart: any = null;

    import("lightweight-charts").then(({ createChart, ColorType }) => {
      if (!chartContainerRef.current) return;
      chartContainerRef.current.innerHTML = "";

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#64748B",
          fontFamily: "var(--font-sans), 'Inter', sans-serif"
        },
        grid: {
          vertLines: { color: "#F1F5F9" },
          horzLines: { color: "#F1F5F9" }
        },
        crosshair: {
          mode: 1
        },
        rightPriceScale: {
          borderColor: "#E2E8F0"
        },
        timeScale: {
          borderColor: "#E2E8F0",
          timeVisible: true,
          secondsVisible: false
        },
        width: chartContainerRef.current.clientWidth,
        height: chartHeight
      });

      // 1. Candlestick Series (emerald #10B981 up, red #EF4444 down per TRD §9)
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
        borderVisible: false,
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444"
      });
      candleSeries.setData(chartData.candles);

      // 2. Volume Histogram Overlay
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "", // Overlay on separate sub-scale
        scaleMargins: {
          top: 0.8,
          bottom: 0
        }
      });
      volumeSeries.setData(chartData.volumes);

      // 3. Optional MA50 and MA200 Lines
      if (showMA && chartData.candles.length > 20) {
        const ma50Line = chart.addLineSeries({
          color: "#3B82F6", // Blue for MA50
          lineWidth: 1.5,
          title: "MA50"
        });

        const ma50Data: { time: string; value: number }[] = [];
        let window50: number[] = [];
        for (const c of chartData.candles) {
          window50.push(c.close);
          if (window50.length > 50) window50.shift();
          if (window50.length >= 10) {
            const avg = window50.reduce((a, b) => a + b, 0) / window50.length;
            ma50Data.push({ time: c.time, value: roundTwo(avg) });
          }
        }
        ma50Line.setData(ma50Data);
      }

      chart.timeScale().fitContent();

      // Window resize handling
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chart) chart.remove();
      };
    });

    return () => {
      if (chart) chart.remove();
    };
  }, [chartData, showMA, chartHeight]);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-border shadow-card">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent shrink-0" />
          <h3 className="font-serif font-bold text-base sm:text-lg text-primary">Price Action & Volume</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* MA Overlay Toggle */}
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showMA ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-border text-primary-muted"
            }`}
          >
            MA 50
          </button>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(["6m", "1y", "5y"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPeriod(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                  period === t ? "bg-white text-primary shadow-sm" : "text-primary-muted hover:text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        className="relative w-full min-h-[260px] sm:min-h-[320px] md:min-h-[380px]"
        style={{ minHeight: chartHeight }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Mandatory Attribution Footer (TRD §0 & §9) */}
      <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-primary-muted">
        <span>Daily OHLCV Candlesticks &amp; Volume</span>
        <span>Charts by TradingView Lightweight Charts™</span>
      </div>
    </div>
  );
}

function roundTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
