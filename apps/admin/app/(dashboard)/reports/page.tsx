export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-zinc-800">Reports</h2>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-medium text-zinc-900">No Reports Generated</h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                    There are no reports generated yet. Once you have enough data, you can generate comprehensive reports here.
                </p>
                <button className="mt-6 px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-medium hover:bg-sky-800 transition-colors">
                    Generate New Report
                </button>
            </div>
        </div>
    );
}
