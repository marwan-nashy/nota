import React, { useEffect, useRef, useState } from 'react';
import { Network, X, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';
import { Page, AppTheme } from '../types';
import { t, Language } from '../i18n';

interface GraphViewProps {
  isOpen: boolean;
  pages: Record<string, Page>;
  activePageId: string;
  theme?: AppTheme;
  language?: Language;
  onClose: () => void;
  onSelectPage: (id: string) => void;
}

interface Node {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  linksCount: number;
  isActive: boolean;
}

interface Link {
  source: string;
  target: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
  isOpen,
  pages,
  activePageId,
  theme = 'dark',
  language = 'en',
  onClose,
  onSelectPage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<Node | null>(null);

  // References to mutable physics simulation data
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const activePages = Object.values(pages).filter((p) => !p.isArchived);
    const links: Link[] = [];
    const linkCounts: Record<string, number> = {};

    // Build connections
    activePages.forEach((p) => {
      linkCounts[p.id] = linkCounts[p.id] || 0;
      const pTitle = (p.title || '').trim().toLowerCase();

      p.blocks.forEach((b) => {
        if (b.targetPageId && pages[b.targetPageId] && !pages[b.targetPageId].isArchived) {
          links.push({ source: p.id, target: b.targetPageId });
          linkCounts[p.id] = (linkCounts[p.id] || 0) + 1;
          linkCounts[b.targetPageId] = (linkCounts[b.targetPageId] || 0) + 1;
        } else if (b.content) {
          const stripped = b.content.replace(/<[^>]*>/g, '').toLowerCase();
          activePages.forEach((other) => {
            if (other.id !== p.id && other.title) {
              const otherTitle = other.title.trim().toLowerCase();
              if (stripped.includes(`@${otherTitle}`) || stripped.includes(`[[${otherTitle}]]`)) {
                links.push({ source: p.id, target: other.id });
                linkCounts[p.id] = (linkCounts[p.id] || 0) + 1;
                linkCounts[other.id] = (linkCounts[other.id] || 0) + 1;
              }
            }
          });
        }
      });
    });

    // Initialize node positions in a circular pattern
    const width = window.innerWidth * 0.85;
    const height = window.innerHeight * 0.85;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes: Node[] = activePages.map((p, idx) => {
      const angle = (idx / activePages.length) * Math.PI * 2;
      const radius = 100 + Math.random() * 150;
      const count = linkCounts[p.id] || 0;
      return {
        id: p.id,
        title: p.title || t('untitled', language),
        icon: p.icon || '📄',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.min(18, Math.max(8, 8 + count * 2)),
        linksCount: count,
        isActive: p.id === activePageId,
      };
    });

    nodesRef.current = nodes;
    linksRef.current = links;

    // Simulation Loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const runSimulation = () => {
      if (!isRunning) return;

      const currentNodes = nodesRef.current;
      const currentLinks = linksRef.current;

      // 1. Repulsion between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n1 = currentNodes[i];
          const n2 = currentNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 300) {
            const force = 350 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Attraction along links
      const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));
      for (const link of currentLinks) {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 90) * 0.04;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        }
      }

      // 3. Center gravity & friction damping
      for (const node of currentNodes) {
        if (node === draggedNodeRef.current) continue;

        node.vx += (centerX - node.x) * 0.005;
        node.vy += (centerY - node.y) * 0.005;

        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;
      }

      // 4. Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Pan & Zoom
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw Links
      const isDark = theme !== 'light' && theme !== 'sepia';
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;

      for (const link of currentLinks) {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (s && t) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
      }

      // Draw Nodes
      for (const node of currentNodes) {
        const isHovered = hoveredNode?.id === node.id;

        // Outer glow for active or hovered
        if (node.isActive || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = node.isActive
            ? 'rgba(99, 102, 241, 0.35)'
            : 'rgba(56, 189, 248, 0.35)';
          ctx.fill();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.isActive
          ? '#6366f1'
          : isHovered
          ? '#38bdf8'
          : isDark
          ? '#2e3440'
          : '#e2e8f0';
        ctx.strokeStyle = node.isActive
          ? '#818cf8'
          : isDark
          ? '#4b5563'
          : '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        // Node Icon & Label
        ctx.font = '11px sans-serif';
        ctx.fillStyle = isDark ? '#e5e7eb' : '#1f2937';
        ctx.textAlign = 'center';
        ctx.fillText(node.icon, node.x, node.y + 4);

        if (zoom > 0.75 || isHovered || node.isActive) {
          ctx.font = node.isActive ? 'bold 11px sans-serif' : '10px sans-serif';
          ctx.fillStyle = node.isActive ? '#818cf8' : isDark ? '#9ca3af' : '#475569';
          ctx.fillText(node.title, node.x, node.y + node.radius + 14);
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(runSimulation);
    };

    runSimulation();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, pages, activePageId, zoom, pan, hoveredNode, theme, language]);

  if (!isOpen) return null;

  // Mouse interaction handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const clickedNode = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      return;
    }

    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    const hover = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNode(hover || null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleNodeClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const clickedNode = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (clickedNode) {
      onSelectPage(clickedNode.id);
      onClose();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl h-[85vh] bg-white dark:bg-[#12131a] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2d3d] flex flex-col overflow-hidden relative"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header Bar */}
        <div className="h-14 px-6 border-b border-gray-200 dark:border-[#242636] flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'شبكة الأفكار المرئية (Graph View)' : 'Interactive Knowledge Graph'}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {nodesRef.current.length} {language === 'ar' ? 'صفحة متصلة' : 'pages'} • {linksRef.current.length} {language === 'ar' ? 'رابط' : 'connections'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-[#303348] hover:bg-gray-100 dark:hover:bg-[#202230] text-gray-600 dark:text-gray-300 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-[#303348] hover:bg-gray-100 dark:hover:bg-[#202230] text-gray-600 dark:text-gray-300 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-[#303348] hover:bg-gray-100 dark:hover:bg-[#202230] text-gray-600 dark:text-gray-300 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200 dark:bg-[#303348] mx-1"></div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202230] text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-[#fafafa] dark:bg-[#0d0e15] cursor-grab active:cursor-grabbing">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleNodeClick}
            onWheel={handleWheel}
            className="w-full h-full block"
          />

          {/* Hover Tooltip Card */}
          {hoveredNode && (
            <div 
              className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 z-10 px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-[#1a1b26]/95 backdrop-blur-md border border-gray-200 dark:border-[#2e3146] shadow-xl text-xs pointer-events-none flex items-center gap-2.5"
            >
              <span className="text-base">{hoveredNode.icon}</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>{hoveredNode.title}</span>
                  {hoveredNode.isActive && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-mono">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  {hoveredNode.linksCount} {language === 'ar' ? 'روابط متصلة' : 'connected links'} • {language === 'ar' ? 'اضغط للفتح' : 'Click to open'}
                </div>
              </div>
            </div>
          )}

          {/* Instruction Badge */}
          <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-[10px] text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-[#151622]/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/50 dark:border-[#222436] font-mono pointer-events-none select-none">
            {language === 'ar' ? 'عجلة الماوس: تكبير • سحب: تحريك • نقر: فتح' : 'Scroll: Zoom • Drag: Pan/Move • Click: Open'}
          </div>
        </div>
      </div>
    </div>
  );
};
