import { motion } from 'framer-motion';
import { CloudRain, Zap, Users } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import WeeklyLog from '../components/WeeklyLog';

const Home = () => {
    return (
        <div className="p-6 pb-24 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Hello, Andrew! 👋</h1>
                    <p className="text-gray-400 text-sm">Let's keep up the streak.</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=andrew" alt="Profile" />
                </div>
            </div>

            {/* Stats Section: Leaderboard + Weekly Log Side by Side */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Leaderboard />
                <WeeklyLog />
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
