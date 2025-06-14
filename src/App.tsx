import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import Kambaz from "./Kambaz";
import Landing from "./Landing";
import store, { persistor } from "./Kambaz/store"; 
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { useAuthInit } from "./Kambaz/Account/useAuthInit"; 

function AppContent() {
  useAuthInit(); // Initialize authentication state
  
  return (
    <HashRouter>
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="Landing"/>}/>
          <Route path="/Kambaz/*" element={<Kambaz />} />
          <Route path="/Landing" element={<Landing />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default function App() {
 return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}> 
        <AppContent />
      </PersistGate>
    </Provider>
  );
}