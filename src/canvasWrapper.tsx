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

    return (
        <div className="cipher-wrapper"
            style={{
                width: '100%',
                aspectRatio: '1/1',
                position: 'relative',
                overflow: 'hidden',
                // Add a box shadow to create a consistent border around all sides
                boxShadow: 'inset 0 0 0 1px #ff0000'
            }}>
            <iframe
                ref={iframeRef}
                key={iframeKey}
                src="./src/indexTurmite.html"
                title="Cipher Animation"
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'black',
                    border: 'none' // Remove default iframe border
                }}
                scrolling="no"
                frameBorder="0"
            />
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
//             iframe.contentWindow?.postMessage({
//                 type: 'UPDATE_ANIMATION',
//                 data: {
//                     coordinates,
//                     speed,
//                     colorScheme,
//                     walkerTurmites,
//                     builderTurmites,
//                     chaosNumbers
//                 }
//             }, '*'); // '*' allows any origin, consider restricting in production
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
//     ]); // Include all props and iframeKey

//     return (
//         <div className="cipher-wrapper">
//             <iframe
//                 ref={iframeRef}
//                 key={iframeKey}
//                 src="./src/indexTurmite.html"
//                 title="Cipher Animation"
//                 style={{
//                     border: '1px solid #ff0000',
//                     width: '100%',
//                     aspectRatio: '1/1',
//                     maxHeight: '100%',
//                     background: 'black'
//                 }}
//             />
//         </div>
//     );
// };

// export default CipherWrapperIframe;