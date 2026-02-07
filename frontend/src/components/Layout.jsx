import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, CheckCircle, Settings } from 'lucide-react';

const Layout = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <main className={`pb-24 ${isLoginPage ? 'pb-0' : ''}`}>
                <Outlet />
            </main>

            {!isLoginPage && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    <nav className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-full px-6 py-3 flex items-center justify-between gap-8 pointer-events-auto transition-all hover:scale-[1.02] duration-300">
                        <Link to="/" className={`flex flex-col items-center p-2 rounded-full transition-all duration-300 ${location.pathname === '/' ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}>
                            <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
                        </Link>

                        <Link to="/attendance" className={`flex flex-col items-center p-3 -mt-6 rounded-full transition-all duration-300 shadow-lg border-2 border-white ${location.pathname === '/attendance' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-110' : 'bg-white text-gray-400 hover:text-gray-600'}`}>
                            <CheckCircle size={28} strokeWidth={location.pathname === '/attendance' ? 2.5 : 2} />
                        </Link>

                        <Link to="/settings" className={`flex flex-col items-center p-2 rounded-full transition-all duration-300 ${location.pathname === '/settings' ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}>
                            <Settings size={22} strokeWidth={location.pathname === '/settings' ? 2.5 : 2} />
                        </Link>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default Layout;
