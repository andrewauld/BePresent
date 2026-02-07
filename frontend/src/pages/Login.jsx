import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // In a real app, we would validate credentials here.
        // For prototype, just redirect to home.
        navigate('/');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
            <div className="w-full max-w-sm flex flex-col items-center">
                <img src={logo} alt="BePresent Logo" className="w-24 h-24 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">BePresent</h1>
                <p className="text-gray-500 mb-8 text-center">Your attendance, simplified.</p>

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">University Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="student@university.edu"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-lg transition-all shadow-md active:scale-95 mt-4"
                    >
                        Log In
                    </button>
                </form>

                <p className="mt-8 text-sm text-gray-400">
                    Be present, be rewarded.
                </p>
            </div>
        </div>
    );
};

export default Login;
