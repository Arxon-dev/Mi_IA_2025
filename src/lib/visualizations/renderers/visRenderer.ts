import { Network, DataSet, Edge, Node } from 'vis-network/standalone';
import { VisualizationData, FlowchartNode, ConceptNode, FlowchartEdge, ConceptLink } from '../types';

/**
 * Renderer usando vis-network para visualizaciones interactivas
 */
export class VisRenderer {
  private networks: Map<string, Network> = new Map();

  /**
   * Renderiza una visualización usando vis-network
   */
  async renderVisualization(
    containerId: string, 
    data: VisualizationData, 
    options?: any
  ): Promise<Network> {
    try {
      console.log(`🎨 Renderizando visualización ${data.type} en contenedor ${containerId}`);

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`No se encontró el contenedor ${containerId}`);
      }

      // Limpiar visualización anterior si existe
      if (this.networks.has(containerId)) {
        this.networks.get(containerId)?.destroy();
        this.networks.delete(containerId);
      }

      // Convertir datos según el tipo de visualización
      const { nodes, edges } = this.convertDataForVis(data);
      
      // Configuración específica según el tipo
      const visOptions = this.getVisOptions(data.type, options);

      // Crear la red
      const network = new Network(container, { nodes, edges }, visOptions);
      
      // Guardar referencia
      this.networks.set(containerId, network);

      // Configurar eventos
      this.setupNetworkEvents(network, data);

