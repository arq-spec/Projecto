import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Check, 
  X, 
  Info, 
  AlertTriangle, 
  FileCheck, 
  ArrowLeft, 
  Printer, 
  Layers, 
  TrendingUp, 
  User, 
  Calendar, 
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { loadFromFirebase, saveToFirebase } from '../firebase';

// Interfaces for Documentação
export interface DocEquipment {
  id: string;
  nome: string;
  peso: number;
  categoria: string;
}

export interface DocStructureItem {
  id: string;
  equipamentoId: string;
  nome: string;
  quantidade: number;
  pesoUnitario: number;
}

export interface DocAnchoragePoint {
  ponto: string;
  fixacao: string;
}

export interface DocStructure {
  id: string;
  nome: string; // e.g. "ESTRUTURA A"
  pontosFixacao: number;
  itens: DocStructureItem[];
  pontosAncoragem: DocAnchoragePoint[];
  nomenclaturaPrefix?: string;
}

export interface DocAmbiente {
  id: string;
  nome: string; // e.g. "PLENÁRIA"
  estruturas: DocStructure[];
}

export interface DocProject {
  id: string;
  evento: string;
  dataEvento: string;
  pesoMaxPonto: number; // e.g. 100
  ambientes: DocAmbiente[];
  materiaisAncoragem: string;
  responsavel: string;
  crea: string;
  art: string;
  dataEmissao?: string;
}

// Initial seed data from the PDF for catalog items
const DEFAULT_CATALOG: DocEquipment[] = [
  { id: '1', nome: 'Box Truss Q25 (m)', peso: 7.2, categoria: 'Estruturas' },
  { id: '2', nome: 'Box Truss Q15 (m)', peso: 2.6, categoria: 'Estruturas' },
  { id: '3', nome: 'Talha 10m - 1Tn', peso: 18.5, categoria: 'Rigging / Elevação' },
  { id: '4', nome: 'Refletor Cob', peso: 4.3, categoria: 'Iluminação' },
  { id: '5', nome: 'Moving Mac Aura', peso: 13.7, categoria: 'Iluminação' },
  { id: '6', nome: 'Brut 4 Lamp', peso: 7.2, categoria: 'Iluminação' },
  { id: '7', nome: 'Moving Beam BSW', peso: 23.5, categoria: 'Iluminação' },
  { id: '8', nome: 'Anilha de Carga', peso: 1.0, categoria: 'Acessórios' },
  { id: '9', nome: 'Turbosound iQ10', peso: 17.7, categoria: 'Sonorização' },
  { id: '10', nome: 'Strobo Atomic', peso: 3.5, categoria: 'Iluminação' },
  { id: '11', nome: 'Artec 508A', peso: 12.2, categoria: 'Sonorização' }
];

