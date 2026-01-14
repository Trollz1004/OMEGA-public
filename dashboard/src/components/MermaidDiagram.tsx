'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with custom theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#4F46E5',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#3730A3',
    lineColor: '#64748B',
    secondaryColor: '#10B981',
    tertiaryColor: '#F59E0B',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 50,
    rankSpacing: 50,
  },
});

const LIFECYCLE_DIAGRAM = `
graph LR
    A[SURVIVAL] -->|scheduleSplit| B[TRANSITION]
    B -->|7-30 day wait| C{applySplit}
    C -->|repeat| B
    C -->|activatePermanent| D[PERMANENT DAO]
    D -->|founder ≤10%| D

    style A fill:#ff9800,stroke:#e65100,color:#fff
    style B fill:#2196f3,stroke:#1565c0,color:#fff
    style C fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style D fill:#4caf50,stroke:#2e7d32,color:#fff
`;

interface MermaidDiagramProps {
  className?: string;
}

export default function MermaidDiagram({ className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, LIFECYCLE_DIAGRAM);

        // Insert the SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setIsRendered(true);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, []);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 card-hover ${className}`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Split Lifecycle
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        The FOR THE KIDS platform follows a transparent lifecycle from SURVIVAL mode through
        optional TRANSITION phases to an immutable PERMANENT DAO state.
      </p>

      {/* Diagram Container */}
      <div
        ref={containerRef}
        className="mermaid-container bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 min-h-[150px] flex items-center justify-center"
      >
        {!isRendered && !error && (
          <div className="flex items-center justify-center text-slate-400">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading diagram...
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff9800' }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">SURVIVAL</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2196f3' }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">TRANSITION</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9c27b0' }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">Decision Point</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4caf50' }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">PERMANENT</span>
        </div>
      </div>

      {/* Phase Descriptions */}
      <div className="mt-6 space-y-3">
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
          <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
            SURVIVAL Mode
          </div>
          <div className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
            Initial phase allowing founder sustainability. Dating app revenue supports operations.
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
            TRANSITION Phase
          </div>
          <div className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
            Scheduled split changes with 7-30 day timelock for community review.
          </div>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
          <div className="text-sm font-medium text-green-700 dark:text-green-300">
            PERMANENT DAO
          </div>
          <div className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
            Immutable state with founder capped at 10% maximum. Full charity-first allocation.
          </div>
        </div>
      </div>
    </div>
  );
}
