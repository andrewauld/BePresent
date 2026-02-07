import { useState } from 'react';
import { Camera, X, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Attendance = () => {
    const [showCamera, setShowCamera] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const [classmates, setClassmates] = useState([
        { id: 1, name: "Sarah J.", avatar: "https://i.pravatar.cc/150?u=sarah", time: "09:55 AM" },
        { id: 2, name: "Mike T.", avatar: "https://i.pravatar.cc/150?u=mike", time: "09:58 AM" },
        { id: 3, name: "Emma W.", avatar: "https://i.pravatar.cc/150?u=emma", time: "10:01 AM" },
        { id: 4, name: "David L.", avatar: "https://i.pravatar.cc/150?u=david", time: "10:02 AM" },
        { id: 5, name: "James R.", avatar: "https://i.pravatar.cc/150?u=james", time: "10:04 AM" },
    ]);

    const handleCapture = () => {
        // Simulate capture delay
        setTimeout(() => {
            setIsCheckedIn(true);
            setShowCamera(false);
            // Add current user to list
            setClassmates(prev => [
                { id: 99, name: "You", avatar: "https://i.pravatar.cc/150?u=andrew", time: "Now" },
                ...prev
            ]);
        }, 800);
    };

    return (
        <div className="p-6 pb-20 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto min-h-screen flex flex-col">
            <h1 className="text-2xl font-bold mb-6">Attendance Log</h1>

            {!isCheckedIn ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-white p-8 rounded-3xl shadow-lg w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>

                        <div className="bg-orange-50 p-6 rounded-full inline-flex items-center justify-center mb-6 ring-4 ring-orange-100">
                            <Camera size={40} className="text-orange-600" />
                        </div>

                        <h2 className="text-xl font-bold mb-2">CS204: Algorithms</h2>
                        <p className="text-gray-500 mb-8 text-sm">Lecture Hall B, 10:00 AM - 11:00 AM</p>

                        <p className="text-orange-600 font-medium text-sm mb-6 bg-orange-50 py-2 px-4 rounded-lg inline-block">
                            📍 Location verified
                        </p>

                        <button
                            onClick={() => setShowCamera(true)}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Camera size={20} />
                            Check In Now
                        </button>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center mb-8"
                >
                    <div className="bg-green-100 text-green-600 p-3 rounded-full inline-block mb-3">
                        <Check size={32} strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-bold text-green-800">Checked In!</h2>
                    <p className="text-green-600">You're present for CS204.</p>
                </motion.div>
            )}

            {/* Classmates Grid - Only visible after check-in */}
            {isCheckedIn && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                >
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <Users size={18} className="text-gray-400" />
                        Classmates Here ({classmates.length})
                    </h3>

                    <div className="grid grid-cols-4 gap-4">
                        <AnimatePresence>
                            {classmates.map((student, index) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="relative">
                                        <img src={student.avatar} alt={student.name} className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
                                        {student.name === "You" && (
                                            <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <span className="text-xs mt-2 font-medium text-gray-600 truncate w-full text-center">{student.name}</span>
                                    <span className="text-[10px] text-gray-400">{student.time}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                                <span className="text-xs font-bold">+12</span>
                            </div>
                            <span className="text-xs mt-2 text-gray-400">Others</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Camera Modal */}
            <AnimatePresence>
                {showCamera && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
                        >
                            <div className="relative bg-gray-900 h-96 flex items-center justify-center">
                                <button
                                    onClick={() => setShowCamera(false)}
                                    className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full backdrop-blur-md"
                                >
                                    <X size={24} />
                                </button>

                                <p className="text-white/50">Camera Preview</p>
                                <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-orange-400/50 rounded-xl"></div>
                                </div>
                            </div>

                            <div className="p-6 text-center">
                                <h3 className="font-bold text-lg mb-2">Prove you're here</h3>
                                <p className="text-gray-400 text-sm mb-6">Take a selfie with the lecture hall in the background.</p>

                                <button
                                    onClick={handleCapture}
                                    className="w-16 h-16 rounded-full border-4 border-orange-500 p-1 mx-auto block hover:scale-105 transition-transform"
                                >
                                    <div className="w-full h-full bg-orange-500 rounded-full"></div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Attendance;