// Recreating the exact "IMPACTA HUB" project from the PDF pages to make the app incredibly complete on first load
const SAMPLE_PROJECTS: DocProject[] = [
  {
    id: 'sample-impacta-hub',
    evento: 'IMPACTA HUB',
    dataEvento: '18/05 a 21/05',
    pesoMaxPonto: 100,
    materiaisAncoragem: 'Anilhas Curva 5/8 - Cap de carga 1600Kgf - FS 6:1\nTalha Manual 1Tn',
    responsavel: 'BRUNO FERREIRA',
    crea: '5069853410',
    art: '2620261359111',
    dataEmissao: '07/05/2026',
    ambientes: [
      {
        id: 'amb-1',
        nome: 'PLENÁRIA',
        estruturas: [
          {
            id: 'est-a',
            nome: 'ESTRUTURA A',
            pontosFixacao: 8,
            itens: [
              { id: 'i1', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 18, pesoUnitario: 7.2 },
              { id: 'i2', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 8, pesoUnitario: 18.5 },
              { id: 'i3', equipamentoId: '4', nome: 'Refletor Cob', quantidade: 16, pesoUnitario: 4.3 },
              { id: 'i4', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 6, pesoUnitario: 13.7 },
              { id: 'i5', equipamentoId: '6', nome: 'Brut 4 Lamp', quantidade: 4, pesoUnitario: 7.2 },
              { id: 'i6', equipamentoId: '7', nome: 'Moving Beam BSW', quantidade: 4, pesoUnitario: 23.5 },
              { id: 'i7', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 8, pesoUnitario: 1.0 },
              { id: 'i8', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 4, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'A1', fixacao: 'Talha' },
              { ponto: 'A2', fixacao: 'Talha' },
              { ponto: 'A3', fixacao: 'Talha' },
              { ponto: 'A4', fixacao: 'Talha' },
              { ponto: 'A5', fixacao: 'Talha' },
              { ponto: 'A6', fixacao: 'Talha' },
              { ponto: 'A7', fixacao: 'Talha' },
              { ponto: 'A8', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-b',
            nome: 'ESTRUTURA B',
            pontosFixacao: 3,
            itens: [
              { id: 'i9', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 4, pesoUnitario: 7.2 },
              { id: 'i10', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i11', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i12', equipamentoId: '6', nome: 'Brut 4 Lamp', quantidade: 1, pesoUnitario: 7.2 },
              { id: 'i13', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 3, pesoUnitario: 13.7 },
              { id: 'i14', equipamentoId: '7', nome: 'Moving Beam BSW', quantidade: 2, pesoUnitario: 23.5 },
              { id: 'i15', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 2, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'B1', fixacao: 'Talha' },
              { ponto: 'B2', fixacao: 'Talha' },
              { ponto: 'B3', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-c',
            nome: 'ESTRUTURA C',
            pontosFixacao: 3,
            itens: [
              { id: 'i16', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i17', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i18', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i19', equipamentoId: '6', nome: 'Brut 4 Lamp', quantidade: 1, pesoUnitario: 7.2 },
              { id: 'i20', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 3, pesoUnitario: 13.7 },
              { id: 'i21', equipamentoId: '7', nome: 'Moving Beam BSW', quantidade: 2, pesoUnitario: 23.5 },
              { id: 'i22', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 2, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'C1', fixacao: 'Talha' },
              { ponto: 'C2', fixacao: 'Talha' },
              { ponto: 'C3', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-d',
            nome: 'ESTRUTURA D',
            pontosFixacao: 3,
            itens: [
              { id: 'i23', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i24', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i25', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i26', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 3, pesoUnitario: 13.7 },
              { id: 'i27', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 2, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'D1', fixacao: 'Talha' },
              { ponto: 'D2', fixacao: 'Talha' },
              { ponto: 'D3', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-e',
            nome: 'ESTRUTURA E',
            pontosFixacao: 3,
            itens: [
              { id: 'i28', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i29', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i30', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i31', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 3, pesoUnitario: 13.7 },
              { id: 'i32', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 2, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'E1', fixacao: 'Talha' },
              { ponto: 'E2', fixacao: 'Talha' },
              { ponto: 'E3', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-f',
            nome: 'ESTRUTURA F',
            pontosFixacao: 3,
            itens: [
              { id: 'i33', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i34', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i35', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i36', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 3, pesoUnitario: 13.7 },
              { id: 'i37', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 2, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'F1', fixacao: 'Talha' },
              { ponto: 'F2', fixacao: 'Talha' },
              { ponto: 'F3', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-g',
            nome: 'ESTRUTURA G',
            pontosFixacao: 3,
            itens: [
              { id: 'i38', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i39', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i40', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i41', equipamentoId: '5', nome: 'Moving Mac Aura', quantidade: 3, pesoUnitario: 13.7 },
              { id: 'i42', equipamentoId: '9', nome: 'Turbosound iQ10', quantidade: 2, pesoUnitario: 17.7 }
            ],
            pontosAncoragem: [
              { ponto: 'G1', fixacao: 'Talha' },
              { ponto: 'G2', fixacao: 'Talha' },
              { ponto: 'G3', fixacao: 'Talha' }
            ]
          },
          {
            id: 'est-h',
            nome: 'ESTRUTURA H',
            pontosFixacao: 3,
            itens: [
              { id: 'i43', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 14, pesoUnitario: 7.2 },
              { id: 'i44', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 3, pesoUnitario: 18.5 },
              { id: 'i45', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 3, pesoUnitario: 1.0 },
              { id: 'i46', equipamentoId: '10', nome: 'Strobo Atomic', quantidade: 10, pesoUnitario: 3.5 }
            ],
            pontosAncoragem: [
              { ponto: 'H1', fixacao: 'Talha' },
              { ponto: 'H2', fixacao: 'Talha' },
              { ponto: 'H3', fixacao: 'Talha' },
              { ponto: 'H4', fixacao: 'Talha' },
              { ponto: 'H5', fixacao: 'Talha' },
              { ponto: 'H6', fixacao: 'Talha' }
            ]
          }
        ]
      },
      {
        id: 'amb-2',
        nome: 'SALA 1',
        estruturas: [
          {
            id: 'est-i',
            nome: 'ESTRUTURA I',
            pontosFixacao: 2,
            itens: [
              { id: 'i47', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i48', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 2, pesoUnitario: 18.5 },
              { id: 'i49', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 2, pesoUnitario: 1.0 },
              { id: 'i50', equipamentoId: '6', nome: 'Brut 4 Lamp', quantidade: 2, pesoUnitario: 7.2 },
              { id: 'i51', equipamentoId: '4', nome: 'Refletor Cob', quantidade: 6, pesoUnitario: 4.3 }
            ],
            pontosAncoragem: [
              { ponto: 'I1', fixacao: 'Talha' },
              { ponto: 'I2', fixacao: 'Talha' },
              { ponto: 'I3', fixacao: 'Talha' },
              { ponto: 'I4', fixacao: 'Talha' }
            ]
          }
        ]
      },
      {
        id: 'amb-3',
        nome: 'SALA 2',
        estruturas: [
          {
            id: 'est-j',
            nome: 'ESTRUTURA J',
            pontosFixacao: 2,
            itens: [
              { id: 'i52', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i53', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 2, pesoUnitario: 18.5 },
              { id: 'i54', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 2, pesoUnitario: 1.0 },
              { id: 'i55', equipamentoId: '6', nome: 'Brut 4 Lamp', quantidade: 2, pesoUnitario: 7.2 },
              { id: 'i56', equipamentoId: '4', nome: 'Refletor Cob', quantidade: 6, pesoUnitario: 4.3 }
            ],
            pontosAncoragem: [
              { ponto: 'J1', fixacao: 'Talha' },
              { ponto: 'J2', fixacao: 'Talha' },
              { ponto: 'J3', fixacao: 'Talha' }
            ]
          }
        ]
      },
      {
        id: 'amb-4',
        nome: 'SALA 3',
        estruturas: [
          {
            id: 'est-k',
            nome: 'ESTRUTURA K',
            pontosFixacao: 2,
            itens: [
              { id: 'i57', equipamentoId: '1', nome: 'Box Truss Q25 (m)', quantidade: 5, pesoUnitario: 7.2 },
              { id: 'i58', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 2, pesoUnitario: 18.5 },
              { id: 'i59', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 2, pesoUnitario: 1.0 },
              { id: 'i60', equipamentoId: '6', nome: 'Brut 4 Lamp', quantidade: 2, pesoUnitario: 7.2 },
              { id: 'i61', equipamentoId: '4', nome: 'Refletor Cob', quantidade: 6, pesoUnitario: 4.3 }
            ],
            pontosAncoragem: [
              { ponto: 'K1', fixacao: 'Talha' },
              { ponto: 'K2', fixacao: 'Talha' },
              { ponto: 'K3', fixacao: 'Talha' }
            ]
          }
        ]
      },
      {
        id: 'amb-5',
        nome: 'FLASH PALCO',
        estruturas: [
          {
            id: 'est-l',
            nome: 'ESTRUTURA L',
            pontosFixacao: 6,
            itens: [
              { id: 'i62', equipamentoId: '2', nome: 'Box Truss Q15 (m)', quantidade: 20, pesoUnitario: 2.6 },
              { id: 'i63', equipamentoId: '3', nome: 'Talha 10m - 1Tn', quantidade: 6, pesoUnitario: 18.5 },
              { id: 'i64', equipamentoId: '11', nome: 'Artec 508A', quantidade: 6, pesoUnitario: 12.2 },
              { id: 'i65', equipamentoId: '8', nome: 'Anilha de Carga', quantidade: 6, pesoUnitario: 1.0 },
              { id: 'i66', equipamentoId: '4', nome: 'Refletor Cob', quantidade: 8, pesoUnitario: 4.3 }
            ],
            pontosAncoragem: [
              { ponto: 'L1', fixacao: 'Talha' },
              { ponto: 'L2', fixacao: 'Talha' },
              { ponto: 'L3', fixacao: 'Talha' },
              { ponto: 'L4', fixacao: 'Talha' },
              { ponto: 'L5', fixacao: 'Talha' },
              { ponto: 'L6', fixacao: 'Talha' }
            ]
          }
        ]
      }
    ]
  }
];

export function Documentation() {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'projects'>('projects');
  
  // Database States
  const [catalog, setCatalog] = useState<DocEquipment[]>([]);
  const [projects, setProjects] = useState<DocProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Modal / Form States for Catalog Equipment
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<DocEquipment | null>(null);
  const [equipName, setEquipName] = useState('');
  const [equipWeight, setEquipWeight] = useState('');
  const [equipCategory, setEquipCategory] = useState('Estruturas');

  // Deletion Confirm states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetType, setDeleteTargetType] = useState<'equip' | 'project' | null>(null);

  // Active Project Workspace state (for generating/editing reports)
  const [activeProject, setActiveProject] = useState<DocProject | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Workspace Steps Form values
  const [projEvento, setProjEvento] = useState('');
  const [projData, setProjData] = useState('');
  const [projPesoMax, setProjPesoMax] = useState('100');
  const [projMateriais, setProjMateriais] = useState('Anilhas Curva 5/8 - Cap de carga 1600Kgf - FS 6:1\nTalha Manual 1Tn');
  const [projResp, setProjResp] = useState('');
  const [projCrea, setProjCrea] = useState('');
  const [projArt, setProjArt] = useState('');
  const [projAmbientes, setProjAmbientes] = useState<DocAmbiente[]>([]);

  // Editing structures temporary helpers
  const [selectedAmbIndex, setSelectedAmbIndex] = useState<number>(0);

  // Active focused cell for Excel interface
  const [activeCellId, setActiveCellId] = useState<string | null>(null);

  // Equipment selection popup state
  const [equipmentSelector, setEquipmentSelector] = useState<{
    ambIndex: number;
    estIndex: number;
    itemIdx: number;
  } | null>(null);
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');

  // Print ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Categories
  const categories = ['Todas', 'Estruturas', 'Rigging / Elevação', 'Iluminação', 'Sonorização', 'Acessórios', 'Outros'];

  // Initial Load & Listeners
  useEffect(() => {
    async function initDocDb() {
      setIsLoading(true);
      try {
        // Safe timeout of 15 seconds for database loading to prevent infinite loading screen
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading from database')), 15000)
        );

        const loadCatalogPromise = loadFromFirebase('doc_catalog').catch(err => {
          console.warn('[Documentation] Error loading catalog, using fallback', err);
          return null;
        });

        const loadProjectsPromise = loadFromFirebase('doc_projects').catch(err => {
          console.warn('[Documentation] Error loading projects, using fallback', err);
          return null;
        });

        const [loadedCatalog, loadedProjects] = await Promise.race([
          Promise.all([loadCatalogPromise, loadProjectsPromise]),
          timeoutPromise
        ]) as [any, any];

        if (loadedCatalog && Array.isArray(loadedCatalog) && loadedCatalog.length > 0) {
          const normalizedCatalog = loadedCatalog.map((e: any) => ({
            id: e.id || String(Math.random()),
            nome: e.nome || 'Equipamento Sem Nome',
            peso: typeof e.peso === 'number' ? e.peso : parseFloat(String(e.peso)) || 0,
            categoria: e.categoria || 'Outros'
          }));
          setCatalog(normalizedCatalog);
        } else {
          // Seed initial catalog
          setCatalog(DEFAULT_CATALOG);
          saveToFirebase('doc_catalog', DEFAULT_CATALOG).catch(err => {
            console.warn('[Documentation] Failed to save seed catalog:', err);
          });
        }

        if (loadedProjects && Array.isArray(loadedProjects) && loadedProjects.length > 0) {
          // Normalize projects to ensure they have environments and structures properly defined
          const normalized = loadedProjects.map((p: any) => ({
            ...p,
            ambientes: Array.isArray(p.ambientes) ? p.ambientes.map((amb: any) => ({
              ...amb,
              estruturas: Array.isArray(amb.estruturas) ? amb.estruturas.map((est: any) => ({
                ...est,
                itens: Array.isArray(est.itens) ? est.itens : [],
                pontosAncoragem: Array.isArray(est.pontosAncoragem) ? est.pontosAncoragem : [],
                pontosFixacao: typeof est.pontosFixacao === 'number' ? est.pontosFixacao : parseInt(String(est.pontosFixacao)) || 2
              })) : []
            })) : []
          }));
          setProjects(normalized);
        } else {
          // Seed sample project
          setProjects(SAMPLE_PROJECTS);
          saveToFirebase('doc_projects', SAMPLE_PROJECTS).catch(err => {
            console.warn('[Documentation] Failed to save seed projects:', err);
          });
        }
      } catch (e) {
        console.warn('Failed to load documentation data (using offline defaults)', e);
        // Fallback to offline defaults
        setCatalog(DEFAULT_CATALOG);
        setProjects(SAMPLE_PROJECTS);
      } finally {
        setIsLoading(false);
      }
    }
    initDocDb();
  }, []);

  // Sync to database on mutation
  const handleSaveCatalog = async (updatedCatalog: DocEquipment[]) => {
    setCatalog(updatedCatalog);
    try {
      await saveToFirebase('doc_catalog', updatedCatalog);
    } catch (e) {
      console.warn('Error saving catalog to Firebase', e);
    }
  };

  const handleSaveProjects = async (updatedProjects: DocProject[]) => {
    setProjects(updatedProjects);
    try {
      await saveToFirebase('doc_projects', updatedProjects);
    } catch (e) {
      console.warn('Error saving projects to Firebase', e);
    }
  };

  // Add or Edit Equipment
  const openAddEquipModal = () => {
    setEditingEquip(null);
    setEquipName('');
    setEquipWeight('');
    setEquipCategory('Estruturas');
    setIsEquipModalOpen(true);
  };

  const openEditEquipModal = (equip: DocEquipment) => {
    setEditingEquip(equip);
    setEquipName(equip.nome);
    setEquipWeight(equip.peso.toString());
    setEquipCategory(equip.categoria);
    setIsEquipModalOpen(true);
  };

  const handleConfirmEquip = () => {
    if (!equipName.trim() || !equipWeight) return;

    const parsedWeight = parseFloat(equipWeight.replace(',', '.'));
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    let newCatalog = [...catalog];

    if (editingEquip) {
      // Edit
      newCatalog = newCatalog.map(e => 
        e.id === editingEquip.id 
          ? { ...e, nome: equipName.trim(), peso: parsedWeight, categoria: equipCategory } 
          : e
      );
    } else {
      // Create
      const newEquip: DocEquipment = {
        id: 'equip_' + Date.now(),
        nome: equipName.trim(),
        peso: parsedWeight,
        categoria: equipCategory
      };
      newCatalog.unshift(newEquip);
    }

    handleSaveCatalog(newCatalog);
    setIsEquipModalOpen(false);
  };

  // Delete confirm requests
  const requestDelete = (id: string, type: 'equip' | 'project') => {
    setDeleteTargetId(id);
    setDeleteTargetType(type);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !deleteTargetType) return;

    if (deleteTargetType === 'equip') {
      const updated = catalog.filter(e => e.id !== deleteTargetId);
      handleSaveCatalog(updated);
    } else {
      const updated = projects.filter(p => p.id !== deleteTargetId);
      handleSaveProjects(updated);
    }

    setDeleteTargetId(null);
    setDeleteTargetType(null);
  };

  // Open Project Workspace for Creation
  const handleNewProject = () => {
    setActiveProject(null);
    setProjEvento('');
    setProjData('');
    setProjPesoMax('100');
    setProjMateriais('Anilhas Curva 5/8 - Cap de carga 1600Kgf - FS 6:1\nTalha Manual 1Tn');
    setProjResp('');
    setProjCrea('');
    setProjArt('');
    
    // Default initial template with 1 Ambiente and 1 Empty Structure
    const defaultAmbiente: DocAmbiente = {
      id: 'amb_' + Date.now(),
      nome: 'PLENÁRIA',
      estruturas: [
        {
          id: 'est_' + Date.now(),
          nome: 'ESTRUTURA A',
          pontosFixacao: 2,
          itens: [],
          pontosAncoragem: [
            { ponto: 'A1', fixacao: 'Talha' },
            { ponto: 'A2', fixacao: 'Talha' }
          ]
        }
      ]
    };
    
    setProjAmbientes([defaultAmbiente]);
    setSelectedAmbIndex(0);
    setIsWorkspaceOpen(true);
  };

  // Open Project Workspace for Editing
  const handleEditProject = (proj: DocProject) => {
    setActiveProject(proj);
    setProjEvento(proj.evento);
    setProjData(proj.dataEvento);
    setProjPesoMax(proj.pesoMaxPonto.toString());
    setProjMateriais(proj.materiaisAncoragem);
    setProjResp(proj.responsavel);
    setProjCrea(proj.crea);
    setProjArt(proj.art);
    setProjAmbientes(JSON.parse(JSON.stringify(proj.ambientes))); // deep clone
    setSelectedAmbIndex(0);
    setIsWorkspaceOpen(true);
  };

  // Manage Ambientes
  const addAmbiente = () => {
    const nome = prompt('Nome do Ambiente (ex: SALA 1, FOYER):');
    if (!nome?.trim()) return;

    const newAmb: DocAmbiente = {
      id: 'amb_' + Date.now(),
      nome: nome.trim().toUpperCase(),
      estruturas: [
        {
          id: 'est_' + Date.now(),
          nome: `ESTRUTURA A`,
          pontosFixacao: 2,
          itens: [],
          pontosAncoragem: [
            { ponto: 'A1', fixacao: 'Talha' },
            { ponto: 'A2', fixacao: 'Talha' }
          ]
        }
      ]
    };

    setProjAmbientes([...projAmbientes, newAmb]);
    setSelectedAmbIndex(projAmbientes.length);
  };

  const removeAmbiente = (idx: number) => {
    if (projAmbientes.length <= 1) {
      alert('O memorial precisa ter pelo menos 1 ambiente.');
      return;
    }
    if (confirm(`Excluir o ambiente "${projAmbientes[idx].nome}" e todas as suas estruturas?`)) {
      const updated = projAmbientes.filter((_, i) => i !== idx);
      setProjAmbientes(updated);
      setSelectedAmbIndex(Math.max(0, idx - 1));
    }
  };

  const renameAmbiente = (idx: number, newName: string) => {
    if (!newName.trim()) return;
    const updated = [...projAmbientes];
    updated[idx].nome = newName.trim().toUpperCase();
    setProjAmbientes(updated);
  };

  // Manage Structures inside Active Ambiente
  const addStructure = (ambIdx: number) => {
    const nextLetter = String.fromCharCode(65 + projAmbientes[ambIdx].estruturas.length); // A, B, C, etc.
    const newEst: DocStructure = {
      id: 'est_' + Date.now(),
      nome: `ESTRUTURA ${nextLetter}`,
      pontosFixacao: 2,
      itens: [],
      pontosAncoragem: [
        { ponto: `${nextLetter}1`, fixacao: 'Talha' },
        { ponto: `${nextLetter}2`, fixacao: 'Talha' }
      ],
      nomenclaturaPrefix: nextLetter
    };

    const updated = [...projAmbientes];
    updated[ambIdx].estruturas.push(newEst);
    setProjAmbientes(updated);
  };

  const removeStructure = (ambIdx: number, estIdx: number) => {
    if (projAmbientes[ambIdx].estruturas.length <= 1) {
      alert('Cada ambiente precisa ter pelo menos 1 estrutura.');
      return;
    }
    if (confirm('Deseja excluir esta estrutura?')) {
      const updated = [...projAmbientes];
      updated[ambIdx].estruturas = updated[ambIdx].estruturas.filter((_, i) => i !== estIdx);
      // Re-letter structures for neat ordering
      updated[ambIdx].estruturas = updated[ambIdx].estruturas.map((est, i) => {
        const letter = String.fromCharCode(65 + i);
        return {
          ...est,
          nome: est.nome.startsWith('ESTRUTURA ') ? `ESTRUTURA ${letter}` : est.nome,
          nomenclaturaPrefix: est.nomenclaturaPrefix || letter
        };
      });
      setProjAmbientes(updated);
    }
  };

  // Update Structure Points
  const updateStructurePoints = (ambIdx: number, estIdx: number, pointsCount: number) => {
    if (isNaN(pointsCount) || pointsCount < 1) return;
    
    const updated = [...projAmbientes];
    const structure = updated[ambIdx].estruturas[estIdx];
    structure.pontosFixacao = pointsCount;

    // Auto update points list
    const structureLetter = structure.nomenclaturaPrefix || structure.nome.replace('ESTRUTURA ', '').trim() || 'A';
    const newPoints: DocAnchoragePoint[] = [];
    for (let i = 1; i <= pointsCount; i++) {
      const existingPoint = structure.pontosAncoragem[i - 1];
      newPoints.push({
        ponto: `${structureLetter}${i}`,
        fixacao: existingPoint ? existingPoint.fixacao : 'Talha'
      });
    }
    structure.pontosAncoragem = newPoints;
    setProjAmbientes(updated);
  };

  // Update Structure Nomenclature Prefix
  const updateStructureNomenclaturePrefix = (ambIdx: number, estIdx: number, prefix: string) => {
    const updated = [...projAmbientes];
    const structure = updated[ambIdx].estruturas[estIdx];
    const cleanPrefix = prefix.trim().toUpperCase();
    structure.nomenclaturaPrefix = cleanPrefix;
    
    // Rename existing points sequentially
    structure.pontosAncoragem = structure.pontosAncoragem.map((pt, idx) => ({
      ...pt,
      ponto: `${cleanPrefix || 'A'}${idx + 1}`
    }));
    
    setProjAmbientes(updated);
  };

  // Add individual Anchorage Point
  const addAnchoragePoint = (ambIdx: number, estIdx: number) => {
    const updated = [...projAmbientes];
    const structure = updated[ambIdx].estruturas[estIdx];
    const prefix = structure.nomenclaturaPrefix || structure.nome.replace('ESTRUTURA ', '').trim() || 'A';
    
    const nextIndex = structure.pontosAncoragem.length + 1;
    structure.pontosAncoragem.push({
      ponto: `${prefix}${nextIndex}`,
      fixacao: 'Talha'
    });
    structure.pontosFixacao = structure.pontosAncoragem.length;
    setProjAmbientes(updated);
  };

  // Remove individual Anchorage Point
  const removeAnchoragePoint = (ambIdx: number, estIdx: number, ptIdx: number) => {
    const updated = [...projAmbientes];
    const structure = updated[ambIdx].estruturas[estIdx];
    
    const remaining = structure.pontosAncoragem.filter((_, idx) => idx !== ptIdx);
    const prefix = structure.nomenclaturaPrefix || structure.nome.replace('ESTRUTURA ', '').trim() || 'A';
    
    structure.pontosAncoragem = remaining.map((pt, idx) => ({
      ...pt,
      ponto: `${prefix}${idx + 1}`
    }));
    structure.pontosFixacao = structure.pontosAncoragem.length;
    setProjAmbientes(updated);
  };

  // Handle catalog select for individual item line
  const handleSelectEquipmentForLine = (equip: DocEquipment) => {
    if (!equipmentSelector) return;
    const { ambIndex, estIndex, itemIdx } = equipmentSelector;
    const updated = [...projAmbientes];
    const structure = updated[ambIndex].estruturas[estIndex];
    const item = structure.itens[itemIdx];
    if (item) {
      item.equipamentoId = equip.id;
      item.nome = equip.nome;
      item.pesoUnitario = equip.peso;
    }
    setProjAmbientes(updated);
    setEquipmentSelector(null);
  };

  // Edit point description manually
  const updateAnchoragePoint = (ambIdx: number, estIdx: number, ptIdx: number, value: string) => {
    const updated = [...projAmbientes];
    updated[ambIdx].estruturas[estIdx].pontosAncoragem[ptIdx].fixacao = value;
    setProjAmbientes(updated);
  };

  // Add Equipment to Structure
  const addEquipToStructure = (ambIdx: number, estIdx: number, equipId: string) => {
    const equip = catalog.find(e => e.id === equipId);
    if (!equip) return;

    const updated = [...projAmbientes];
    const structure = updated[ambIdx].estruturas[estIdx];

    // Check if already in structure
    const existing = structure.itens.find(i => i.equipamentoId === equipId);
    if (existing) {
      existing.quantidade += 1;
    } else {
      structure.itens.push({
        id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
        equipamentoId: equip.id,
        nome: equip.nome,
        quantidade: 1,
        pesoUnitario: equip.peso
      });
    }

    setProjAmbientes(updated);
  };

  // Update item quantity
  const updateStructureItemQty = (ambIdx: number, estIdx: number, itemId: string, qty: number) => {
    if (qty < 1) return;
    const updated = [...projAmbientes];
    const item = updated[ambIdx].estruturas[estIdx].itens.find(i => i.id === itemId);
    if (item) {
      item.quantidade = qty;
    }
    setProjAmbientes(updated);
  };

  // Remove item from structure
  const removeStructureItem = (ambIdx: number, estIdx: number, itemId: string) => {
    const updated = [...projAmbientes];
    updated[ambIdx].estruturas[estIdx].itens = updated[ambIdx].estruturas[estIdx].itens.filter(i => i.id !== itemId);
    setProjAmbientes(updated);
  };

  // Add an empty line/row to a structure
  const addEmptyLineToStructure = (ambIdx: number, estIdx: number) => {
    const updated = [...projAmbientes];
    const structure = updated[ambIdx].estruturas[estIdx];
    structure.itens.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      equipamentoId: '',
      nome: '', // Empty name means custom or unselected
      quantidade: 1,
      pesoUnitario: 0
    });
    setProjAmbientes(updated);
  };

  // Update item name directly
  const updateStructureItemName = (ambIdx: number, estIdx: number, itemId: string, name: string) => {
    const updated = [...projAmbientes];
    const item = updated[ambIdx].estruturas[estIdx].itens.find(i => i.id === itemId);
    if (item) {
      item.nome = name;
    }
    setProjAmbientes(updated);
  };

  // Update item unit weight directly
  const updateStructureItemWeight = (ambIdx: number, estIdx: number, itemId: string, weight: number) => {
    const updated = [...projAmbientes];
    const item = updated[ambIdx].estruturas[estIdx].itens.find(i => i.id === itemId);
    if (item) {
      item.pesoUnitario = weight;
    }
    setProjAmbientes(updated);
  };

  // Calculations for individual structures
  const calculateStructureTotalWeight = (est: DocStructure) => {
    if (!est || !Array.isArray(est.itens)) return 0;
    return est.itens.reduce((sum, item) => sum + ((item.quantidade || 0) * (item.pesoUnitario || 0)), 0);
  };

  const calculateStructureAverageLoad = (est: DocStructure) => {
    if (!est) return 0;
    const totalWeight = calculateStructureTotalWeight(est);
    const pontos = est.pontosFixacao || 0;
    return pontos > 0 ? (totalWeight / pontos) : 0;
  };

  const calculateStructureAverageLoadWithSafety = (est: DocStructure) => {
    return calculateStructureAverageLoad(est) * 1.2;
  };

  // Global Project Calculations
  const calculateProjectTotalWeight = () => {
    if (!projAmbientes || !Array.isArray(projAmbientes)) return 0;
    return projAmbientes.reduce((sum, amb) => {
      if (!amb || !Array.isArray(amb.estruturas)) return sum;
      return sum + amb.estruturas.reduce((sub, est) => sub + calculateStructureTotalWeight(est), 0);
    }, 0);
  };

  const calculateProjectTotalWeightWithSafety = () => {
    return calculateProjectTotalWeight() * 1.2;
  };

  const calculateProjectTotalFixationPoints = () => {
    if (!projAmbientes || !Array.isArray(projAmbientes)) return 0;
    return projAmbientes.reduce((sum, amb) => {
      if (!amb || !Array.isArray(amb.estruturas)) return sum;
      return sum + amb.estruturas.reduce((sub, est) => sub + (est.pontosFixacao || 0), 0);
    }, 0);
  };

  // Save the entire Project
  const handleSaveProjectWorkspace = () => {
    if (!projEvento.trim() || !projResp.trim() || !projCrea.trim() || !projArt.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (Evento, Responsável, CREA e ART).');
      return;
    }

    const docProjId = activeProject ? activeProject.id : 'proj_' + Date.now();
    const newProject: DocProject = {
      id: docProjId,
      evento: projEvento.trim(),
      dataEvento: projData.trim() || 'A definir',
      pesoMaxPonto: parseFloat(projPesoMax) || 100,
      ambientes: projAmbientes,
      materiaisAncoragem: projMateriais,
      responsavel: projResp.trim().toUpperCase(),
      crea: projCrea.trim(),
      art: projArt.trim(),
      dataEmissao: activeProject?.dataEmissao || new Date().toLocaleDateString('pt-BR')
    };

    let updatedProjects = [...projects];
    if (activeProject) {
      updatedProjects = updatedProjects.map(p => p.id === activeProject.id ? newProject : p);
    } else {
      updatedProjects.unshift(newProject);
    }

    handleSaveProjects(updatedProjects);
    setIsWorkspaceOpen(false);
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Filters catalog
  const filteredCatalog = catalog.filter(equip => {
    const matchesSearch = equip.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          equip.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || equip.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Printable Area - Rendered offscreen, only visible during print media */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #section-to-print, #section-to-print * {
              visibility: visible;
            }
            #section-to-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
            }
          }
        `}
      </style>

      {/* Main Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-purple-600" />
            Documentação & ART
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gestão de pesos estruturais e emissão automatizada de Memoriais de Carga e ART.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          {activeSubTab === 'projects' ? (
            <button
              onClick={handleNewProject}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-neutral-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Novo Memorial</span>
            </button>
          ) : (
            <button
              onClick={openAddEquipModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-neutral-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Equipamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="no-print flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => { setActiveSubTab('projects'); setIsWorkspaceOpen(false); }}
          className={`px-5 py-3 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'projects' && !isWorkspaceOpen
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          Memoriais Gerados
        </button>
        <button
          onClick={() => { setActiveSubTab('catalog'); setIsWorkspaceOpen(false); }}
          className={`px-5 py-3 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          Banco de Equipamentos
        </button>
      </div>

      {/* VIEW: CATALOG OF EQUIPMENTS */}
      {activeSubTab === 'catalog' && !isWorkspaceOpen && (
        <div className="no-print space-y-4">
          {/* Filters Area */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-450 dark:text-neutral-450 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome ou categoria..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-600/10 text-purple-600 dark:text-purple-500 border border-purple-500/20'
                      : 'bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900/10 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <FileText className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-300">Nenhum equipamento encontrado</h3>
              <p className="text-xs text-neutral-500 mt-1">Experimente alterar os filtros ou cadastrar um novo item.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 uppercase font-mono tracking-wider">
                      <th className="p-4 font-semibold">Equipamento</th>
                      <th className="p-4 font-semibold">Categoria</th>
                      <th className="p-4 font-semibold text-right">Peso Unitário (kg)</th>
                      <th className="p-4 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                    {filteredCatalog.map(equip => (
                      <tr key={equip.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                        <td className="p-4 font-bold text-sm text-neutral-900 dark:text-neutral-100">{equip.nome}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-semibold text-[10px]">
                            {equip.categoria}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                          {equip.peso.toFixed(1).replace('.', ',')} kg
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditEquipModal(equip)}
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-purple-600 dark:hover:text-purple-500 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(equip.id, 'equip')}
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: PROJECT LIST (MEMORIAIS GERADOS) */}
      {activeSubTab === 'projects' && !isWorkspaceOpen && (
        <div className="no-print space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/10 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <ClipboardList className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-300">Nenhum memorial emitido ainda</h3>
              <p className="text-xs text-neutral-500 mt-1">Crie seu primeiro memorial de carga de estruturas aéreas clicando abaixo.</p>
              <button
                onClick={handleNewProject}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Emitir Novo Memorial
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(proj => {
                const ambientes = proj.ambientes || [];
                // Calculate weight metrics
                const totalWeight = ambientes.reduce((sum, amb) => {
                  const estruturas = amb?.estruturas || [];
                  return sum + estruturas.reduce((sub, est) => {
                    const itens = est?.itens || [];
                    return sub + itens.reduce((iSum, i) => iSum + ((i.quantidade || 0) * (i.pesoUnitario || 0)), 0);
                  }, 0);
                }, 0);

                const totalPoints = ambientes.reduce((sum, amb) => {
                  const estruturas = amb?.estruturas || [];
                  return sum + estruturas.reduce((sub, est) => sub + (est?.pontosFixacao || 0), 0);
                }, 0);

                // Any structure failing weight checks?
                let hasExceededPoints = false;
                ambientes.forEach(amb => {
                  const estruturas = amb?.estruturas || [];
                  estruturas.forEach(est => {
                    const itens = est?.itens || [];
                    const pontos = est?.pontosFixacao || 1;
                    const loadWithSafety = (itens.reduce((s, i) => s + ((i.quantidade || 0) * (i.pesoUnitario || 0)), 0) / pontos) * 1.2;
                    if (loadWithSafety > (proj.pesoMaxPonto || 100)) {
                      hasExceededPoints = true;
                    }
                  });
                });

                return (
                  <div 
                    key={proj.id}
                    className="p-5 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl flex flex-col justify-between hover:border-purple-500 dark:hover:border-purple-600/50 transition-all shadow-xs group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="px-2 py-0.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
                          ART: {proj.art}
                        </div>
                        
                        {hasExceededPoints ? (
                          <span className="flex items-center gap-1 text-red-500 font-bold text-[10px] uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" /> Alerta Sobrecarga
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                            <Check className="w-3.5 h-3.5" /> Seguro
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {proj.evento}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] font-mono border-t border-neutral-150 dark:border-neutral-800 pt-3">
                        <div>
                          <span className="text-neutral-500 block">Data do Evento</span>
                          <span className="text-neutral-800 dark:text-neutral-300 font-bold">{proj.dataEvento}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Carga Total + 20%</span>
                          <span className="text-neutral-800 dark:text-neutral-300 font-bold">{(totalWeight * 1.2).toFixed(1).replace('.', ',')} kg</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Pontos Totais</span>
                          <span className="text-neutral-800 dark:text-neutral-300 font-bold">{totalPoints} pontos</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Engenheiro Resp.</span>
                          <span className="text-neutral-800 dark:text-neutral-300 font-bold truncate block max-w-[120px]" title={proj.responsavel}>
                            {proj.responsavel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-neutral-150 dark:border-neutral-800">
                      <button
                        onClick={() => {
                          handleEditProject(proj);
                          setIsPrintPreviewOpen(true);
                        }}
                        className="flex-1 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-250 dark:border-neutral-750"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Visualizar/Imprimir</span>
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditProject(proj)}
                          className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 dark:hover:border-purple-600/50 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-colors cursor-pointer text-neutral-500 dark:text-neutral-400"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDelete(proj.id, 'project')}
                          className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 rounded-xl transition-colors cursor-pointer text-neutral-500 dark:text-neutral-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: WORKSPACE FOR CREATING & EDITING PROJECT MEMORIAL */}
      {isWorkspaceOpen && (
        <div className="no-print space-y-6">
          {/* Header Action Back */}
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <button
              onClick={() => { setIsWorkspaceOpen(false); setIsPrintPreviewOpen(false); }}
              className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-750 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar aos Memoriais</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setIsPrintPreviewOpen(!isPrintPreviewOpen)}
                className={`px-4 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPrintPreviewOpen 
                    ? 'bg-purple-600 border-purple-500 text-neutral-950' 
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-750 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-100'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>{isPrintPreviewOpen ? 'Voltar ao Editor' : 'Visualizar Impressão'}</span>
              </button>

              <button
                onClick={handleSaveProjectWorkspace}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Memorial</span>
              </button>
            </div>
          </div>

          {/* SPLIT: EDITOR VS PREVIEW */}
          {isPrintPreviewOpen ? (
            /* PRINT PREVIEW SCREEN */
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3 space-y-4">
                <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Pré-visualização do Documento Impresso</h4>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                      Esta é a réplica exata do Memorial de Carga. Clique em "Imprimir Memorial" para exportar em formato PDF vetorizado.
                    </p>
                  </div>
                </div>

                {/* Simulated Document */}
                <div className="bg-white text-neutral-950 p-8 sm:p-12 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-8" id="section-to-print" ref={printAreaRef}>
                  {/* Document Header */}
                  <div className="border border-neutral-950 p-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {/* Stylized Aerial Red Logo */}
                      <div className="font-extrabold text-red-600 text-3xl font-sans tracking-tight">
                        Λerial
                      </div>
                    </div>
                    <div className="text-center flex-1 font-bold font-sans text-lg uppercase tracking-tight pr-6">
                      Memorial de Carga de Estruturas Aéreas
                    </div>
                  </div>

                  {/* General Event Metadata */}
                  <div className="grid grid-cols-3 border border-neutral-950 text-xs font-sans text-center divide-x divide-neutral-950">
                    <div className="flex flex-col">
                      <div className="bg-neutral-200 font-bold py-1 border-b border-neutral-950 uppercase tracking-wider text-[10px]">Evento</div>
                      <div className="p-2 font-bold min-h-[30px] flex items-center justify-center uppercase">{projEvento || 'IMPACTA HUB'}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="bg-neutral-200 font-bold py-1 border-b border-neutral-950 uppercase tracking-wider text-[10px]">Peso máximo por ponto (kg)</div>
                      <div className="p-2 font-bold text-red-600 min-h-[30px] flex items-center justify-center text-sm">{projPesoMax || '100'}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="bg-neutral-200 font-bold py-1 border-b border-neutral-950 uppercase tracking-wider text-[10px]">Data do Evento</div>
                      <div className="p-2 font-bold min-h-[30px] flex items-center justify-center uppercase">{projData || '18/05 a 21/05'}</div>
                    </div>
                  </div>

                  {/* Dynamic Environments & Structures Loop */}
                  {(projAmbientes || []).map((amb, ambIdx) => {
                    const estruturas = amb?.estruturas || [];
                    return (
                      <div key={amb.id || ambIdx} className="space-y-6">
                        {/* Environment Title banner */}
                        <div className="bg-neutral-800 text-white font-extrabold font-sans uppercase text-center py-1.5 text-xs tracking-wider">
                          {amb?.nome || 'AMBIENTE'}
                        </div>

                        {/* Structures in Environment */}
                        {estruturas.map((est, estIdx) => {
                          const totalWeight = calculateStructureTotalWeight(est);
                          const avgLoadWithSafety = calculateStructureAverageLoadWithSafety(est);
                          const isOverloaded = avgLoadWithSafety > parseFloat(projPesoMax || '100');
                          const itens = est?.itens || [];
                          const pontosAncoragem = est?.pontosAncoragem || [];

                          return (
                            <div key={est.id || estIdx} className="grid grid-cols-1 md:grid-cols-5 gap-4 border-b border-neutral-200 pb-5 break-inside-avoid">
                              {/* Left Side: Structure Items table */}
                              <div className="md:col-span-3 space-y-1">
                                {/* Structure Name Header */}
                                <div className="bg-neutral-600 text-white font-bold font-sans text-[11px] uppercase py-1 px-2">
                                  {est?.nome || 'ESTRUTURA'}
                                </div>

                                {/* Calculations Indicators */}
                                <div className="grid grid-cols-2 text-[10px] font-mono border-x border-neutral-400">
                                  <div className="border-r border-b border-neutral-400 p-1 bg-neutral-100 font-bold text-neutral-800 uppercase">
                                    Carga Média por Ponto + 20% Seg.
                                  </div>
                                  <div className={`p-1 border-b border-neutral-400 text-center font-bold font-mono text-[11px] ${isOverloaded ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {avgLoadWithSafety.toFixed(2).replace('.', ',')} kg
                                  </div>
                                  <div className="border-r border-b border-neutral-400 p-1 bg-neutral-100 font-bold text-neutral-800 uppercase">
                                    Qtd de Pontos de Fixação
                                  </div>
                                  <div className="p-1 border-b border-neutral-400 text-center font-bold">
                                    {est?.pontosFixacao || 0}
                                  </div>
                                </div>

                                {/* Items Table */}
                                <table className="w-full text-[10px] font-sans border border-neutral-950 mt-1">
                                  <thead>
                                    <tr className="bg-neutral-200 font-bold uppercase tracking-wider text-[9px] border-b border-neutral-950">
                                      <th className="p-1.5 text-left border-r border-neutral-950">Equipamento</th>
                                      <th className="p-1.5 text-center border-r border-neutral-950">Quant</th>
                                      <th className="p-1.5 text-right border-r border-neutral-950">Peso Unitário</th>
                                      <th className="p-1.5 text-right">Peso Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-300">
                                    {itens.length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className="p-3 text-center text-neutral-500 italic">Nenhum equipamento adicionado</td>
                                      </tr>
                                    ) : (
                                      itens.map(item => (
                                        <tr key={item.id}>
                                          <td className="p-1 px-1.5 border-r border-neutral-300 font-semibold">{item.nome}</td>
                                          <td className="p-1 text-center border-r border-neutral-300">{item.quantidade}</td>
                                          <td className="p-1 text-right border-r border-neutral-300 font-mono">{(item.pesoUnitario || 0).toFixed(1).replace('.', ',')}</td>
                                          <td className="p-1 text-right font-mono font-bold">{((item.quantidade || 0) * (item.pesoUnitario || 0)).toFixed(1).replace('.', ',')}</td>
                                        </tr>
                                      ))
                                    )}
                                    {/* Table Totals Row */}
                                    <tr className="bg-neutral-100 border-t border-neutral-950 font-bold">
                                      <td colSpan={3} className="p-1 text-right uppercase text-[9px] pr-2">Carga Total (kg)</td>
                                      <td className="p-1 text-right text-red-600 font-mono">{totalWeight.toFixed(1).replace('.', ',')}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Right Side: Anchorage Point list */}
                              <div className="md:col-span-2 space-y-1 text-xs">
                                <div className="bg-neutral-600 text-white font-bold font-sans text-[11px] uppercase py-1 px-2 text-center">
                                  Localização de Ancoragem
                                </div>

                                <div className="text-[9px] text-red-600 font-bold uppercase text-center py-1">
                                  Pontos indicados: {pontosAncoragem.map(p => p.ponto).join(', ')}
                                </div>

                                <div className="border border-neutral-950 text-[10px] font-sans">
                                  <div className="grid grid-cols-2 bg-neutral-200 font-bold py-1 px-2 text-center uppercase tracking-wider text-[9px] border-b border-neutral-950">
                                    <div>Ponto</div>
                                    <div>Fixação</div>
                                  </div>
                                  <div className="divide-y divide-neutral-300 max-h-[140px] overflow-y-auto">
                                    {pontosAncoragem.map((pt, ptIdx) => (
                                      <div key={ptIdx} className="grid grid-cols-2 py-0.5 px-2 text-center">
                                        <div className="font-bold border-r border-neutral-300">{pt.ponto}</div>
                                        <div>{pt.fixacao}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Summary Footer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-neutral-950 page-break">
                    {/* Lifting Materials Used info */}
                    <div className="border border-neutral-950 rounded p-4 text-xs space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-[10px] border-b border-neutral-300 pb-1 text-neutral-800">
                        Materiais Utilizados para Ancoragem/Elevação
                      </h4>
                      <p className="font-mono text-neutral-700 whitespace-pre-line leading-relaxed text-[11px]">
                        {projMateriais || 'Não especificado'}
                      </p>
                    </div>

                    {/* Overall Load Summary Totals */}
                    <div className="border border-neutral-950 bg-neutral-50 rounded p-4 text-xs font-sans space-y-2.5">
                      <div className="flex justify-between items-center pb-1.5 border-b border-neutral-300">
                        <span className="uppercase text-[9px] font-bold text-neutral-600">Carga Total do Projeto:</span>
                        <span className="font-mono font-black text-sm">{calculateProjectTotalWeight().toFixed(1).replace('.', ',')} kg</span>
                      </div>
                      <div className="flex justify-between items-center pb-1.5 border-b border-neutral-300">
                        <span className="uppercase text-[9px] font-bold text-neutral-600">Carga Total + 20% Segurança:</span>
                        <span className="font-mono font-black text-sm text-red-600">{calculateProjectTotalWeightWithSafety().toFixed(1).replace('.', ',')} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="uppercase text-[9px] font-bold text-neutral-600">Pontos Aéreos Totais Utilizados:</span>
                        <span className="font-mono font-black text-sm">{calculateProjectTotalFixationPoints()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Legal Signature Block */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-neutral-400">
                    <div className="space-y-1 text-xs">
                      <div><span className="font-bold text-neutral-700">ENGENHEIRO RESPONSÁVEL:</span> <span className="font-extrabold uppercase font-sans">{projResp || 'BRUNO FERREIRA'}</span></div>
                      <div><span className="font-bold text-neutral-700">CREA:</span> <span className="font-bold font-mono text-neutral-800">{projCrea || '5069853410'}</span></div>
                      <div><span className="font-bold text-neutral-700">ART:</span> <span className="font-bold font-mono text-red-600">{projArt || '2620261359111'}</span></div>
                    </div>

                    {/* Realistic Digital Signature box (Gov.br lookalike) */}
                    <div className="border-2 border-neutral-350 p-2.5 rounded-lg flex items-center gap-3 bg-neutral-50/50 max-w-xs text-left shadow-2xs">
                      {/* Logo gov.br stylized icon */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-11 h-11 rounded bg-[#01215C] text-white p-1">
                        <span className="text-[11px] font-black leading-none">gov</span>
                        <span className="text-[10px] font-semibold leading-none text-[#F4A915]">.br</span>
                      </div>
                      
                      <div className="text-[9px] leading-tight font-sans text-neutral-700">
                        <p className="font-black text-neutral-900 uppercase">Documento assinado digitalmente</p>
                        <p className="font-bold mt-0.5">{projResp || 'BRUNO FERREIRA'}</p>
                        <p className="opacity-90 font-mono mt-0.5">Data: {activeProject?.dataEmissao || new Date().toLocaleDateString('pt-BR')} 12:58:22 -0300</p>
                        <p className="text-[8px] text-blue-600 underline font-semibold mt-1">Verifique em https://validar.iti.gov.br</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print preview sidebar controls */}
              <div className="space-y-4">
                <div className="p-5 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Ações de Documento</h3>
                  
                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-neutral-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Memorial / Salvar PDF</span>
                  </button>

                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Para salvar como PDF: na caixa de diálogo de impressão que se abre, selecione "Salvar como PDF" no destino da sua impressora.
                  </p>
                </div>

                <div className="p-5 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Validação de Segurança
                  </h4>
                  <p>
                    O peso máximo por ponto recomendado para este memorial é de <span className="font-bold text-neutral-900 dark:text-neutral-200">{projPesoMax} kg</span>.
                  </p>
                  <p>
                    O sistema aplica uma margem padrão de segurança de <span className="font-bold text-neutral-900 dark:text-neutral-200">+20%</span> no cálculo médio das estruturas para garantia de integridade.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE WORKSPACE EDITOR: STREAMLINED INTERACTIVE ROW-BASED EDITOR */
            <div className="space-y-6 animate-fadeIn">
              {/* Control Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-extrabold text-neutral-950 dark:text-white tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                    <span>Editor do Memorial de Carga</span>
                  </h2>
                  <p className="text-[11px] text-neutral-500">Insira e edite as cargas de forma simples e direta.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsPrintPreviewOpen(true)}
                    className="px-3.5 py-1.5 border border-neutral-250 dark:border-neutral-800 text-neutral-750 dark:text-neutral-300 hover:text-purple-600 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs bg-white dark:bg-neutral-950"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Visualizar Impressão</span>
                  </button>

                  <button
                    onClick={handleSaveProjectWorkspace}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Memorial</span>
                  </button>
                </div>
              </div>

              {/* Step 1: General Info Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">1. Informações Gerais do Evento & Parâmetros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Nome do Evento *</label>
                    <input
                      type="text"
                      value={projEvento}
                      onChange={(e) => setProjEvento(e.target.value)}
                      placeholder="Ex: IMPACTA HUB"
                      className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Data do Evento</label>
                    <input
                      type="text"
                      value={projData}
                      onChange={(e) => setProjData(e.target.value)}
                      placeholder="Ex: 18/05 a 21/05"
                      className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Carga Máxima por Ponto (kg) *</label>
                    <input
                      type="number"
                      value={projPesoMax}
                      onChange={(e) => setProjPesoMax(e.target.value)}
                      placeholder="Ex: 100"
                      className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-red-600 dark:text-red-400 focus:outline-none focus:border-purple-500 font-extrabold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Engineering Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">2. Responsabilidade Técnica (ART)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Engenheiro Responsável *</label>
                    <input
                      type="text"
                      value={projResp}
                      onChange={(e) => setProjResp(e.target.value)}
                      placeholder="Nome do Engenheiro"
                      className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Registro CREA *</label>
                    <input
                      type="text"
                      value={projCrea}
                      onChange={(e) => setProjCrea(e.target.value)}
                      placeholder="Ex: CREA-SP"
                      className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Número da ART *</label>
                    <input
                      type="text"
                      value={projArt}
                      onChange={(e) => setProjArt(e.target.value)}
                      placeholder="Número da ART"
                      className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-red-600 dark:text-red-400 focus:outline-none focus:border-purple-500 font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Equipment & Materials Description */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">3. Equipamentos de Elevação e Rigging (Acessórios)</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Especificação dos Acessórios Utilizados</label>
                  <textarea
                    value={projMateriais}
                    onChange={(e) => setProjMateriais(e.target.value)}
                    rows={2}
                    placeholder="Descreva os materiais utilizados..."
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Active Environment sheets layout */}
              <div className="space-y-4">
                {/* Environment Sheets Tab Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                    {projAmbientes.map((amb, idx) => {
                      const isActive = selectedAmbIndex === idx;
                      return (
                        <div
                          key={amb.id}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                          onClick={() => setSelectedAmbIndex(idx)}
                          onDoubleClick={() => {
                            const newName = prompt('Digite o novo nome para esta guia (Ambiente):', amb.nome);
                            if (newName) renameAmbiente(idx, newName);
                          }}
                          title="Duplo clique para renomear este ambiente"
                        >
                          <span>{amb.nome}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAmbiente(idx);
                            }}
                            className={`p-0.5 rounded-full transition-colors ${isActive ? 'hover:bg-purple-700 text-white/80' : 'hover:bg-neutral-250 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500'}`}
                            title="Excluir Ambiente"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      onClick={addAmbiente}
                      className="px-3.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-250 dark:border-neutral-800 text-purple-600 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white dark:bg-neutral-950 flex items-center gap-1"
                      title="Adicionar Novo Ambiente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Ambiente</span>
                    </button>
                  </div>

                  <button
                    onClick={() => addStructure(selectedAmbIndex)}
                    disabled={!projAmbientes[selectedAmbIndex]}
                    className="px-4 py-1.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 hover:dark:bg-purple-900/60 disabled:opacity-40 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nova Estrutura</span>
                  </button>
                </div>

                {/* Sub-structures list */}
                {(!projAmbientes[selectedAmbIndex] || projAmbientes[selectedAmbIndex].estruturas.length === 0) ? (
                  <div className="border border-dashed border-neutral-250 dark:border-neutral-800 p-12 rounded-2xl text-center text-neutral-400 italic text-xs bg-neutral-50 dark:bg-neutral-900/20">
                    Nenhuma estrutura cadastrada neste ambiente. Clique em "+ Nova Estrutura" para iniciar.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {projAmbientes[selectedAmbIndex].estruturas.map((est, estIdx) => {
                      const totalWeight = calculateStructureTotalWeight(est);
                      const avgLoadWithSafety = calculateStructureAverageLoadWithSafety(est);
                      const isOverloaded = avgLoadWithSafety > parseFloat(projPesoMax || '100');
                      const items = est.itens || [];

                      return (
                        <div key={est.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all">
                          {/* Structure Card Header */}
                          <div className="bg-neutral-50 dark:bg-neutral-950 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider font-mono bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/40">Estrutura</span>
                              <input
                                type="text"
                                value={est.nome}
                                onChange={(e) => {
                                  const updated = [...projAmbientes];
                                  updated[selectedAmbIndex].estruturas[estIdx].nome = e.target.value.toUpperCase();
                                  setProjAmbientes(updated);
                                }}
                                className="bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-800 focus:border-purple-600 font-extrabold text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:bg-white dark:focus:bg-neutral-950 px-1"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500 font-medium">Pontos Fixação:</span>
                                <input
                                  type="number"
                                  value={est.pontosFixacao}
                                  onChange={(e) => updateStructurePoints(selectedAmbIndex, estIdx, parseInt(e.target.value) || 1)}
                                  min={1}
                                  className="w-14 bg-white dark:bg-neutral-950 border border-neutral-255 dark:border-neutral-800 rounded-lg px-2 py-1 text-center font-bold text-xs font-mono text-neutral-800 dark:text-neutral-100 focus:outline-none"
                                />
                              </div>

                              <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 hidden sm:block"></div>

                              <div className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${isOverloaded ? 'bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200 dark:border-red-900/30' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'}`}>
                                <span className="text-[9px] uppercase tracking-wide opacity-80">Média + 20%:</span>
                                <span className="font-mono">{avgLoadWithSafety.toFixed(1).replace('.', ',')} kg/pt</span>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${isOverloaded ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                {isOverloaded ? 'SOBRECARGA' : 'SEGURO'}
                              </span>

                              <button
                                onClick={() => removeStructure(selectedAmbIndex, estIdx)}
                                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                title="Excluir Estrutura"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Items rows representation */}
                          <div className="p-5 bg-neutral-50/25 dark:bg-neutral-950/5 grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left Side: Equipment list (lg:col-span-3) */}
                            <div className="lg:col-span-3 space-y-3">
                              <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">
                                Lista de Equipamentos / Cargas
                              </div>

                              {items.length > 0 && (
                                <div className="grid grid-cols-12 gap-3 px-3 text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                                  <div className="col-span-6">Descrição do Item (Clique para selecionar do Banco)</div>
                                  <div className="col-span-2 text-center">Qtd</div>
                                  <div className="col-span-2 text-right">Peso Unit. (kg)</div>
                                  <div className="col-span-2 text-right pr-8">Peso Total (kg)</div>
                                </div>
                              )}

                              {items.length === 0 ? (
                                <div className="text-center py-6 text-neutral-440 italic text-xs bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                  Nenhum equipamento nesta estrutura. Clique em "+ Adicionar Linha" para inserir.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {items.map((item, itemIdx) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-xl p-2 px-3 shadow-2xs hover:border-purple-200 dark:hover:border-purple-900/40 transition-all">
                                      <div className="col-span-6">
                                        <input
                                          type="text"
                                          value={item.nome}
                                          onChange={(e) => updateStructureItemName(selectedAmbIndex, estIdx, item.id, e.target.value)}
                                          onClick={() => {
                                            setEquipmentSelector({
                                              ambIndex: selectedAmbIndex,
                                              estIndex: estIdx,
                                              itemIdx: itemIdx
                                            });
                                            setEquipmentSearchQuery('');
                                          }}
                                          placeholder="Clique para escolher do banco de equipamentos..."
                                          className="w-full bg-neutral-50 dark:bg-neutral-950/50 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none font-bold cursor-pointer truncate"
                                        />
                                      </div>

                                      <div className="col-span-2 flex justify-center">
                                        <input
                                          type="number"
                                          value={item.quantidade}
                                          onChange={(e) => updateStructureItemQty(selectedAmbIndex, estIdx, item.id, parseInt(e.target.value) || 1)}
                                          min={1}
                                          className="w-16 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1 text-center font-bold text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none"
                                        />
                                      </div>

                                      <div className="col-span-2 text-right">
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={item.pesoUnitario || 0}
                                          onChange={(e) => updateStructureItemWeight(selectedAmbIndex, estIdx, item.id, parseFloat(e.target.value) || 0)}
                                          className="w-20 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-right font-mono font-bold text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none ml-auto"
                                        />
                                      </div>

                                      <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                                        <span className="font-mono font-extrabold text-xs text-purple-600 dark:text-purple-400">
                                          {(item.quantidade * item.pesoUnitario).toFixed(1).replace('.', ',')} kg
                                        </span>

                                        <button
                                          onClick={() => removeStructureItem(selectedAmbIndex, estIdx, item.id)}
                                          className="p-1 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-md transition-all cursor-pointer"
                                          title="Remover linha"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Card sub-actions */}
                              <div className="flex items-center justify-between gap-4 pt-2">
                                <button
                                  onClick={() => addEmptyLineToStructure(selectedAmbIndex, estIdx)}
                                  className="px-4 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold bg-white dark:bg-neutral-900"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>+ Adicionar Linha</span>
                                </button>

                                <span className="text-[11px] font-mono text-neutral-450">
                                  Carga Total Estrutura: <strong className="text-neutral-800 dark:text-neutral-200">{totalWeight.toFixed(1).replace('.', ',')} kg</strong>
                                </span>
                              </div>
                            </div>

                            {/* Right Side: Anchorage Point list (lg:col-span-2) */}
                            <div className="lg:col-span-2 space-y-3 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800/80 pt-4 lg:pt-0 lg:pl-6">
                              <div className="flex items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                <div className="text-[10px] font-black uppercase text-neutral-450 tracking-wider">
                                  Detalhamento de Ancoragem ({est.pontosAncoragem.length} Pontos)
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Nomenclatura:</span>
                                  <input
                                    type="text"
                                    value={est.nomenclaturaPrefix || est.nome.replace('ESTRUTURA ', '').trim() || 'A'}
                                    onChange={(e) => updateStructureNomenclaturePrefix(selectedAmbIndex, estIdx, e.target.value)}
                                    placeholder="Ex: B"
                                    className="w-12 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded px-1.5 py-0.5 text-center text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500 font-mono"
                                    maxLength={3}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {est.pontosAncoragem.map((pt, ptIdx) => (
                                  <div key={ptIdx} className="flex items-center gap-2 bg-white dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 shadow-2xs hover:border-purple-200 dark:hover:border-purple-900/40 transition-all animate-fadeIn">
                                    {/* Point Label / Code Badge */}
                                    <div className="w-10 text-center py-1 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/20 rounded-lg text-xs font-black font-mono text-purple-600 dark:text-purple-400">
                                      {pt.ponto}
                                    </div>
                                    
                                    {/* Input for Fixation description */}
                                    <input
                                      type="text"
                                      value={pt.fixacao}
                                      onChange={(e) => updateAnchoragePoint(selectedAmbIndex, estIdx, ptIdx, e.target.value)}
                                      placeholder="Descrição da fixação (Ex: Talha)"
                                      className="flex-1 bg-transparent text-[11px] font-bold text-neutral-800 dark:text-neutral-100 focus:outline-none px-1"
                                    />

                                    {/* Delete button */}
                                    <button
                                      onClick={() => removeAnchoragePoint(selectedAmbIndex, estIdx, ptIdx)}
                                      className="p-1 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-md transition-all cursor-pointer"
                                      title="Remover ponto de ancoragem"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {est.pontosAncoragem.length === 0 && (
                                  <div className="text-center py-6 text-neutral-400 italic text-xs bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                    Nenhum ponto de ancoragem definido.
                                  </div>
                                )}
                              </div>

                              <div className="pt-2">
                                <button
                                  onClick={() => addAnchoragePoint(selectedAmbIndex, estIdx)}
                                  className="w-full py-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 font-bold bg-white dark:bg-neutral-900"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>+ Adicionar Ponto ({est.nomenclaturaPrefix || est.nome.replace('ESTRUTURA ', '').trim() || 'A'}{(est.pontosAncoragem.length + 1)})</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Consolidation Dashboard */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">4. Consolidação Geral de Cargas do Memorial</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Carga Total do Projeto:</span>
                    <strong className="text-lg font-mono text-neutral-800 dark:text-neutral-100">
                      {calculateProjectTotalWeight().toFixed(1).replace('.', ',')} kg
                    </strong>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Carga com Margem 20% Segurança:</span>
                    <strong className="text-lg font-mono text-red-600 dark:text-red-400">
                      {calculateProjectTotalWeightWithSafety().toFixed(1).replace('.', ',')} kg
                    </strong>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Pontos Fixação Totais:</span>
                    <strong className="text-lg font-mono text-purple-600 dark:text-purple-400">
                      {calculateProjectTotalFixationPoints()} pontos
                    </strong>
                  </div>
                </div>
              </div>

              {/* Guidance note */}
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200">Sincronização Ativa com o Banco</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Clique em qualquer item da lista de estruturas para abrir o banco de equipamentos cadastrados. Os limites de segurança e cargas por pontos são recalculados instantaneamente para garantir que as fixações permaneçam dentro dos limites configurados!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM DELETION MODAL */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar Exclusão
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
              Tem certeza de que deseja excluir permanentemente este item? Esta ação é irreversível e removerá as informações correspondentes do banco de dados.
            </p>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => { setDeleteTargetId(null); setDeleteTargetType(null); }}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white dark:text-neutral-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EQUIPMENT ADD/EDIT DIALOG MODAL */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                {editingEquip ? 'Editar Equipamento' : 'Cadastrar Equipamento'}
              </h3>
              <button
                onClick={() => setIsEquipModalOpen(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-450 hover:text-neutral-900 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Descrição do Equipamento *</label>
                <input
                  type="text"
                  value={equipName}
                  onChange={(e) => setEquipName(e.target.value)}
                  placeholder="Ex: Box Truss Q25 (m)"
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 dark:focus:border-purple-600"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Peso Unitário (kg) *</label>
                <input
                  type="text"
                  value={equipWeight}
                  onChange={(e) => setEquipWeight(e.target.value)}
                  placeholder="Ex: 7.2"
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-purple-500 dark:focus:border-purple-600 font-mono"
                />
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-450 tracking-wider">Categoria</label>
                <select
                  value={equipCategory}
                  onChange={(e) => setEquipCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-300 focus:outline-none focus:border-purple-500 dark:focus:border-purple-600 cursor-pointer"
                >
                  {categories.filter(c => c !== 'Todas').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-neutral-50 dark:bg-neutral-950/20">
              <button
                onClick={() => setIsEquipModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEquip}
                disabled={!equipName.trim() || !equipWeight}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white dark:text-neutral-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
