import React, { useState } from 'react';
import './App.css';
import MinimalControlPanel from './components/MinimalControlPanel';
import EnhancedDashboard from './components/EnhancedDashboard';

function App() {
  const [view, setView] = useState('enhanced'); // Start with enhanced view

  return (
    <div className="App">
      <div className="fixed top-2 right-2 z-50">
        <button 
          onClick={() => setView(view === 'enhanced' ? 'minimal' : 'enhanced')}
          className="bg-gray-900 text-white px-2 py-1 text-xs border border-gray-500 hover:bg-gray-700"
        >
          [{view === 'enhanced' ? 'MINIMAL' : 'ENHANCED'}]
        </button>
      </div>
      
      {view === 'enhanced' ? <EnhancedDashboard /> : <MinimalControlPanel />}
    </div>
  );
}

export default App;