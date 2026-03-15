import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FolderKanban,
  Target,
  Calendar,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateId, cn } from '../lib/utils';
import type { Project, CustomPhase } from '../types';

// Default phase templates
const phaseTemplates = [
  {
    id: 'product',
    name: 'Producto Fisico',
    description: 'Para productos manufacturados',
    phases: [
      { name: 'Idea', icon: '💡', color: '#9333ea', order: 0 },
      { name: 'Diseño', icon: '✏️', color: '#3b82f6', order: 1 },
      { name: 'Prototipo', icon: '🔧', color: '#f59e0b', order: 2 },
      { name: 'Produccion', icon: '🏭', color: '#10b981', order: 3 },
      { name: 'Ventas', icon: '🛒', color: '#22c55e', order: 4 },
    ]
  },
  {
    id: 'service',
    name: 'Servicio',
    description: 'Para servicios y consultoria',
    phases: [
      { name: 'Cotizacion', icon: '📝', color: '#6366f1', order: 0 },
      { name: 'Negociacion', icon: '🤝', color: '#8b5cf6', order: 1 },
      { name: 'Ejecucion', icon: '⚡', color: '#f59e0b', order: 2 },
      { name: 'Entrega', icon: '📦', color: '#10b981', order: 3 },
      { name: 'Cobro', icon: '💰', color: '#22c55e', order: 4 },
    ]
  },
  {
    id: 'digital',
    name: 'Producto Digital',
    description: 'Para software, diseños, contenido',
    phases: [
      { name: 'Investigacion', icon: '🔍', color: '#6366f1', order: 0 },
      { name: 'Diseño', icon: '🎨', color: '#3b82f6', order: 1 },
      { name: 'Desarrollo', icon: '💻', color: '#f59e0b', order: 2 },
      { name: 'Pruebas', icon: '🧪', color: '#10b981', order: 3 },
      { name: 'Lanzamiento', icon: '🚀', color: '#22c55e', order: 4 },
    ]
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Crea tus propias fases',
    phases: [
      { name: 'Fase 1', icon: '1️⃣', color: '#6366f1', order: 0 },
      { name: 'Fase 2', icon: '2️⃣', color: '#3b82f6', order: 1 },
      { name: 'Fase 3', icon: '3️⃣', color: '#22c55e', order: 2 },
    ]
  },
];

// Available icons for phases
const phaseIcons = ['💡', '✏️', '🔧', '🏭', '🛒', '📝', '🤝', '⚡', '📦', '💰', '🔍', '🎨', '💻', '🧪', '🚀', '✂️', '🧵', '👜', '📸', '✅', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

// Available colors for phases
const phaseColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
];

// Color options for project
const projectColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

// Icon options for project
const projectIcons = ['📦', '🎨', '✂️', '🧵', '👜', '🛍️', '📱', '💻', '🔧', '🏠', '🚗', '📸', '🎬', '📝', '💡', '🎯'];

