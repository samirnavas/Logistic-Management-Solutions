export default function SettingsPage() {
    return (
        <div className="max-w-4xl">
            <h2 className="text-xl font-semibold text-zinc-800 mb-6">Settings & Roles</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {/* Profile Section */}
                <div className="p-6">
                    <h3 className="text-lg font-medium text-zinc-900 mb-4">Profile Settings</h3>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center text-2xl font-bold text-sky-700">
                            A
                        </div>
                        <div>
                            <button className="text-sm font-medium text-sky-700 hover:underline">Change Avatar</button>
                            <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF</p>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" defaultValue="Admin User" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-700/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input type="email" defaultValue="admin@bnb.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-700/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-700/20">
                                <option>Super Admin</option>
                                <option>Manager</option>
                                <option>Viewer</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="px-6 py-2 bg-sky-700 text-white rounded-lg text-sm font-medium hover:bg-sky-800 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
