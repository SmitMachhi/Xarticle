import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Activity } from 'lucide-react';
import { COLORS } from '../../types/curriculum';

const SERVER_STATES = ['stopped', 'starting', 'listening', 'processing'] as const;
type ServerState = typeof SERVER_STATES[number];

export function ServerLifecycle() {
  const [state, setState] = useState<ServerState>('stopped');
  const [connectionCount, setConnectionCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startServer = () => {
    if (isRunning) return;
    setIsRunning(true);
    setState('starting');
    
    setTimeout(() => {
      setState('listening');
      simulateConnections();
    }, 1500);
  };

  const stopServer = () => {
    setIsRunning(false);
    setState('stopped');
    setConnectionCount(0);
  };

  const simulateConnections = () => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      if (!isRunning) {
        clearInterval(interval);
        return;
      }
      
      setState('processing');
      setConnectionCount(prev => prev + 1);
      
      setTimeout(() => {
        setState('listening');
      }, 800);
    }, 2000);
  };

  const getStateColor = () => {
    switch (state) {
      case 'stopped':
        return '#6b7280';
      case 'starting':
        return COLORS.warning;
      case 'listening':
        return COLORS.success;
      case 'processing':
        return COLORS.info;
      default:
        return '#6b7280';
    }
  };

  const getStateDescription = () => {
    switch (state) {
      case 'stopped':
        return 'Server is not running. No requests can be handled.';
      case 'starting':
        return 'Server is initializing, loading configuration...';
      case 'listening':
        return `Server is running on port 8787, waiting for requests...`;
      case 'processing':
        return 'Server is handling an incoming request!';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Server Lifecycle</h3>
          <p className="text-gray-600 text-sm">{getStateDescription()}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startServer}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors shadow-sm"
          >
            <Play size={18} />
            Start Server
          </button>
          
          <button
            onClick={stopServer}
            disabled={!isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 hover:bg-red-700 transition-colors shadow-sm"
          >
            <Square size={18} />
            Stop
          </button>
        </div>
      </div>

      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
        {/* Server Box */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: state === 'processing' ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="w-48 h-32 rounded-xl border-4 flex flex-col items-center justify-center relative"
            style={{
              borderColor: getStateColor(),
              backgroundColor: `${getStateColor()}20`,
            }}
          >
            <Activity size={40} color={getStateColor()} />
            <span className="mt-2 text-gray-900 font-semibold capitalize">{state}</span>
            
            {state !== 'stopped' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-200 px-3 py-1 rounded-full">
                <span className="text-xs text-gray-700">Port 8787</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Connection Arrows */}
        <AnimatePresence>
          {state === 'processing' && (
            <>
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: -100, opacity: 1 }}
                exit={{ x: 0, opacity: 0 }}
                className="absolute left-0 top-1/2 -translate-y-1/2"
              >
                <div className="flex items-center gap-2"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">Client</span>
                  </div>
                  <motion.div
                    animate={{ x: [0, 20, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-blue-600 text-2xl"
                  >
                    →
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-10 top-1/2 -translate-y-1/2"
              >
                <motion.div
                  animate={{ x: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: 0.3 }}
                  className="text-green-600 text-2xl"
                >
                  ← Response
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Status Indicators */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <div className="flex gap-2">
            {SERVER_STATES.map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  s === state ? 'scale-125' : 'opacity-50'
                }`}
                style={{
                  backgroundColor: s === state ? getStateColor() : '#9ca3af',
                }}
                title={s}
              />
            ))}
          </div>

          {isRunning && (
            <div className="text-gray-900">
              Connections handled: <span className="font-bold text-green-600">{connectionCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {SERVER_STATES.map((s) => (
          <div
            key={s}
            className={`p-2 rounded text-center text-sm transition-all ${
              s === state
                ? 'bg-gray-200 text-gray-900 font-semibold'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <div className="capitalize">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
