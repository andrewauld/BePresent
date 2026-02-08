import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const WeeklyLog = ({ history }) => {
    // history is expected to be an array of objects with date field
    // We need to generate the last 5 weekdays (M-F) or just last 5 days
    // For this prototype, let's show the last 5 weekdays relative to today.

    const getStatus = (dateStr) => {
        if (!history) return 'absent'; // default
        // Check if date exists in history
        // This is a simplified check. In real app, match dates properly.
        const date = new Date(dateStr);
        const dateString = date.toISOString().split('T')[0];

        const found = history.find(h => h.date.startsWith(dateString));
        if (found) return 'present';

        const today = new Date().toISOString().split('T')[0];
        if (dateString > today) return 'upcoming';

        return 'absent';
    };

    const days = [];
    const today = new Date();
    // Generate last 5 days including today
    for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
        const dayDate = d.getDate();
        const fullDate = d.toISOString(); // keep full date for status check

        days.push({
            day: dayName,
            status: getStatus(fullDate),
            date: dayDate
        });
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 h-full">
            <h2 className="text-md font-bold mb-3">Weekly Attendance Log</h2>
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
