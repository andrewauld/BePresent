import { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage, logAttendance, getModules } from '../services/api';

const Attendance = () => {
    const [showCamera, setShowCamera] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState('');
    const [loadingModules, setLoadingModules] = useState(true);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const data = await getModules();
                setModules(data.modules);
                if (data.modules.length > 0) {
                    setSelectedModule(data.modules[0].code);
                }
            } catch (error) {
                console.error("Failed to fetch modules", error);
            } finally {
                setLoadingModules(false);
            }
        };
        fetchModules();
    }, []);

    const [classmates, setClassmates] = useState([
        { id: 1, name: "Sarah J.", avatar: "https://i.pravatar.cc/150?u=sarah", time: "09:55 AM" },
        { id: 2, name: "Mike T.", avatar: "https://i.pravatar.cc/150?u=mike", time: "09:58 AM" },
        { id: 3, name: "Emma W.", avatar: "https://i.pravatar.cc/150?u=emma", time: "10:01 AM" },
        { id: 4, name: "David L.", avatar: "https://i.pravatar.cc/150?u=david", time: "10:02 AM" },
        { id: 5, name: "James R.", avatar: "https://i.pravatar.cc/150?u=james", time: "10:04 AM" },
    ]);

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);

    // Stop camera when component unmounts or modal closes
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    };

    const handleCameraOpen = () => {
        setShowCamera(true);
        setError('');
        startCamera();
    };

    const handleCameraClose = () => {
        setShowCamera(false);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = async () => {
        if (!videoRef.current) return;

        setIsUploading(true);
        setError('');

        try {
            // Capture image from video stream
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            // Convert to blob/file
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            const file = new File([blob], "attendance_capture.jpg", { type: "image/jpeg" });

            // 1. Upload Image
            const uploadRes = await uploadImage(file);
            const imageId = uploadRes.uuid;

            // 2. Log Attendance
            if (!selectedModule) throw new Error("Please select a module");
            const response = await logAttendance(selectedModule, imageId);

            setIsCheckedIn(true);
            handleCameraClose();

            // Update classmates list with real data from backend
            // Add current user to list
            const newClassmates = [
                { id: 'me', name: "You", image_id: imageId, time: "Now" },
                ...(response.classmates || [])
            ];
            setClassmates(newClassmates);

        } catch (err) {
            console.error("Attendance error:", err);
            setError(err.response?.data?.message || "Failed to verified attendance. Try again.");
        } finally {
            setIsUploading(false);
        }
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

                        {loadingModules ? (
                            <p className="text-sm text-gray-500 mb-4">Loading modules...</p>
                        ) : (
                            <div className="mb-6 w-full max-w-xs mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Select Module</label>
                                <select
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="" disabled>Select a module</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.code}>
                                            {m.code}: {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <p className="text-gray-500 mb-8 text-sm">Lecture Hall B, 10:00 AM - 11:00 AM</p>

                        <p className="text-orange-600 font-medium text-sm mb-6 bg-orange-50 py-2 px-4 rounded-lg inline-block">
                            📍 Location verified
                        </p>

                        <button
                            onClick={handleCameraOpen}
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
                    <p className="text-green-600">You're present for {selectedModule}.</p>
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
                                        {student.image_id ? (
                                            <img src={`http://127.0.0.1:5000/api/v1/images/${student.image_id}`} alt={student.name} className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full border-2 border-white shadow-sm bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                                        )}
                                        {student.name === "You" && (
                                            <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <span className="text-xs mt-2 font-medium text-gray-600 truncate w-full text-center">{student.name}</span>
                                    <span className="text-[10px] text-gray-400">{student.time}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
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
                                    onClick={handleCameraClose}
                                    className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/70"
                                >
                                    <X size={24} />
                                </button>

                                {error && (
                                    <div className="absolute top-4 left-4 right-14 z-10 bg-red-500/80 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-md">
                                        {error}
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    onLoadedMetadata={() => videoRef.current.play()}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-orange-400/50 rounded-xl"></div>
                                </div>
                            </div>

                            <div className="p-6 text-center">
                                <h3 className="font-bold text-lg mb-2">Prove you're here</h3>
                                <p className="text-gray-400 text-sm mb-6">Take a selfie with the lecture hall in the background.</p>

                                <button
                                    onClick={handleCapture}
                                    disabled={isUploading}
                                    className={`w-16 h-16 rounded-full border-4 border-orange-500 p-1 mx-auto block transition-transform ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                >
                                    <div className={`w-full h-full bg-orange-500 rounded-full ${isUploading ? 'animate-pulse' : ''}`}></div>
                                </button>
                                {isUploading && <p className="text-xs text-orange-500 mt-2">Verifying...</p>}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Attendance;
