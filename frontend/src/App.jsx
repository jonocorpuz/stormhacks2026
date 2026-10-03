function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Layout */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Add
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
            Edit
          </button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
          {/* User profile photo icon placeholder */}
          <span className="text-gray-500 font-bold">U</span>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1">
      </main>
    </div>
  );
}

export default App;
