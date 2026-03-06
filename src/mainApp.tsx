import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import WalletPage from './WalletPage';
import MintPage from './MintingPage/Mint';
import ViewList from './ViewAndSendPage/viewList';
import ViewPage from './ViewAndSendPage/view';
import { ConsoleDisplay } from './console/ConsoleContext.tsx';
import EditTokenPage from './ReCipher/recipher.tsx';
import MarketPage from './Nightmarket/MarketPage';
import { Home, Specs } from './components';

// Main content component that handles routing
const MainContent = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mint" element={<MintPage />} />
            <Route path="/view" element={<ViewList />} />
            <Route path="/view/:tokenId" element={<ViewPage />} />
            <Route path="/recipher/:tokenId" element={<EditTokenPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/specs" element={<Specs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};


// 

// Header elements - hidden on home page
const CipherTitle = () => {
    const location = useLocation();
    if (location.pathname === '/') return null;

    return (
        <div className="cipher">
            Cipher V0.1
        </div>
    );
};

const Logo = () => {

    return (
        <div className="logo">
            <img src="/laughingManNoAnimation.svg" alt="Laughing Man" className="laughing-man-logo" />
        </div>
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
        { id: 'market', label: 'NIGHTMARKET', path: '/market' },
        { id: 'specs', label: 'SPECS', path: '/specs' }
    ];

    // Function to handle menu item selection
    const handleMenuSelect = (path: string) => {
        navigate(path);
    };

    return (
        <ul className="menu-list">
            {menuItems.map((item) => (
                <li
                    key={item.id}
                    className={activeMenu === item.id ? 'active' : ''}
                    onClick={() => handleMenuSelect(item.path)}
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

                <CipherTitle />

                <Logo />

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
                    <fieldset className="terminal-fieldset">

                        <p>Cipher is supported by <a href='https://www.justopensource.io/'>JUST Open Source</a>.
                            Cipher is an artwork by <a href='https://plsdlr.net/'>Paul Seidler</a>. All original code © GNU Affero General Public License. Third-party libraries and dependencies retain their original licenses.
                        </p>
                    </fieldset>
                </div>
            </div>
        </BrowserRouter >
    );
}

export default MainApp;
