import { useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    id: 'dns',
    title: 'DNS Lookup',
    description: 'Browser asks DNS server for the IP address of the domain',
    duration: 50,
  },
  {
    id: 'tcp',
    title: 'TCP Connection',
    description: 'Browser establishes a connection with the server',
    duration: 100,
  },
  {
    id: 'tls',
    title: 'TLS Handshake',
    description: 'Secure connection is established (HTTPS)',
    duration: 100,
  },
  {
    id: 'request',
    title: 'Send Request',
    description: 'HTTP request is sent to the server',
    duration: 50,
  },
  {
    id: 'server',
    title: 'Server Processing',
    description: 'Server handles the request, may call databases or APIs',
    duration: 200,
  },
  {
    id: 'response',
    title: 'Receive Response',
    description: 'Server sends back the HTTP response',
    duration: 50,
  },
  {
    id: 'render',
    title: 'Browser Rendering',
    description: 'Browser parses HTML, CSS, JavaScript and renders the page',
    duration: 150,
  },
];

export function RequestLifecycle() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const startSimulation = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setCompletedSteps([]);

    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= STEPS.length) {
        setIsPlaying(false);
        return;
      }

      setCurrentStep(stepIndex);
      
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, STEPS[stepIndex].id]);
        stepIndex++;
        runStep();
      }, STEPS[stepIndex].duration);
    };

    runStep();
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Request Lifecycle</h3>
          <p className="text-slate-400 text-sm">Follow a request from browser to server and back</p>
        </div>
        
        <button
          onClick={startSimulation}
          disabled={isPlaying}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? 'Running...' : 'Start Simulation'}
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700">
          <motion.div
            className="w-full bg-blue-500"
            initial={{ height: '0%' }}
            animate={{
              height: `${(completedSteps.length / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === index && isPlaying;
            const isPending = !isCompleted && !isCurrent;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: isPending ? 0.5 : 1,
                  x: 0,
                }}
                className="relative pl-12"
              >
                {/* Step Indicator */}
                <div
                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-blue-500 scale-110'
                      : 'bg-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div
                  className={`p-4 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-green-500/10 border border-green-500/30'
                      : isCurrent
                      ? 'bg-blue-500/10 border border-blue-500'
                      : 'bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold ${
                        isCompleted
                          ? 'text-green-400'
                          : isCurrent
                          ? 'text-blue-400'
                          : 'text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    
                    {isCurrent && (
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                    )}
                  </div>
                  
                  <p className="text-slate-400 text-sm">{step.description}</p>
                  
                  <div className="mt-2 text-xs text-slate-500">
                    ~{step.duration}ms
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Total Time */}
      {completedSteps.length > 0 && completedSteps.length < STEPS.length && (
        <div className="mt-6 p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Time So Far:</span>
            <span className="text-white font-mono">
              {STEPS.slice(0, completedSteps.length).reduce((sum, step) => sum + step.duration, 0)}ms
            </span>
          </div>
        </div>
      )}

      {completedSteps.length === STEPS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-center"
        >
          <p className="text-green-400 font-semibold">
            ✅ Complete! Total time: {STEPS.reduce((sum, step) => sum + step.duration, 0)}ms
          </p>
        </motion.div>
      )}
    </div>
  );
}
