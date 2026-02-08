import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const Leaderboard = ({ leaders }) => {
    // Fallback if no leaders provided yet
    if (!leaders) leaders = [];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-md font-bold flex items-center gap-1.5">
                    <Trophy className="text-orange-500" size={18} />
                    Top 3
                </h2>
                <span className="text-[10px] font-medium text-gray-400">Week</span>
            </div>

            <div className="space-y-3">
                {leaders.map((leader, index) => (
                    <motion.div
                        key={leader.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <img src={leader.avatar} alt={leader.name} className="w-8 h-8 rounded-full border-2 border-gray-100" />
                                <div className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-bold text-white ${index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-300'
                                    }`}>
                                    {leader.rank}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-xs truncate max-w-[60px]">{leader.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block font-bold text-orange-600 text-xs">{leader.points}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
