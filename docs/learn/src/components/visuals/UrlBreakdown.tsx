import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Search, Hash, Globe } from 'lucide-react';
import { COLORS } from '../../types/curriculum';

const URL_PARTS = [
  { key: 'protocol', label: 'Protocol', color: COLORS.primary, icon: Globe },
  { key: 'hostname', label: 'Hostname', color: COLORS.success, icon: Globe },
  { key: 'pathname', label: 'Path', color: COLORS.warning, icon: Link },
  { key: 'search', label: 'Query', color: COLORS.secondary, icon: Search },
  { key: 'hash', label: 'Fragment', color: COLORS.info, icon: Hash },
];

export function UrlBreakdown() {
  const [url, setUrl] = useState('https://api.xarticle.com/extract?format=json#section');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const parsedUrl = new URL(url);

  const getPartValue = (key: string): string => {
    switch (key) {
      case 'protocol':
        return parsedUrl.protocol + '//';
      case 'hostname':
        return parsedUrl.hostname;
      case 'pathname':
        return parsedUrl.pathname;
      case 'search':
        return parsedUrl.search;
      case 'hash':
        return parsedUrl.hash;
      default:
        return '';
    }
  };

  const getPartDescription = (key: string): string => {
    switch (key) {
      case 'protocol':
        return 'How to connect (https = secure, http = standard)';
      case 'hostname':
        return 'The domain name of the server';
      case 'pathname':
        return 'The specific resource path on the server';
      case 'search':
        return 'Query parameters to pass to the server';
      case 'hash':
        return 'Fragment identifier (used by browser, not sent to server)';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">URL Structure</h3>
        <p className="text-slate-400 text-sm">Hover over parts of the URL to see what each section does.</p>
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <label className="text-slate-300 text-sm mb-2 block">Try your own URL:</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg font-mono text-sm border border-slate-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* URL Visualization */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6 overflow-x-auto">
        <div className="font-mono text-lg whitespace-nowrap">
          {URL_PARTS.map((part) => {
            const value = getPartValue(part.key);
            if (!value) return null;

            const isHovered = hoveredPart === part.key;

            return (
              <motion.span
                key={part.key}
                onMouseEnter={() => setHoveredPart(part.key)}
                onMouseLeave={() => setHoveredPart(null)}
                animate={{
                  scale: isHovered ? 1.05 : 1,
                  opacity: hoveredPart && !isHovered ? 0.4 : 1,
                }}
                className="inline-block px-2 py-1 rounded cursor-pointer mx-0.5"
                style={{
                  backgroundColor: isHovered ? `${part.color}40` : 'transparent',
                  color: part.color,
                  border: isHovered ? `2px solid ${part.color}` : '2px solid transparent',
                }}
                title={`${part.label}: ${getPartDescription(part.key)}`}
              >
                {value}
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* Parts Legend */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {URL_PARTS.map((part) => {
          const value = getPartValue(part.key);
          if (!value) return null;

          const isHovered = hoveredPart === part.key;

          return (
            <motion.div
              key={part.key}
              onMouseEnter={() => setHoveredPart(part.key)}
              onMouseLeave={() => setHoveredPart(null)}
              animate={{
                scale: isHovered ? 1.02 : 1,
              }}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                isHovered ? 'bg-slate-800' : 'bg-slate-800/50'
              }`}
              style={{
                borderLeft: `4px solid ${part.color}`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <part.icon size={18} style={{ color: part.color }} />
                <span className="font-semibold text-white">{part.label}</span>
              </div>
              
              <div
                className="font-mono text-sm mb-1 truncate"
                style={{ color: part.color }}
              >
                {value}
              </div>
              
              <p className="text-slate-400 text-sm">{getPartDescription(part.key)}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Routing Example */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 bg-slate-800 rounded-lg"
      >
        <h4 className="text-white font-semibold mb-3">How Routing Works</h4>
        
        <div className="space-y-2">
          {['/api/extract', '/api/image', '/api/health', '/'].map((route) => (
            <div
              key={route}
              className="flex items-center gap-4 p-2 rounded bg-slate-900"
            >
              <span className="font-mono text-green-400">{route}</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-300 text-sm">
                {route === '/api/extract' && 'Handles article extraction'}
                {route === '/api/image' && 'Proxies image requests'}
                {route === '/api/health' && 'Returns server status'}
                {route === '/' && 'Serves the frontend app'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
