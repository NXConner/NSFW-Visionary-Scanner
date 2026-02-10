// Medication Panel Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pill, Clock, Check, X, Bell, Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { getMedicationTracker, Medication, MedicationStats } from '@/lib/healthTracking/MedicationTracker';
import { cn } from '@/lib/utils';

interface MedicationPanelProps {
  className?: string;
}

export const MedicationPanel: React.FC<MedicationPanelProps> = ({ className }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const tracker = getMedicationTracker();

  useEffect(() => {
    setMedications(tracker.getAll());
    setStats(tracker.getStats());
    return tracker.subscribe((meds) => {
      setMedications(meds);
      setStats(tracker.getStats());
    });
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as Medication['frequency'],
    notes: ''
  });

  const handleAdd = () => {
    if (!formData.name || !formData.dosage) return;
    tracker.add({
      ...formData,
      startDate: new Date().toISOString(),
      reminders: [{ id: crypto.randomUUID(), time: '09:00', days: [0,1,2,3,4,5,6], enabled: true, soundEnabled: true, vibrationEnabled: true }],
      isActive: true
    });
    setFormData({ name: '', dosage: '', frequency: 'daily', notes: '' });
    setShowAddForm(false);
  };

  const handleLogDose = (medId: string, status: 'taken' | 'skipped') => {
    tracker.logDose(medId, status);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this medication?')) tracker.delete(id);
  };

  return (
    <div className={cn('p-4 space-y-6', className)}>
      {/* Stats Overview */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{stats.activeMedications}</div>
            <div className="text-xs text-gray-400">Active Medications</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{stats.adherenceRate}%</div>
            <div className="text-xs text-gray-400">Adherence Rate</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
            <div className="text-2xl font-bold text-purple-400">{stats.streakDays}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
            <div className="text-2xl font-bold text-amber-400">{stats.missedDoses}</div>
            <div className="text-xs text-gray-400">Missed (30d)</div>
          </div>
        </motion.div>
      )}

      {/* Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-400" /> Medications
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-3"
          >
            <input
              type="text"
              placeholder="Medication name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Dosage (e.g., 10mg)"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Medication['frequency'] })}
                className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="twice_daily">Twice Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as_needed">As Needed</option>
              </select>
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none h-20"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medication List */}
      <div className="space-y-3">
        {medications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No medications added yet</p>
          </div>
        ) : (
          medications.map((med) => (
            <motion.div
              key={med.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'bg-gray-800/50 rounded-xl p-4 border transition-all',
                med.isActive ? 'border-gray-700 hover:border-blue-500/50' : 'border-gray-800 opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    {med.name}
                    {!med.isActive && <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">Inactive</span>}
                  </h4>
                  <p className="text-sm text-gray-400">{med.dosage} • {med.frequency.replace('_', ' ')}</p>
                  {med.notes && <p className="text-xs text-gray-500 mt-1">{med.notes}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleLogDose(med.id, 'taken')} className="p-2 hover:bg-green-500/20 rounded-lg text-green-400" title="Mark as taken">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleLogDose(med.id, 'skipped')} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400" title="Mark as skipped">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(med.id)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Recent logs */}
              {med.logs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Last: {new Date(med.logs[med.logs.length - 1].timestamp).toLocaleString()} - 
                    <span className={med.logs[med.logs.length - 1].status === 'taken' ? 'text-green-400' : 'text-red-400'}>
                      {med.logs[med.logs.length - 1].status}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicationPanel;