export function NewProject() {
  const navigate = useNavigate();
  const { addProject } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: projectColors[Math.floor(Math.random() * projectColors.length)],
    icon: '📦',
    expectedIncome: 0,
    targetDate: '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState('product');
  const [phases, setPhases] = useState<Omit<CustomPhase, 'id'>[]>(phaseTemplates[0].phases);
  const [showPhaseEditor, setShowPhaseEditor] = useState(false);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    const template = phaseTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPhases([...template.phases]);
    }
  };

  const handleAddPhase = () => {
    const newPhase = {
      name: `Fase ${phases.length + 1}`,
      icon: '📌',
      color: phaseColors[phases.length % phaseColors.length],
      order: phases.length,
    };
    setPhases([...phases, newPhase]);
  };

  const handleRemovePhase = (index: number) => {
    if (phases.length > 2) {
      const newPhases = phases.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i }));
      setPhases(newPhases);
    }
  };

  const handlePhaseChange = (index: number, field: keyof Omit<CustomPhase, 'id' | 'order'>, value: string) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const movePhase = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newPhases = [...phases];
      [newPhases[index - 1], newPhases[index]] = [newPhases[index], newPhases[index - 1]];
      newPhases.forEach((p, i) => p.order = i);
      setPhases(newPhases);
    } else if (direction === 'down' && index < phases.length - 1) {
      const newPhases = [...phases];
      [newPhases[index], newPhases[index + 1]] = [newPhases[index + 1], newPhases[index]];
      newPhases.forEach((p, i) => p.order = i);
      setPhases(newPhases);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const projectPhases: CustomPhase[] = phases.map((p, i) => ({
      ...p,
      id: generateId(),
      order: i,
    }));

    const newProject: Project = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      phases: projectPhases,
      currentPhaseId: projectPhases[0].id,
      status: 'active',
      expectedIncome: formData.expectedIncome,
      actualIncome: 0,
      totalCosts: 0,
      totalMinutes: 0,
      targetDate: formData.targetDate || undefined,
      createdAt: now as any,
      updatedAt: now as any,
    };

    addProject(newProject);
    navigate('/projects');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
          <p className="text-gray-500">Crea un proyecto con fases personalizadas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <FolderKanban className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Informacion del Proyecto</h2>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              placeholder="Ej: Bolsas de Manta para Publicidad"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripcion
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input min-h-[80px]"
              placeholder="Describe el proyecto, objetivos, productos/servicios..."
            />
          </div>

          {/* Icon and Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
              <div className="flex flex-wrap gap-1">
                {projectIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={cn(
                      'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                      formData.icon === icon ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-1">
                {projectColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all',
                      formData.color === color && 'ring-2 ring-offset-2 ring-gray-400'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phase Templates */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Plantilla de Fases</h2>
          <p className="text-sm text-gray-500">Selecciona una plantilla o personaliza las fases</p>

          <div className="grid grid-cols-2 gap-3">
            {phaseTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  selectedTemplate === template.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className="font-medium text-gray-900">{template.name}</p>
                <p className="text-xs text-gray-500">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Phase Editor */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Fases del Proyecto</h2>
            <button
              type="button"
              onClick={() => setShowPhaseEditor(!showPhaseEditor)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showPhaseEditor ? 'Ocultar editor' : 'Personalizar'}
            </button>
          </div>

          {/* Phase Preview */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{ backgroundColor: `${phase.color}20`, color: phase.color }}
                >
                  <span>{phase.icon}</span>
                  <span>{phase.name}</span>
                </div>
                {index < phases.length - 1 && (
                  <div className="w-6 h-0.5 bg-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* Detailed Phase Editor */}
          {showPhaseEditor && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {phases.map((phase, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Order controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => movePhase(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhase(index, 'down')}
                      disabled={index === phases.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Phase number */}
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                    {index + 1}
                  </div>

                  {/* Icon selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEditingPhaseIndex(editingPhaseIndex === index ? null : index)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${phase.color}20` }}
                    >
                      {phase.icon}
                    </button>
                    {editingPhaseIndex === index && (
                      <div className="absolute top-12 left-0 bg-white shadow-lg rounded-lg p-2 z-10 grid grid-cols-5 gap-1">
                        {phaseIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => {
                              handlePhaseChange(index, 'icon', icon);
                              setEditingPhaseIndex(null);
                            }}
                            className="w-8 h-8 rounded hover:bg-gray-100 text-lg"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Nombre de la fase"
                  />

                  {/* Color selector */}
                  <div className="flex gap-1">
                    {phaseColors.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handlePhaseChange(index, 'color', color)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-all',
                          phase.color === color && 'ring-2 ring-offset-1 ring-gray-400'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhase(index)}
                    disabled={phases.length <= 2}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-500 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Add phase button */}
              <button
                type="button"
                onClick={handleAddPhase}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Agregar fase
              </button>
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Objetivos</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingreso esperado (mensual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.expectedIncome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedIncome: parseFloat(e.target.value) || 0 }))}
                  className="input pl-7"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha objetivo
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card bg-gray-50">
          <p className="text-sm font-medium text-gray-500 mb-3">Vista previa:</p>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${formData.color}20` }}
            >
              {formData.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{formData.name || 'Nombre del proyecto'}</p>
              <p className="text-sm text-gray-500">{phases.length} fases configuradas</p>
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center">
                <span
                  className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                  style={{ backgroundColor: `${phase.color}20`, color: phase.color }}
                >
                  {phase.icon} {phase.name}
                </span>
                {index < phases.length - 1 && (
                  <span className="mx-1 text-gray-300">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!formData.name || phases.length < 2}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            Crear Proyecto
          </button>
        </div>
      </form>
    </div>
  );
}
