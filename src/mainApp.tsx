import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import WalletPage from './WalletPage';
import CipherWrapper from './canvasWrapper';
import MintPage from './MintingPage/Mint';
import ViewList from './ViewAndSendPage/viewList';
import ViewPage from './ViewAndSendPage/view'; // Import the TokenView component
import { ConsoleProvider, ConsoleDisplay, useConsole } from './console/ConsoleContext.tsx';

// Main content component that handles routing
const MainContent = () => {
    const location = useLocation();

    // Determine active menu item from URL path
    const getActiveMenuFromPath = () => {
        const path = location.pathname.split('/')[1];
        if (!path) return 'home';
        return path;
    };

    return (
        <Routes>
            <Route path="/" element={
                <div>
                    <h3>Welcome to Cipher Wallet</h3>
                    <p>Your secure, decentralized solution for managing digital assets.
                        Use the menu above to navigate through different sections of the application.</p>
                </div>
            } />
            <Route path="/mint" element={<MintPage />} />
            <Route path="/view" element={<ViewList />} />
            <Route path="/view/:tokenId" element={<ViewPage />} />
            <Route path="/market" element={<div>Market Page Coming Soon</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

// Menu component
const Menu = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine which menu item is active
    const getActiveMenu = () => {
        const path = location.pathname.split('/')[1];
        if (!path) return 'home';
        if (path === 'view' && location.pathname.split('/').length > 2) return 'view';
        return path;
    };

    const activeMenu = getActiveMenu();

    // Menu items
    const menuItems = [
        { id: 'home', label: 'HOME', path: '/' },
        { id: 'mint', label: 'MINT', path: '/mint' },
        { id: 'view', label: 'VIEW / SEND', path: '/view' },
        { id: 'market', label: 'NIGHTMARKET', path: '/market' }
    ];

    // Function to handle menu item selection
    const handleMenuSelect = (path) => {
        navigate(path);
    };

    return (
        <ul className="menu-list">
            {menuItems.map((item) => (
                <li
                    key={item.id}
                    className={activeMenu === item.id ? 'active' : ''}
                    onClick={() => handleMenuSelect(item.id)}
                >
                    {item.label}
                </li>
            ))}
        </ul>
    );
};

// Main application component with router
function MainApp() {
    return (
        <BrowserRouter>
            <div className="container">
                <div className="menue">
                    <Menu />
                </div>

                <div className="cipher">
                    Cipher V.01
                </div>

                <div className="content">
                    <MainContent />
                </div>

                <div className="sidebar">
                    <div className="wallet1">
                        <WalletPage />
                    </div>
                    <div className="console">
                        <ConsoleDisplay />
                    </div>
                </div>

                <div className="footer">
                    <h4>Footer</h4>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default MainApp;
