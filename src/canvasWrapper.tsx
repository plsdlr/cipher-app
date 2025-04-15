import React, { useEffect, useState, useRef } from 'react';

interface CipherWrapperProps {
    coordinates?: { x: number, y: number }[];
    speed?: number;
    colorScheme?: string;
    walkerTurmites?: string[];
    builderTurmites?: string[];
    chaosNumbers?: number[];
}

const CipherWrapperIframe: React.FC<CipherWrapperProps> = ({
    coordinates,
    speed = 1,
    colorScheme = "red",
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
        JSON.stringify(builderTurmites)
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
                        colorScheme,
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
        colorScheme,
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

    return (
        <div
            ref={wrapperRef}
            className={`cipher-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
            style={{
                width: '100%',
                aspectRatio: '1/1',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 0 1px #ff0000',
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
                src="./src/indexTurmite.html"
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
                    color: '#ff0000',
                    border: '1px solid #ff0000',
                    borderRadius: '4px',
                    padding: '8px 15px',
                    cursor: 'pointer',
                    fontFamily: '"Reactor7", system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    outline: 'none',
                }}
            >
                {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
            </button>
        </div>
    );
};

export default CipherWrapperIframe;

// import React, { useEffect, useState, useRef } from 'react';

// interface CipherWrapperProps {
//     coordinates?: { x: number, y: number }[];
//     speed?: number;
//     colorScheme?: string;
//     walkerTurmites?: string[];
//     builderTurmites?: string[];
//     chaosNumbers?: number[];
// }

// const CipherWrapperIframe: React.FC<CipherWrapperProps> = ({
//     coordinates,
//     speed = 1,
//     colorScheme = "red",
//     walkerTurmites = [],
//     builderTurmites = [],
//     chaosNumbers = []
// }) => {
//     // Add a key state that changes whenever props change significantly
//     const [iframeKey, setIframeKey] = useState(0);
//     const iframeRef = useRef<HTMLIFrameElement>(null);

//     // Update the key when props change significantly, causing a reload
//     useEffect(() => {
//         setIframeKey(prevKey => prevKey + 1);
//     }, [
//         JSON.stringify(coordinates),
//         JSON.stringify(walkerTurmites),
//         JSON.stringify(builderTurmites)
//     ]); // Reload on major configuration changes

//     // Send data to the iframe after it loads
//     useEffect(() => {
//         const iframe = iframeRef.current;
//         if (!iframe) return;

//         const handleLoad = () => {
//             // Ensure we have access to the contentWindow before posting
//             if (iframe.contentWindow) {
//                 iframe.contentWindow.postMessage({
//                     type: 'UPDATE_ANIMATION',
//                     data: {
//                         coordinates,
//                         speed,
//                         colorScheme,
//                         walkerTurmites,
//                         builderTurmites,
//                         chaosNumbers
//                     }
//                 }, '*');
//             }
//         };

//         iframe.addEventListener('load', handleLoad);
//         return () => iframe.removeEventListener('load', handleLoad);
//     }, [
//         coordinates,
//         speed,
//         colorScheme,
//         walkerTurmites,
//         builderTurmites,
//         chaosNumbers,
//         iframeKey
//     ]);

//     return (
//         <div className="cipher-wrapper"
//             style={{
//                 width: '100%',
//                 aspectRatio: '1/1',
//                 position: 'relative',
//                 overflow: 'hidden',
//                 // Add a box shadow to create a consistent border around all sides
//                 boxShadow: 'inset 0 0 0 1px #ff0000'
//             }}>
//             <iframe
//                 ref={iframeRef}
//                 key={iframeKey}
//                 src="./src/indexTurmite.html"
//                 title="Cipher Animation"
//                 style={{
//                     width: '100%',
//                     height: '100%',
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     background: 'black',
//                     border: 'none' // Remove default iframe border
//                 }}
//                 scrolling="no"
//                 frameBorder="0"
//             />
//         </div>
//     );
// };

// export default CipherWrapperIframe;

