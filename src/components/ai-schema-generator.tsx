'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Download, Wand2, RefreshCw, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface SchemaNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children?: SchemaNode[];
  parent?: string;
}

interface AISchemaConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  schemaType: 'hierarchical' | 'timeline' | 'flowchart' | 'mindmap' | 'organizational';
  enhanceWithAI: boolean;
  autoOptimize: boolean;
}

const AI_SCHEMA_GENERATOR_STYLES = `
  .schema-canvas {
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .schema-node {
    transition: all 0.3s ease;
  }
  
  .schema-node:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
  
  .ai-enhanced {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 2px solid #4f46e5;
  }
  
  .loading-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
`;

export default function AISchemaGenerator() {
  const [inputText, setInputText] = useState('');
  const [schemaNodes, setSchemaNodes] = useState<SchemaNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState<AISchemaConfig>({
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 2000,
    schemaType: 'organizational',
    enhanceWithAI: true,
    autoOptimize: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Inyectar estilos CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = AI_SCHEMA_GENERATOR_STYLES;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const parseTextToNodes = (text: string): SchemaNode[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const nodes: SchemaNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      let level = 0;
      let cleanText = trimmedLine;
      
      // Sistema de indentación por espacios: cada 2 espacios = 1 nivel
      const originalLine = line;
      const leadingSpaces = originalLine.length - originalLine.trimStart().length;
      level = Math.floor(leadingSpaces / 2);
      
      // Limpiar marcadores comunes pero mantener el texto
      cleanText = cleanText.replace(/^[-•*]\s*/, ''); // Eliminar guiones y bullets
      cleanText = cleanText.replace(/^\d+\.\s*/, ''); // Eliminar numeración
      cleanText = cleanText.replace(/^[a-zA-Z]\)\s*/, ''); // Eliminar letras con paréntesis
      
      // Limitar el nivel máximo a 6 para evitar jerarquías demasiado profundas
      level = Math.min(level, 6);
      
      // Asegurar que el texto no esté vacío después de la limpieza
      if (cleanText.trim()) {
        const node: SchemaNode = {
          id: `node-${index}`,
          text: cleanText.trim(),
          x: 0,
          y: 0,
          level: level,
          children: []
        };
        
        nodes.push(node);
      }
    });
    
    return nodes;
  };

  const enhanceWithAI = async (nodes: SchemaNode[]): Promise<SchemaNode[]> => {
    if (!aiConfig.enhanceWithAI) return nodes;
    
    try {
      const response = await fetch('/api/ai-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('No se pudo obtener la configuración de IA');
      }
      
      const config = await response.json();
      
      // Llamar a la API de IA para mejorar el esquema
      const enhanceResponse = await fetch('/api/ai-enhance-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          schemaType: aiConfig.schemaType,
          config: {
            provider: config.provider || aiConfig.provider,
            model: config.model || aiConfig.model,
            temperature: aiConfig.temperature,
            maxTokens: aiConfig.maxTokens
          }
        })
      });
      
      if (enhanceResponse.ok) {
        const enhancedData = await enhanceResponse.json();
        return enhancedData.enhancedNodes || nodes;
      }
      
      return nodes;
    } catch (error) {
      console.error('Error al mejorar con IA:', error);
      toast.error('Error al mejorar el esquema con IA');
      return nodes;
    }
  };

  const calculateNodePositions = (nodes: SchemaNode[], type: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return nodes;
    
    const width = canvas.width;
    const height = canvas.height;
    
    switch (type) {
      case 'hierarchical':
        return calculateHierarchicalPositions(nodes, width, height);
      case 'organizational':
        return calculateOrganizationalPositions(nodes, width, height);
      case 'timeline':
        return calculateTimelinePositions(nodes, width, height);
      case 'flowchart':
        return calculateFlowchartPositions(nodes, width, height);
      case 'mindmap':
        return calculateMindmapPositions(nodes, width, height);
      default:
        return nodes;
    }
  };

  // Función auxiliar para calcular la altura de un nodo basándose en su texto
  const calculateNodeHeight = (text: string, nodeWidth: number = 280, padding: number = 20): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 80;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return 80;
    
    ctx.font = '13px Inter, sans-serif';
    const maxWidth = nodeWidth - padding;
    const words = text.split(' ');
    let line = '';
    const lines = [];
    
    // Verificar si el texto completo cabe en una línea
    const fullTextWidth = ctx.measureText(text).width;
    if (words.length === 1 || fullTextWidth <= maxWidth) {
      lines.push(text);
    } else {
      // Dividir en múltiples líneas
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
    }
    
    const lineHeight = 16;
    const textHeight = lines.length * lineHeight;
    return Math.max(80, textHeight + padding * 2);
  };

  const calculateHierarchicalPositions = (nodes: SchemaNode[], width: number, height: number): SchemaNode[] => {
    if (aiConfig.schemaType === 'organizational') {
      return calculateOrganizationalPositions(nodes, width, height);
    }
    
    const levels = new Map<number, SchemaNode[]>();
    const margin = 80;
    const nodeWidth = 280;
    const minNodeSpacing = 50;
    const verticalSpacing = 40;
    
    // Agrupar nodos por nivel
    nodes.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(node);
    });
    
    // Calcular el ancho necesario basándose en el nivel con más nodos
    let maxNodesInLevel = 0;
    levels.forEach(levelNodes => {
      maxNodesInLevel = Math.max(maxNodesInLevel, levelNodes.length);
    });
    
    // Calcular ancho mínimo necesario
    const requiredWidth = Math.max(
      width,
      maxNodesInLevel * nodeWidth + (maxNodesInLevel - 1) * minNodeSpacing + margin * 2
    );
    
    // Actualizar el canvas si es necesario
    const canvas = canvasRef.current;
    if (canvas && canvas.width < requiredWidth) {
      canvas.width = requiredWidth;
    }
    
    // Posicionar nodos nivel por nivel con alturas dinámicas
    let currentY = margin;
    levels.forEach((levelNodes, level) => {
      const totalLevelWidth = levelNodes.length * nodeWidth + (levelNodes.length - 1) * minNodeSpacing;
      const startX = (requiredWidth - totalLevelWidth) / 2;
      
      // Calcular la altura máxima de este nivel
      const maxHeightInLevel = Math.max(...levelNodes.map(node => calculateNodeHeight(node.text, 280)));
      
      levelNodes.forEach((node, index) => {
        node.x = startX + (index * (nodeWidth + minNodeSpacing)) + nodeWidth / 2;
        node.y = currentY + maxHeightInLevel / 2;
      });
      
      // Actualizar Y para el siguiente nivel
      currentY += maxHeightInLevel + verticalSpacing;
    });
    
    // Actualizar altura del canvas si es necesario
    if (canvas) {
      const minHeight = currentY + margin;
      if (canvas.height < minHeight) {
        canvas.height = minHeight;
      }
    }
    
    return nodes;
  };

  const calculateOrganizationalPositions = (nodes: SchemaNode[], width: number, height: number): SchemaNode[] => {
    const levels = new Map<number, SchemaNode[]>();
    const margin = 60;
    const nodeWidth = 180;
    const minNodeSpacing = 40;
    const verticalSpacing = 100; // Espaciado vertical entre niveles
    
    // Agrupar nodos por nivel
    nodes.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(node);
    });
    
    // Crear estructura jerárquica basada en la secuencia del texto
    const nodeHierarchy = new Map<string, SchemaNode[]>();
    const parentStack: SchemaNode[] = [];
    
    // Procesar nodos en orden secuencial para mantener la jerarquía correcta
    nodes.forEach((node, index) => {
      // Ajustar el stack de padres según el nivel actual
      while (parentStack.length > node.level) {
        parentStack.pop();
      }
      
      // Encontrar el padre correcto
      let parent: SchemaNode | null = null;
      if (node.level > 0 && parentStack.length > 0) {
        parent = parentStack[parentStack.length - 1];
        
        // Si el nivel actual es mayor que el del último padre + 1, buscar el padre correcto
        if (node.level > parent.level + 1) {
          // Buscar hacia atrás en la lista de nodos para encontrar el padre del nivel correcto
          for (let i = index - 1; i >= 0; i--) {
            if (nodes[i].level === node.level - 1) {
              parent = nodes[i];
              // Actualizar el stack de padres
              parentStack.splice(node.level - 1);
              parentStack.push(parent);
              break;
            }
          }
        }
      }
      
      // Agregar el nodo actual al stack si puede ser padre de futuros nodos
      if (parentStack.length === node.level) {
        parentStack.push(node);
      }
      
      // Agrupar hijos por padre
      const parentKey = parent ? `${parent.id}` : 'root';
      if (!nodeHierarchy.has(parentKey)) {
        nodeHierarchy.set(parentKey, []);
      }
      nodeHierarchy.get(parentKey)!.push(node);
      
      // Establecer la relación padre-hijo
      if (parent) {
        node.parent = parent.id;
      }
    });
    
    // Calcular ancho necesario
    let requiredWidth = width;
    levels.forEach((levelNodes) => {
      const levelWidth = levelNodes.length * nodeWidth + (levelNodes.length - 1) * minNodeSpacing + margin * 2;
      requiredWidth = Math.max(requiredWidth, levelWidth);
    });
    
    // Actualizar el canvas si es necesario
    const canvas = canvasRef.current;
    if (canvas && canvas.width < requiredWidth) {
      canvas.width = requiredWidth;
    }
    
    // Posicionar nodos nivel por nivel respetando la jerarquía
    let currentY = margin + 50;
    
    levels.forEach((levelNodes, level) => {
      const maxHeightInLevel = Math.max(...levelNodes.map(node => calculateNodeHeight(node.text, nodeWidth)));
      
      if (level === 0) {
        // Nivel raíz: centrado
        levelNodes.forEach(node => {
          node.x = requiredWidth / 2;
          node.y = currentY + maxHeightInLevel / 2;
        });
      } else {
        // Agrupar nodos por su padre
        const nodesByParent = new Map<string, SchemaNode[]>();
        levelNodes.forEach(node => {
          const parentKey = node.parent || 'root';
          if (!nodesByParent.has(parentKey)) {
            nodesByParent.set(parentKey, []);
          }
          nodesByParent.get(parentKey)!.push(node);
        });
        
        // Posicionar cada grupo de hermanos
        nodesByParent.forEach((siblings, parentKey) => {
          let parentX = requiredWidth / 2; // Por defecto, centro
          
          // Encontrar la posición X del padre
          if (parentKey !== 'root') {
            const parent = nodes.find(n => n.id === parentKey);
            if (parent) {
              parentX = parent.x;
            }
          }
          
          // Posicionar hermanos
          if (siblings.length === 1) {
            // Un solo hijo: directamente bajo el padre
            siblings[0].x = parentX;
            siblings[0].y = currentY + maxHeightInLevel / 2;
          } else {
            // Múltiples hijos: distribuidos horizontalmente
            const totalWidth = (siblings.length - 1) * (nodeWidth + minNodeSpacing);
            const startX = parentX - totalWidth / 2;
            
            siblings.forEach((node, index) => {
              node.x = startX + (index * (nodeWidth + minNodeSpacing));
              node.y = currentY + maxHeightInLevel / 2;
            });
          }
        });
      }
      
      // Actualizar Y para el siguiente nivel
      currentY += maxHeightInLevel + verticalSpacing;
    });
    
    // Actualizar altura del canvas si es necesario
    if (canvas) {
      const minHeight = currentY + margin;
      if (canvas.height < minHeight) {
        canvas.height = minHeight;
      }
    }
    
    return nodes;
  };

  const calculateTimelinePositions = (nodes: SchemaNode[], width: number, height: number): SchemaNode[] => {
    const centerY = height / 2;
    const margin = 100;
    const availableWidth = width - (margin * 2);
    const nodeSpacing = nodes.length > 1 ? availableWidth / (nodes.length - 1) : 0;
    const verticalOffset = 100; // Separación vertical entre niveles
    
    return nodes.map((node, index) => ({
      ...node,
      x: nodes.length === 1 ? width / 2 : margin + (index * nodeSpacing),
      y: centerY + (index % 2 === 0 ? -verticalOffset : verticalOffset)
    }));
  };

  const calculateFlowchartPositions = (nodes: SchemaNode[], width: number, height: number): SchemaNode[] => {
    const margin = 80;
    const minNodeSpacing = 160;
    const nodeHeight = 80;
    
    // Calcular número óptimo de columnas
    const maxCols = Math.floor((width - margin * 2) / minNodeSpacing);
    const cols = Math.min(Math.ceil(Math.sqrt(nodes.length)), maxCols, 4);
    const rows = Math.ceil(nodes.length / cols);
    
    const availableWidth = width - (margin * 2);
    const availableHeight = height - (margin * 2);
    const cellWidth = Math.max(minNodeSpacing, availableWidth / cols);
    const cellHeight = Math.max(nodeHeight * 1.8, availableHeight / rows);
    
    return nodes.map((node, index) => ({
      ...node,
      x: margin + (index % cols) * cellWidth + cellWidth / 2,
      y: margin + Math.floor(index / cols) * cellHeight + cellHeight / 2
    }));
  };

  const calculateMindmapPositions = (nodes: SchemaNode[], width: number, height: number): SchemaNode[] => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 5;
    const margin = 100;
    
    // Separar nodo central de los demás
    const centralNode = nodes.find(node => node.level === 0) || nodes[0];
    const otherNodes = nodes.filter(node => node !== centralNode);
    
    const result: SchemaNode[] = [];
    
    // Posicionar nodo central
    if (centralNode) {
      result.push({
        ...centralNode,
        x: centerX,
        y: centerY
      });
    }
    
    if (otherNodes.length === 0) {
      return result;
    }
    
    // Si hay pocos nodos, distribuirlos en un círculo simple
    if (otherNodes.length <= 8) {
      const radius = Math.max(baseRadius, 150);
      const angleStep = (2 * Math.PI) / otherNodes.length;
      
      otherNodes.forEach((node, index) => {
        const angle = index * angleStep;
        result.push({
          ...node,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      });
    } else {
      // Para muchos nodos, usar círculos concéntricos
      const levels = new Map<number, SchemaNode[]>();
      otherNodes.forEach(node => {
        const level = Math.max(1, node.level);
        if (!levels.has(level)) {
          levels.set(level, []);
        }
        levels.get(level)!.push(node);
      });
      
      levels.forEach((levelNodes, level) => {
        const radius = baseRadius + (level * 80);
        const angleStep = (2 * Math.PI) / levelNodes.length;
        
        levelNodes.forEach((node, index) => {
          const angle = index * angleStep;
          result.push({
            ...node,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        });
      });
    }
    
    return result;
  };

  const drawSchema = (nodes: SchemaNode[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar estilos
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dibujar conexiones
    drawConnections(ctx, nodes);
    
    // Dibujar nodos
    nodes.forEach(node => {
      drawNode(ctx, node, aiConfig.enhanceWithAI);
    });
  };

  const drawConnections = (ctx: CanvasRenderingContext2D, nodes: SchemaNode[]) => {
    if (aiConfig.schemaType === 'hierarchical' || aiConfig.schemaType === 'organizational') {
      // Estilo de conexión mejorado para esquemas organizacionales
      ctx.strokeStyle = aiConfig.schemaType === 'organizational' ? '#374151' : '#64748b';
      ctx.lineWidth = aiConfig.schemaType === 'organizational' ? 2 : 2;
      
      if (aiConfig.schemaType === 'organizational') {
        // Dibujar conexiones organizacionales con líneas horizontales y verticales
        drawOrganizationalHierarchy(ctx, nodes);
      } else {
        // Conectar nodos jerárquicos por niveles con alturas dinámicas
        for (let i = 0; i < nodes.length; i++) {
          const current = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const next = nodes[j];
            if (next.level === current.level + 1) {
              const currentNodeHeight = calculateNodeHeight(current.text, aiConfig.schemaType === 'organizational' ? 180 : 280);
        const nextNodeHeight = calculateNodeHeight(next.text, aiConfig.schemaType === 'organizational' ? 180 : 280);
              
              drawArrow(
                ctx, 
                current.x, 
                current.y + currentNodeHeight / 2, 
                next.x, 
                next.y - nextNodeHeight / 2
              );
            }
          }
        }
      }
    } else if (aiConfig.schemaType === 'timeline') {
      // Línea base para timeline
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      const centerY = ctx.canvas.height / 2;
      ctx.beginPath();
      ctx.moveTo(80, centerY);
      ctx.lineTo(ctx.canvas.width - 80, centerY);
      ctx.stroke();
      
      // Conectores verticales
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.moveTo(node.x, centerY);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      });
    } else if (aiConfig.schemaType === 'mindmap') {
      // Conectar desde el centro a los nodos
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      const centralNode = nodes.find(node => node.level === 0);
      
      if (centralNode) {
        nodes.forEach(node => {
          if (node !== centralNode) {
            ctx.beginPath();
            ctx.moveTo(centralNode.x, centralNode.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        });
      }
    } else if (aiConfig.schemaType === 'flowchart') {
      // Conectar nodos en secuencia
      for (let i = 0; i < nodes.length - 1; i++) {
        const current = nodes[i];
        const next = nodes[i + 1];
        drawArrow(ctx, current.x, current.y, next.x, next.y);
      }
    }
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: SchemaNode, isAIEnhanced: boolean) => {
    const padding = 20;
    const nodeWidth = aiConfig.schemaType === 'organizational' ? 180 : 280;
    const lineHeight = 16;
    const radius = aiConfig.schemaType === 'organizational' ? 6 : 8;
    
    // Calcular altura dinámica basada en el texto
    const maxWidth = nodeWidth - padding;
    const words = node.text.split(' ');
    let line = '';
    const lines = [];
    
    // Verificar si el texto completo cabe en una línea
    const fullTextWidth = ctx.measureText(node.text).width;
    if (words.length === 1 || fullTextWidth <= maxWidth) {
      lines.push(node.text);
    } else {
      // Dividir en múltiples líneas sin límite
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
    }
    
    // Calcular altura dinámica del nodo
    const textHeight = lines.length * lineHeight;
    const nodeHeight = Math.max(aiConfig.schemaType === 'organizational' ? 70 : 80, textHeight + padding * 2);
    
    // Sombra del nodo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = aiConfig.schemaType === 'organizational' ? 6 : 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Fondo del nodo con colores diferenciados por nivel
    if (aiConfig.schemaType === 'organizational') {
      // Colores específicos para esquemas organizacionales con mejor contraste
      const organizationalColors = [
        '#1e40af', // Nivel 0 - Azul oscuro principal
        '#3b82f6', // Nivel 1 - Azul medio
        '#6366f1', // Nivel 2 - Púrpura azulado
        '#8b5cf6', // Nivel 3 - Púrpura medio
        '#a855f7', // Nivel 4 - Púrpura claro
        '#c084fc'  // Nivel 5+ - Púrpura suave
      ];
      ctx.fillStyle = organizationalColors[Math.min(node.level, organizationalColors.length - 1)];
    } else if (isAIEnhanced) {
      const gradient = ctx.createLinearGradient(
        node.x - nodeWidth/2, node.y - nodeHeight/2,
        node.x + nodeWidth/2, node.y + nodeHeight/2
      );
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
    } else {
      // Color según el nivel para mejor visualización
      const levelColors = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
      ctx.fillStyle = levelColors[Math.min(node.level, levelColors.length - 1)];
    }
    
    // Dibujar rectángulo con esquinas redondeadas
    drawRoundedRect(
      ctx,
      node.x - nodeWidth/2,
      node.y - nodeHeight/2,
      nodeWidth,
      nodeHeight,
      radius
    );
    ctx.fill();
    
    // Resetear sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Borde del nodo
    if (aiConfig.schemaType === 'organizational') {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = isAIEnhanced ? '#4f46e5' : '#cbd5e1';
      ctx.lineWidth = isAIEnhanced ? 2 : 1;
    }
    drawRoundedRect(
      ctx,
      node.x - nodeWidth/2,
      node.y - nodeHeight/2,
      nodeWidth,
      nodeHeight,
      radius
    );
    ctx.stroke();
    
    // Texto del nodo
    if (aiConfig.schemaType === 'organizational') {
      ctx.fillStyle = '#ffffff';
      ctx.font = node.level === 0 ? 'bold 14px Inter, sans-serif' : '13px Inter, sans-serif';
    } else {
      ctx.fillStyle = isAIEnhanced ? '#ffffff' : '#1e293b';
      ctx.font = `${isAIEnhanced ? 'bold' : 'normal'} 13px Inter, sans-serif`;
    }
    
    // Configurar alineación del texto
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dibujar todas las líneas de texto
    const startY = node.y - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, node.x, startY + (index * lineHeight));
    });
  };

  const drawOrganizationalConnection = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    // Conexiones en forma de T para organigramas profesionales
    ctx.beginPath();
    
    // Línea vertical desde el nodo padre
    const midY = fromY + (toY - fromY) / 2;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX, midY);
    
    // Línea horizontal
    ctx.moveTo(fromX, midY);
    ctx.lineTo(toX, midY);
    
    // Línea vertical hacia el nodo hijo
    ctx.moveTo(toX, midY);
    ctx.lineTo(toX, toY);
    
    ctx.stroke();
  };

  const drawOrganizationalHierarchy = (ctx: CanvasRenderingContext2D, nodes: SchemaNode[]) => {
    // Agrupar nodos por nivel
    const levels = new Map<number, SchemaNode[]>();
    nodes.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(node);
    });

    // Dibujar conexiones nivel por nivel
    for (let level = 0; level < levels.size - 1; level++) {
      const currentLevelNodes = levels.get(level) || [];
      const nextLevelNodes = levels.get(level + 1) || [];
      
      if (currentLevelNodes.length === 0 || nextLevelNodes.length === 0) continue;
      
      // Para cada nodo del nivel actual, conectar con sus hijos en el siguiente nivel
      currentLevelNodes.forEach(parentNode => {
        const children = nextLevelNodes.filter(child => {
          // Determinar si un nodo es hijo basándose en la proximidad horizontal
          const parentIndex = currentLevelNodes.indexOf(parentNode);
          const childIndex = nextLevelNodes.indexOf(child);
          const expectedChildrenPerParent = Math.ceil(nextLevelNodes.length / currentLevelNodes.length);
          const startChild = parentIndex * expectedChildrenPerParent;
          const endChild = Math.min(startChild + expectedChildrenPerParent, nextLevelNodes.length);
          return childIndex >= startChild && childIndex < endChild;
        });
        
        if (children.length > 0) {
          const orgNodeWidth = 180; // Ancho consistente con calculateOrganizationalPositions
          const parentNodeHeight = calculateNodeHeight(parentNode.text, orgNodeWidth);
          const parentBottom = parentNode.y + parentNodeHeight / 2;
          
          if (children.length === 1) {
            // Conexión directa para un solo hijo
            const child = children[0];
            const childNodeHeight = calculateNodeHeight(child.text, orgNodeWidth);
            const childTop = child.y - childNodeHeight / 2;
            
            drawOrganizationalConnection(ctx, parentNode.x, parentBottom, child.x, childTop);
          } else {
            // Conexiones con línea horizontal para múltiples hijos
            const leftmostChild = children[0];
            const rightmostChild = children[children.length - 1];
            const horizontalY = parentBottom + (children[0].y - calculateNodeHeight(children[0].text, orgNodeWidth) / 2 - parentBottom) / 2;
            
            // Línea vertical desde el padre hasta la línea horizontal
            ctx.beginPath();
            ctx.moveTo(parentNode.x, parentBottom);
            ctx.lineTo(parentNode.x, horizontalY);
            ctx.stroke();
            
            // Línea horizontal conectando todos los hijos
            ctx.beginPath();
            ctx.moveTo(leftmostChild.x, horizontalY);
            ctx.lineTo(rightmostChild.x, horizontalY);
            ctx.stroke();
            
            // Líneas verticales desde la línea horizontal hasta cada hijo
            children.forEach(child => {
              const childNodeHeight = calculateNodeHeight(child.text, orgNodeWidth);
              const childTop = child.y - childNodeHeight / 2;
              
              ctx.beginPath();
              ctx.moveTo(child.x, horizontalY);
              ctx.lineTo(child.x, childTop);
              ctx.stroke();
            });
          }
        }
      });
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const generateSchema = async () => {
    if (!inputText.trim()) {
      (toast as any).error('Por favor, ingresa algún texto para generar el esquema');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Parsear texto inicial
      let nodes = parseTextToNodes(inputText);
      
      // Mejorar con IA si está habilitado
      if (aiConfig.enhanceWithAI) {
        (toast as any).success('Mejorando esquema con IA...');
        nodes = await enhanceWithAI(nodes);
      }
      
      // Calcular posiciones
      nodes = calculateNodePositions(nodes, aiConfig.schemaType);
      
      setSchemaNodes(nodes);
      
      // Dibujar en el siguiente frame
      setTimeout(() => {
        drawSchema(nodes);
      }, 100);
      
      (toast as any).success('Esquema generado exitosamente');
    } catch (error) {
      console.error('Error al generar esquema:', error);
      (toast as any).error('Error al generar el esquema');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSchema = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `esquema-${aiConfig.schemaType}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    toast.success('Esquema descargado exitosamente');
  };

  const regenerateSchema = () => {
    if (schemaNodes.length > 0) {
      generateSchema();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-600" />
            Generador de Esquemas con IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Área de entrada de texto */}
          <div className="space-y-2">
            <Label htmlFor="input-text">Texto para convertir en esquema</Label>
            <Textarea
              id="input-text"
              placeholder="Ingresa el texto que quieres convertir en esquema...\n\nSistema de indentación por espacios (cada 2 espacios = 1 nivel):\n\nEJÉRCITO DEL AIRE Y DEL ESPACIO\n  CUARTEL GENERAL\n    JEMA\n      Estado Mayor del EA (EMA)\n        Secretaría General del Estado Mayor\n        División de Planes (DPL)\n        División de Operaciones (DOP)\n        División de Logística (DLO)\n      Gabinete del Jefe de Estado Mayor del EA\n        Jefatura\n        Secretaría\n    Jefatura de Servicios Técnicos\n      Jefatura\n      Oficina Técnica"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] font-mono"
            />
          </div>

          {/* Controles */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="schema-type">Tipo de esquema:</Label>
              <Select
                value={aiConfig.schemaType}
                onValueChange={(value: any) => setAiConfig(prev => ({ ...prev, schemaType: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hierarchical">Jerárquico</SelectItem>
                  <SelectItem value="organizational">Organizacional</SelectItem>
                  <SelectItem value="timeline">Línea de tiempo</SelectItem>
                  <SelectItem value="flowchart">Diagrama de flujo</SelectItem>
                  <SelectItem value="mindmap">Mapa mental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="enhance-ai"
                checked={aiConfig.enhanceWithAI}
                onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, enhanceWithAI: checked }))}
              />
              <Label htmlFor="enhance-ai">Mejorar con IA</Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </div>

          {/* Configuración avanzada */}
          {showSettings && (
            <Card className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperatura IA: {aiConfig.temperature}</Label>
                  <Slider
                    value={[aiConfig.temperature]}
                    onValueChange={([value]) => setAiConfig(prev => ({ ...prev, temperature: value }))}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. tokens: {aiConfig.maxTokens}</Label>
                  <Slider
                    value={[aiConfig.maxTokens]}
                    onValueChange={([value]) => setAiConfig(prev => ({ ...prev, maxTokens: value }))}
                    min={500}
                    max={4000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              onClick={generateSchema}
              disabled={isGenerating || !inputText.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generando...' : 'Generar Esquema'}
            </Button>
            
            {schemaNodes.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={regenerateSchema}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={downloadSchema}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </>
            )}
          </div>

          {/* Canvas para el esquema */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="w-full overflow-auto">
              <canvas
                ref={canvasRef}
                width={1000}
                height={700}
                className="schema-canvas max-w-full h-auto"
                style={{ minWidth: '800px', minHeight: '600px' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}