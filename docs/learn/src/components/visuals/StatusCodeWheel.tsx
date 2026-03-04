import { useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../../types/curriculum';

const STATUS_CODES = [
  { code: '200', category: 'Success', description: 'OK - Request succeeded', color: COLORS.success },
  { code: '201', category: 'Success', description: 'Created - Resource created', color: COLORS.success },
  { code: '400', category: 'Client Error', description: 'Bad Request - Invalid syntax', color: COLORS.error },
  { code: '401', category: 'Client Error', description: 'Unauthorized - Authentication required', color: COLORS.error },
  { code: '403', category: 'Client Error', description: 'Forbidden - Access denied', color: COLORS.error },
  { code: '404', category: 'Client Error', description: 'Not Found - Resource missing', color: COLORS.error },
  { code: '500', category: 'Server Error', description: 'Internal Server Error', color: COLORS.warning },
  { code: '502', category: 'Server Error', description: 'Bad Gateway - Upstream error', color: COLORS.warning },
  { code: '503', category: 'Server Error', description: 'Service Unavailable', color: COLORS.warning },
];

const SCENARIOS = [
  { scenario: 'User requests a page that exists', answer: '200' },
  { scenario: 'User creates a new article', answer: '201' },
  { scenario: 'User sends malformed JSON', answer: '400' },
  { scenario: 'User tries to access without logging in', answer: '401' },
  { scenario: 'User requests non-existent page', answer: '404' },
  { scenario: 'Server crashes while processing', answer: '500' },
];

export function StatusCodeWheel() {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (code: string) => {
    setSelectedAnswer(code);
    setShowResult(true);
  };

  const nextScenario = () => {
    setCurrentScenario((prev) => (prev + 1) % SCENARIOS.length);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">HTTP Status Codes</h3>
        <p className="text-slate-400 text-sm">Hover over codes to learn more. Test your knowledge with scenarios!</p>
      </div>

      {/* Status Code Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {STATUS_CODES.map((status) => (
          <motion.div
            key={status.code}
            onMouseEnter={() => setHoveredCode(status.code)}
            onMouseLeave={() => setHoveredCode(null)}
            animate={{
              scale: hoveredCode === status.code ? 1.05 : 1,
            }}
            className="p-4 rounded-lg cursor-pointer transition-all"
            style={{
              backgroundColor: `${status.color}20`,
              border: `2px solid ${hoveredCode === status.code ? status.color : 'transparent'}`,
            }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: status.color }}
            >
              {status.code}
            </div>
            
            <div className="text-xs text-slate-400 mb-1">{status.category}</div>
            
            {hoveredCode === status.code && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-300"
              >
                {status.description}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Interactive Scenario */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">Scenario {currentScenario + 1} of {SCENARIOS.length}</h4>
        
        <p className="text-slate-300 mb-4">{SCENARIOS[currentScenario].scenario}</p>
        
        {!showResult ? (
          <div className="grid grid-cols-4 gap-2">
            {['200', '201', '400', '401', '404', '500'].map((code) => (
              <button
                key={code}
                onClick={() => handleAnswer(code)}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              selectedAnswer === SCENARIOS[currentScenario].answer
                ? 'bg-green-500/20 border border-green-500'
                : 'bg-red-500/20 border border-red-500'
            }`}
          >
            <p className="font-semibold mb-2">
              {selectedAnswer === SCENARIOS[currentScenario].answer
                ? '✅ Correct!'
                : '❌ Try again'}
            </p>
            
            <p className="text-slate-300 text-sm">
              The correct answer is {SCENARIOS[currentScenario].answer}
            </p>
            
            <button
              onClick={nextScenario}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Next Scenario
            </button>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {[
          { label: '2xx Success', color: COLORS.success },
          { label: '4xx Client Error', color: COLORS.error },
          { label: '5xx Server Error', color: COLORS.warning },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-400 text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