      console.log(`✅ Visualización renderizada: ${nodes.length} nodos, ${edges.length} conexiones`);
      return network;

    } catch (error) {
      console.error('❌ Error renderizando visualización:', error);
      throw new Error(`Error en renderizado: ${error.message}`);
    }
  }

  /**
   * Convierte los datos del sistema a formato vis-network
   */
  private convertDataForVis(data: VisualizationData): { nodes: DataSet<Node>, edges: DataSet<Edge> } {
    const visNodes: Node[] = [];
    const visEdges: Edge[] = [];

    // Convertir nodos según el tipo de visualización
    if (data.type === 'FLOWCHART') {
      data.nodes.forEach(node => {
        const flowNode = node as FlowchartNode;
        visNodes.push({
          id: flowNode.id,
          label: flowNode.label,
          title: flowNode.description || flowNode.label,
          shape: this.getFlowchartShape(flowNode.type),
          color: this.getFlowchartColor(flowNode.type),
          font: { size: 14, color: '#333' },
          x: flowNode.position?.x,
          y: flowNode.position?.y
        });
      });
      
      data.edges?.forEach(edge => {
        const flowEdge = edge as FlowchartEdge;
        visEdges.push({
          id: flowEdge.id,
          from: flowEdge.source,
          to: flowEdge.target,
          label: flowEdge.label || '',
          arrows: 'to',
          font: { size: 12 },
          color: { color: '#2563eb' }
        });
      });

    } else if (data.type === 'CONCEPT_MAP') {
      data.nodes.forEach(node => {
        const conceptNode = node as ConceptNode;
        visNodes.push({
          id: conceptNode.id,
          label: conceptNode.label,
          title: conceptNode.description || conceptNode.label,
          shape: 'ellipse',
          color: {
            background: conceptNode.color || '#f3f4f6',
            border: this.getConceptBorderColor(conceptNode.type),
            highlight: { background: '#e5e7eb', border: '#374151' }
          },
          size: conceptNode.size || 30,
          font: { 
            size: this.getConceptFontSize(conceptNode.type),
            color: '#1f2937'
          },
          x: conceptNode.position?.x,
          y: conceptNode.position?.y
        });
      });

      data.edges?.forEach(edge => {
        const conceptLink = edge as ConceptLink;
        visEdges.push({
          id: conceptLink.id,
          from: conceptLink.source,
          to: conceptLink.target,
          label: conceptLink.label || conceptLink.relationship,
          title: `${conceptLink.relationship} (fuerza: ${conceptLink.strength.toFixed(2)})`,
          width: Math.max(1, conceptLink.strength * 3),
          color: {
            color: this.getLinkColor(conceptLink.strength),
            opacity: 0.7
          },
          font: { size: 10, strokeWidth: 2, strokeColor: '#fff' }
        });
      });

    } else if (data.type === 'HIERARCHICAL_SCHEME') {
      data.nodes.forEach(node => {
        const hierNode = node as any; // HierarchyNode con position añadida
        visNodes.push({
          id: hierNode.id,
          label: hierNode.label,
          title: hierNode.description || hierNode.label,
          shape: 'box',
          color: this.getHierarchyColor(hierNode.level),
          font: { 
            size: Math.max(12, 16 - hierNode.level * 2),
            color: '#1f2937'
          },
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          x: hierNode.position?.x,
          y: hierNode.position?.y,
          level: hierNode.level // Para layout jerárquico
        });
      });

      // Para jerarquías, crear edges desde relaciones parent-child
      data.nodes.forEach(node => {
        const hierNode = node as any;
        if (hierNode.parent) {
          visEdges.push({
            id: `edge_${hierNode.parent}_${hierNode.id}`,
            from: hierNode.parent,
            to: hierNode.id,
            arrows: 'to',
            color: { color: '#6b7280' },
            width: 2
          });
        }
      });
    }

    return {
      nodes: new DataSet(visNodes),
      edges: new DataSet(visEdges)
    };
  }

  /**
   * Obtiene opciones de configuración para vis-network según el tipo
   */
  private getVisOptions(type: string, customOptions?: any): any {
    const baseOptions = {
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectConnectedEdges: false
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 100 }
      },
      nodes: {
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 5,
          x: 2,
          y: 2
        }
      },
      edges: {
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 3,
          x: 1,
          y: 1
        },
        smooth: {
          enabled: true,
          type: 'dynamic'
        }
      }
    };

    // Configuraciones específicas por tipo
    if (type === 'FLOWCHART') {
      return {
        ...baseOptions,
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 150,
            nodeSpacing: 100
          }
        },
        physics: { enabled: false }
      };
    }

    if (type === 'CONCEPT_MAP') {
      return {
        ...baseOptions,
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -8000,
            centralGravity: 0.3,
            springLength: 120,
            springConstant: 0.04,
            damping: 0.09
          },
          stabilization: { iterations: 200 }
        }
      };
    }

    if (type === 'HIERARCHICAL_SCHEME') {
      return {
        ...baseOptions,
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 120,
            nodeSpacing: 150,
            treeSpacing: 200
          }
        },
        physics: { enabled: false }
      };
    }

    return { ...baseOptions, ...customOptions };
  }

  /**
   * Configura eventos de la red
   */
  private setupNetworkEvents(network: Network, data: VisualizationData): void {
    // Evento de clic en nodo
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        console.log(`Nodo clickeado: ${nodeId}`);
        
        // Emitir evento personalizado
        const event = new CustomEvent('nodeClick', {
          detail: { nodeId, visualization: data }
        });
        document.dispatchEvent(event);
      }
    });

    // Evento de hover en nodo
    network.on('hoverNode', (params) => {
      const nodeId = params.node;
      console.log(`Hover en nodo: ${nodeId}`);
    });

    // Evento de estabilización completada
    network.on('stabilizationIterationsDone', () => {
      console.log('✅ Estabilización de la red completada');
      network.setOptions({ physics: { enabled: false } });
    });
  }

  /**
   * Obtiene la forma del nodo para flowcharts
   */
  private getFlowchartShape(type: string): string {
    switch (type) {
      case 'start':
      case 'end':
        return 'ellipse';
      case 'decision':
        return 'diamond';
      case 'process':
      default:
        return 'box';
    }
  }

  /**
   * Obtiene el color del nodo para flowcharts
   */
  private getFlowchartColor(type: string): any {
    const colors = {
      start: { background: '#10b981', border: '#059669' },
      end: { background: '#ef4444', border: '#dc2626' },
      decision: { background: '#f59e0b', border: '#d97706' },
      process: { background: '#3b82f6', border: '#2563eb' },
      connector: { background: '#6b7280', border: '#4b5563' }
    };
    
    return colors[type] || colors.process;
  }

  /**
   * Obtiene el color del borde para nodos conceptuales
   */
  private getConceptBorderColor(type: string): string {
    switch (type) {
      case 'main': return '#1e40af';
      case 'secondary': return '#047857';
      case 'detail': return '#b91c1c';
      default: return '#4b5563';
    }
  }

  /**
   * Obtiene el tamaño de fuente para nodos conceptuales
   */
  private getConceptFontSize(type: string): number {
    switch (type) {
      case 'main': return 16;
      case 'secondary': return 14;
      case 'detail': return 12;
      default: return 13;
    }
  }

  /**
   * Obtiene el color del enlace basado en su fuerza
   */
  private getLinkColor(strength: number): string {
    if (strength > 0.8) return '#dc2626';      // Rojo fuerte
    if (strength > 0.6) return '#ea580c';      // Naranja
    if (strength > 0.4) return '#ca8a04';      // Amarillo
    return '#4b5563';                          // Gris
  }

  /**
   * Obtiene el color para nodos jerárquicos basado en el nivel
   */
  private getHierarchyColor(level: number): any {
    const colors = [
      { background: '#3b82f6', border: '#1e40af' }, // Nivel 0 - Azul
      { background: '#10b981', border: '#047857' }, // Nivel 1 - Verde
      { background: '#f59e0b', border: '#d97706' }, // Nivel 2 - Amarillo
      { background: '#8b5cf6', border: '#7c3aed' }  // Nivel 3 - Púrpura
    ];
    
    return colors[Math.min(level, colors.length - 1)];
  }

  /**
   * Destruye una red específica
   */
  destroyNetwork(containerId: string): void {
    const network = this.networks.get(containerId);
    if (network) {
      network.destroy();
      this.networks.delete(containerId);
      console.log(`🗑️ Red ${containerId} destruida`);
    }
  }

  /**
   * Destruye todas las redes activas
   */
  destroyAllNetworks(): void {
    this.networks.forEach((network, containerId) => {
      network.destroy();
      console.log(`🗑️ Red ${containerId} destruida`);
    });
    this.networks.clear();
  }
} 