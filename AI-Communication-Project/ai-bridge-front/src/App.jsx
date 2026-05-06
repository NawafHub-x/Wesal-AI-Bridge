import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DeafUser from './DeafUser';
import BlindUser from './BlindUser';
import RoleSelection from './RoleSelection';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/select-role" element={<RoleSelection />} />
        <Route path="/visual-mode" element={<DeafUser />} />
        <Route path="/audio-mode" element={<BlindUser />} />
        
        {/* Legacy routes for backwards compatibility */}
        <Route path="/deaf" element={<Navigate to="/visual-mode" replace />} />
        <Route path="/blind" element={<Navigate to="/audio-mode" replace />} />
        
        {/* Default route goes directly to communication role picker */}
        <Route path="/" element={<Navigate to="/select-role" replace />} />
      </Routes>
    </Router>
  );
}

export default App;