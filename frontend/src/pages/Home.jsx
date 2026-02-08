import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Zap, Users, Plus } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import WeeklyLog from '../components/WeeklyLog';
import { jwtDecode } from "jwt-decode";
import { getLeaderboard, getAttendanceHistory, joinModule } from '../services/api';

const Home = () => {
    const [user, setUser] = useState(null);
    const [leaders, setLeaders] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [moduleCode, setModuleCode] = useState('');
    const [joinMessage, setJoinMessage] = useState('');

    useEffect(() => {
        // Decode token to get user info
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({ username: decoded.username });
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }

        const fetchData = async () => {
            try {
                const [leadersData, historyData] = await Promise.all([
                    getLeaderboard(),
                    getAttendanceHistory()
                ]);

                // Map leaderboard data to match component expectation
                // Backend returns { leaderboard: [...] }
                // Component expects [{ id, name, points, rank, avatar }]
                const mappedLeaders = leadersData.leaderboard.map((l, i) => ({
                    id: i,
                    name: l.username,
                    points: l.attendance_count * 10, // dummy points calculation
                    rank: i + 1,
                    avatar: `https://i.pravatar.cc/150?u=${l.username}`
                }));

                setLeaders(mappedLeaders.slice(0, 3));
                setHistory(historyData.history);
            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleJoinModule = async (e) => {
        e.preventDefault();
        try {
            await joinModule(moduleCode);
            setJoinMessage('Successfully joined module!');
            setModuleCode('');
            // could refresh data here
        } catch (error) {
            setJoinMessage(error.response?.data?.message || 'Failed to join module');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    return (
        <div className="p-6 pb-24 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Hello, {user?.username || 'Student'}! 👋</h1>
                    <p className="text-gray-400 text-sm">Let's keep up the streak.</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${user?.username || 'user'}`} alt="Profile" />
                </div>
            </div>

            {/* Stats Section: Leaderboard + Weekly Log Side by Side */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Leaderboard leaders={leaders} />
                <WeeklyLog history={history} />
            </div>

            {/* Join Module Section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                <h3 className="font-bold mb-3 text-sm">Join a Module</h3>
                <form onSubmit={handleJoinModule} className="flex gap-2">
                    <input
                        type="text"
                        value={moduleCode}
                        onChange={(e) => setModuleCode(e.target.value)}
                        placeholder="Enter code (e.g. CS204)"
                        className="flex-1 bg-gray-50 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </form>
                {joinMessage && <p className="text-xs mt-2 text-orange-600">{joinMessage}</p>}
            </div>

            {/* Predictive Message */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-lg mb-6 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Attendance Forecast</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">High Turnout Expected</h3>
                    <p className="text-sm opacity-90 mb-3">85% of students are predicted to attend today despite the rain.</p>
                    <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1 rounded-full w-fit">
                        <CloudRain size={12} />
                        <span>Rainy, 12°C</span>
                    </div>
                </div>

                {/* Decorative background circles */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            </motion.div>

            {/* Motivational Message */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6"
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Stay Consistent!</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            "Success is the sum of small efforts, repeated day in and day out."
                        </p>
                        <p className="text-xs text-orange-600 font-bold mt-2 uppercase tracking-wide">
                            - Robert Collier
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Home;
