'use client';
import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (containerRef.current.dataset.loaded) return;
        containerRef.current.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        script.onerror = () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; background: #141414; color: #fff; font-family: sans-serif; text-align: center; padding: 20px;">
                        <div>
                            <p style="font-size: 16px; margin-bottom: 10px;">Widget failed to load.</p>
                            <p style="font-size: 12px; color: #888;">Please check your internet connection or disable ad blockers.</p>
                        </div>
                    </div>
                `;
            }
        };

        containerRef.current.appendChild(script);
        containerRef.current.dataset.loaded = 'true';

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                delete containerRef.current.dataset.loaded;
            }
        }
    }, [scriptUrl, config, height])

    return containerRef;
}
export default useTradingViewWidget
