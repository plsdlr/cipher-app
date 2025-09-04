import React, { useEffect, useState, useRef } from 'react';

interface CipherWrapperProps {
    coordinates?: { x: number, y: number }[];
    speed?: number;
    walkerTurmites?: string[];
    builderTurmites?: string[];
    chaosNumbers?: number[];
}

const CipherWrapperIframe: React.FC<CipherWrapperProps> = ({
    coordinates,
    speed = 1,
    walkerTurmites = [],
    builderTurmites = [],
    chaosNumbers = []
}) => {
    // Add a key state that changes whenever props change significantly
    const [iframeKey, setIframeKey] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fullscreenButtonRef = useRef<HTMLButtonElement>(null);

    // Update the key when props change significantly, causing a reload
    useEffect(() => {
        setIframeKey(prevKey => prevKey + 1);
    }, [
        JSON.stringify(coordinates),
        JSON.stringify(walkerTurmites),
        JSON.stringify(builderTurmites),
        JSON.stringify(chaosNumbers)
    ]); // Reload on major configuration changes

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
                        chaosNumbers
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
        iframeKey
    ]);

    // Fullscreen toggle handler
    const toggleFullscreen = () => {
        console.log("Toggle fullscreen called");
        if (!document.fullscreenElement) {
            if (wrapperRef.current?.requestFullscreen) {
                console.log("Requesting fullscreen");
                wrapperRef.current.requestFullscreen()
                    .then(() => {
                        console.log("Fullscreen enabled");
                        setIsFullscreen(true);
                        // Increment the key to force iframe reload when entering fullscreen
                        setIframeKey(prevKey => prevKey + 1);
                    })
                    .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
            } else {
                console.log("Fullscreen API not available");
            }
        } else {
            if (document.exitFullscreen) {
                console.log("Exiting fullscreen");
                document.exitFullscreen()
                    .then(() => {
                        console.log("Fullscreen exited");
                        setIsFullscreen(false);
                        // Increment the key to force iframe reload when exiting fullscreen
                        setIframeKey(prevKey => prevKey + 1);
                    })
                    .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
            }
        }
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            console.log("Fullscreen change event triggered");
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'SVG_READY') {
                console.log('SVG export received from iframe');

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

                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                }, 100);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Add this function to trigger SVG export
    const exportSVG = () => {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'EXPORT_SVG'
            }, '*');
        }
    };


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
                key={`iframe-${iframeKey}-${isFullscreen ? 'full' : 'normal'}`}
                src="/src/indexTurmite_deterministic.html"
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

            <button
                ref={fullscreenButtonRef}
                onClick={toggleFullscreen}
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontFamily: '"Reactor7", system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                }}
            >
                {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
            </button>

            <button
                onClick={exportSVG}
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '120px',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontFamily: '"Reactor7", system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                }}
            >
                EXPORT SVG
            </button>
        </div>
    );
};

export default CipherWrapperIframe;
