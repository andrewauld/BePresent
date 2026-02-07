import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const WeeklyLog = () => {
    const days = [
        { day: 'M', status: 'present', date: '12' },
        { day: 'T', status: 'present', date: '13' },
        { day: 'W', status: 'absent', date: '14' },
        { day: 'T', status: 'present', date: '15' },
        { day: 'F', status: 'upcoming', date: '16' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 h-full">
            <h2 className="text-md font-bold mb-3">Streak</h2>
            <div className="grid grid-cols-5 gap-1">
                {days.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <span className="text-[10px] text-gray-400 font-medium">{item.day}</span>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${item.status === 'present'
                                ? 'bg-orange-50 border-orange-100 text-orange-500'
                                : item.status === 'absent'
                                    ? 'bg-red-50 border-red-100 text-red-500'
                                    : 'bg-gray-50 border-dashed border-gray-200 text-gray-300'
                            }`}>
                            {item.status === 'present' && <Check size={12} strokeWidth={3} />}
                            {item.status === 'absent' && <X size={12} strokeWidth={3} />}
                            {item.status === 'upcoming' && <span className="text-[10px] font-bold">{item.date}</span>}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default WeeklyLog;
