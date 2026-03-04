import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowRight, Globe, Server } from 'lucide-react';
import { COLORS } from '../../types/curriculum';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof HTTP_METHODS[number];

interface HttpPacket {
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  body: string;
}

export function HttpPacketAnatomy() {
  const [selectedMethod, setSelectedMethod] = useState<HttpMethod>('GET');
  const [showPacket, setShowPacket] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const packet: HttpPacket = {
    method: selectedMethod,
    path: '/api/extract',
    headers: {
      'Host': 'api.xarticle.co',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: selectedMethod === 'GET' ? '' : '{"url": "https://x.com/..."}',
  };

  const sendRequest = () => {
    setShowPacket(true);
    setTimeout(() => {
      setShowPacket(false);
    }, 3000);
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">HTTP Request Anatomy</h3>
        <p className="text-slate-400 text-sm">Click on sections to explore. Build a request and send it!</p>
      </div>

      {/* Method Selection */}
      <div className="mb-6">
        <label className="text-slate-300 text-sm mb-2 block">HTTP Method:</label>
        <div className="flex gap-2">
          {HTTP_METHODS.map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedMethod === method
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Request Builder */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-slate-400"
          >
            <Globe size={20} />
            <span>Client</span>
          </div>
          
          <motion.div
            animate={showPacket ? { x: 100 } : { x: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="flex-1 relative"
          >
            <div className="h-1 bg-slate-700 rounded">
              {showPacket && (
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="h-full bg-blue-500 rounded"
                />
              )}
            </div>
            
            {showPacket && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded text-sm font-mono"
              >
                HTTP Request
              </motion.div>
            )}
          </motion.div>
          
          <div className="flex items-center gap-2 text-slate-400"
          >
            <Server size={20} />
            <span>Server</span>
          </div>
        </div>

        <button
          onClick={sendRequest}
          disabled={showPacket}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          <Send size={18} />
          Send Request
        </button>
      </div>

      {/* Packet Anatomy - Expandable Sections */}
      <div className="space-y-3">
        {/* Request Line */}
        <div
          className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'line' ? null : 'line')}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.primary }}
              />
              <span className="text-white font-semibold">Request Line</span>
            </div>
            <ArrowRight
              size={18}
              className={`text-slate-400 transition-transform ${
                expandedSection === 'line' ? 'rotate-90' : ''
              }`}
            />
          </div>
          
          {expandedSection === 'line' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="px-3 pb-3"
            >
              <div className="font-mono text-sm bg-slate-900 p-3 rounded"
              >
                <span style={{ color: COLORS.success }} className="font-bold">{packet.method}</span>
                <span className="text-white"> {packet.path} </span>
                <span className="text-slate-400">HTTP/1.1</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                Contains the method, path, and HTTP version.
              </p>
            </motion.div>
          )}
        </div>

        {/* Headers */}
        <div
          className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'headers' ? null : 'headers')}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.warning }}
              />
              <span className="text-white font-semibold">Headers</span>
            </div>
            <ArrowRight
              size={18}
              className={`text-slate-400 transition-transform ${
                expandedSection === 'headers' ? 'rotate-90' : ''
              }`}
            />
          </div>
          
          {expandedSection === 'headers' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="px-3 pb-3"
            >
              <div className="font-mono text-sm bg-slate-900 p-3 rounded space-y-1"
              >
                {Object.entries(packet.headers).map(([key, value]) => (
                  <div key={key}>
                    <span style={{ color: COLORS.info }} className="font-bold">{key}</span>
                    <span className="text-slate-400">: </span>
                    <span className="text-green-400">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm mt-2">
                Metadata about the request. Content-Type tells the server what format the body is in.
              </p>
            </motion.div>
          )}
        </div>

        {/* Body */}
        <div
          className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === 'body' ? null : 'body')}
        >
          <div className="p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.secondary }}
              />
              <span className="text-white font-semibold">Body</span>
            </div>
            <ArrowRight
              size={18}
              className={`text-slate-400 transition-transform ${
                expandedSection === 'body' ? 'rotate-90' : ''
              }`}
            />
          </div>
          
          {expandedSection === 'body' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="px-3 pb-3"
            >
              <div className="font-mono text-sm bg-slate-900 p-3 rounded"
              >
                {packet.body ? (
                  <pre className="text-green-400">{packet.body}</pre>
                ) : (
                  <span className="text-slate-500 italic">No body (GET requests typically don't have a body)</span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-2">
                The actual data being sent. POST/PUT requests usually have a body.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Method Info */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {HTTP_METHODS.map((method) => (
          <div
            key={method}
            className={`p-3 rounded-lg text-center transition-all ${
              selectedMethod === method
                ? 'bg-slate-700 border-2 border-blue-500'
                : 'bg-slate-800'
            }`}
          >
            <div className="font-bold text-white mb-1">{method}</div>
            <div className="text-xs text-slate-400">
              {method === 'GET' && 'Retrieve data'}
              {method === 'POST' && 'Create data'}
              {method === 'PUT' && 'Update data'}
              {method === 'DELETE' && 'Remove data'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
