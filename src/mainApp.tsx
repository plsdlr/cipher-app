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


    // Function to handle menu item selection
    const handleMenuSelect = (menuId) => {
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

                <div className="console">
                    <h4> here will be the console</h4>
                </div>
            </div >
        </>
    )
}

export default MainApp