import { useState } from 'react';
import Lobby from './components/Lobby';
import GameCanvas from './components/GameCanvas';
import { SocketProvider } from './services/socket';
import './App.css';

function App() {
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');

  return (
    <SocketProvider>
      <div className="app">
        {gameState === 'lobby' ? (
          <Lobby setGameState={setGameState} />
        ) : (
          <GameCanvas setGameState={setGameState} />
        )}
      </div>
    </SocketProvider>
  );
}

export default App;
