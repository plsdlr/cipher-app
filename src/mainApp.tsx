import React, { useState, useEffect } from 'react';
import WalletPage from './WalletPage.tsx'
import CipherWrapper from './canvasWrapper.tsx'

import MintPage from './Mint.tsx'

function MainApp() {
    const [activeMenu, setActiveMenu] = useState('home');

    // Menu items
    const menuItems = [
        { id: 'home', label: 'HOME' },
        { id: 'mint', label: 'MINT' },
        { id: 'view', label: 'VIEW' },
        { id: 'send', label: 'SEND' },
        { id: 'market', label: 'MARKET' }
    ];

    /// delete this later

    const testvalues = {
        "coordinates": [
            {
                "x": 86,
                "y": 191
            },
            {
                "x": 207,
                "y": 15
            },
            {
                "x": 157,
                "y": 52
            },
            {
                "x": 70,
                "y": 50
            },
            {
                "x": 230,
                "y": 106
            },
            {
                "x": 163,
                "y": 192
            },
            {
                "x": 197,
                "y": 16
            },
            {
                "x": 238,
                "y": 144
            },
            {
                "x": 243,
                "y": 35
            },
            {
                "x": 30,
                "y": 218
            },
            {
                "x": 139,
                "y": 167
            },
            {
                "x": 211,
                "y": 36
            },
            {
                "x": 67,
                "y": 93
            },
            {
                "x": 224,
                "y": 239
            },
            {
                "x": 147,
                "y": 41
            },
            {
                "x": 79,
                "y": 64
            },
            {
                "x": 212,
                "y": 57
            },
            {
                "x": 54,
                "y": 156
            },
            {
                "x": 141,
                "y": 53
            },
            {
                "x": 254,
                "y": 100
            }
        ],
        "speed": 1,
        "colorScheme": "red",
        "walkerTurmites": [
            "ff0000ff0801000000000200"
        ],
        "builderTurmites": [
            "ff0800ff0201ff0800000001",
            "ff0801000200000800ff0800",
            "ff0201000201ff0400000000"
        ],
        "chaosNumbers": [
            2,
            5,
            6
        ]
    }

    // Function to handle menu item selection
    const handleMenuSelect = (menuId) => {
        console.log(menuId)
        setActiveMenu(menuId);
    };
    const renderContent = () => {
        switch (activeMenu) {
            case 'home':
                return (
                    <>
                    //     <h3>Welcome to Cipher Wallet</h3>
                    //     <p>Your secure, decentralized solution for managing digital assets.
                    //         Use the menu above to navigate through different sections of the application.</p>

                    </>
                );
            case 'mint':
                return (
                    <>
                        <MintPage />
                    </>
                );
        }
    };


    return (
        <>
            <div className="container">
                <div className="menue">
                    <ul className="menu-list">
                        {menuItems.map((item) => (
                            <li
                                key={item.id}
                                className={activeMenu === item.id ? 'active' : ''}
                                onClick={() => handleMenuSelect(item.id)}
                                style={{
                                    display: 'inline-block',
                                    padding: '8px 15px',
                                    cursor: 'pointer',
                                    color: activeMenu === item.id ? '#ffffff' : '#000000'
                                }}
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="content">
                    {renderContent()}
                </div>
                <div className="footer">
                    <h4>Footer</h4>
                </div>

                <div className="wallet1">
                    <WalletPage />
                </div>
            </div >
        </>
    )
}

export default MainApp