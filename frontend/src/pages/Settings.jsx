import { User, Bell, Info, ChevronRight } from 'lucide-react';

const Settings = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><User size={20} /></div>
                        <span className="font-medium">Profile</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Bell size={20} /></div>
                        <span className="font-medium">Notifications</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Info size={20} /></div>
                        <span className="font-medium">About BePresent</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                </div>
            </div>
        </div>
    );
};

export default Settings;
