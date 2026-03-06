import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';

export interface CipherWrapperHandle {
    exportSVG: () => void;
    toggleFullscreen: () => void;
}

interface CipherWrapperProps {
    coordinates?: { x: number, y: number }[];
    speed?: number;
    walkerTurmites?: string[];
    builderTurmites?: string[];
    chaosNumbers?: number[];  // [pusherSlowness, cleanerSlowness, rectangleCount]
    color?: number;           // Color index (0-15)
}

const CipherWrapperIframe = forwardRef<CipherWrapperHandle, CipherWrapperProps>(({
    coordinates,
    speed = 1,
    walkerTurmites = [],
    builderTurmites = [],
    chaosNumbers = [],
    color = 0,
}, ref) => {
    // Add a key state that changes whenever props change significantly
    const [iframeKey, setIframeKey] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update the key when props change significantly, causing a reload
    useEffect(() => {
        setIframeKey(prevKey => prevKey + 1);
    }, [
        JSON.stringify(coordinates),
        JSON.stringify(walkerTurmites),
        JSON.stringify(builderTurmites),
        JSON.stringify(chaosNumbers),
        color
    ]); // Reload on major configuration changes

    // Cleanup iframe when key changes or component unmounts
    useEffect(() => {
        const iframe = iframeRef.current;

        return () => {
            // Force cleanup of iframe content
            if (iframe && iframe.contentWindow) {
                try {
                    iframe.contentWindow.postMessage({ type: 'CLEANUP' }, '*');
                } catch (e) {
                    // Ignore errors if iframe is already being removed
                }
            }

            // Use a small delay before clearing src to allow cleanup to process
            setTimeout(() => {
                if (iframe && iframe.src !== 'about:blank') {
                    iframe.src = 'about:blank';
                }
            }, 50);
        };
    }, [iframeKey]); // Run cleanup when key changes

    // Send data to the iframe after it loads
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            // Ensure we have access to the contentWindow before posting
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'UPDATE_ANIMATION',
                    data: {
                        coordinates,
                        speed,
                        walkerTurmites,
                        builderTurmites,
                        chaosNumbers,  // [pusherSlowness, cleanerSlowness, rectangleCount]
                        color          // Color index (0-15)
                    }
                }, '*');
            }
        };

        iframe.addEventListener('load', handleLoad);
        return () => iframe.removeEventListener('load', handleLoad);
    }, [
        coordinates,
        speed,
        walkerTurmites,
        builderTurmites,
        chaosNumbers,
        color,
        iframeKey
    ]);

    // Fullscreen toggle handler
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current?.requestFullscreen()
                .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
        } else {
            document.exitFullscreen()
                .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
        }
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'SVG_READY') {
                // Create download
                const svgString = event.data.svgData;
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);

                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = 'cipher-turmite.svg';
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);

                downloadLink.click();

                // Clear any existing timeout
                if (cleanupTimeoutRef.current) {
                    clearTimeout(cleanupTimeoutRef.current);
                }

                cleanupTimeoutRef.current = setTimeout(() => {
                    if (document.body.contains(downloadLink)) {
                        document.body.removeChild(downloadLink);
                    }
                    URL.revokeObjectURL(url);
                    cleanupTimeoutRef.current = null;
                }, 100);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
                cleanupTimeoutRef.current = null;
            }
        };
    }, []);

    // Add this function to trigger SVG export
    const exportSVG = () => {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'EXPORT_SVG' }, '*');
        }
    };

    useImperativeHandle(ref, () => ({ exportSVG, toggleFullscreen }));


    return (
        <div
            ref={wrapperRef}
            className={`cipher-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
            style={{
                width: '100%',
                aspectRatio: '1/1',
                position: 'relative',
                overflow: 'hidden',
                background: '#000000',
                ...(isFullscreen && {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100vw',
                    height: '100vh',
                })
            }}
        >
            <iframe
                ref={iframeRef}
                key={`iframe-${iframeKey}`}
                src="/indexTurmite_deterministic_authoritative.html"
                title="Cipher Animation"
                style={{
                    width: isFullscreen ? '100%' : '100%',
                    height: isFullscreen ? '100%' : '100%',
                    aspectRatio: '1/1',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'black',
                    border: 'none',
                    pointerEvents: 'none', // This prevents iframe from capturing clicks
                    objectFit: 'contain'
                }}
                scrolling="no"
                frameBorder="0"
            />

        </div>
    );
});

export default CipherWrapperIframe;
