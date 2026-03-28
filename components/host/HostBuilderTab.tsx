'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

/* ── Price formatter (paise → Lakh/Cr) ── */
function formatSalePrice(paise: number): string {
  const inr = paise / 100;
  if (inr >= 10000000) {
    const cr = inr / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const lakh = inr / 100000;
  return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} Lakh`;
}

interface BuilderProject {
  id: string;
  projectName: string;
  builderName: string;
  city: string;
  locality?: string;
  projectStatus: string;
  constructionProgress: number;
  totalUnits?: number;
  availableUnits?: number;
  minPricePaise: number;
  maxPricePaise: number;
  primaryPhotoUrl?: string;
  totalInquiries?: number;
  totalViews?: number;
  createdAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-purple-100 text-purple-700',
  UNDER_CONSTRUCTION: 'bg-blue-100 text-blue-700',
  READY_TO_MOVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
};

export default function HostBuilderTab() {
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [loading, setLoading] = useState(true);

  /* Construction Update Modal */
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateProjectId, setUpdateProjectId] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateProgress, setUpdateProgress] = useState('');
  const [updatePhotos, setUpdatePhotos] = useState<string[]>([]);
  const [updateSending, setUpdateSending] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await api.getMyBuilderProjects(token);
      setProjects(res || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(projectId: string) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await api.publishBuilderProject(projectId, token);
      fetchProjects();
    } catch {
      alert('Failed to publish project.');
    }
  }

  function openUpdateModal(projectId: string) {
    setUpdateProjectId(projectId);
    setUpdateTitle('');
    setUpdateDescription('');
    setUpdateProgress('');
    setUpdatePhotos([]);
    setUpdateSuccess(false);
    setShowUpdateModal(true);
  }

  function handleUpdatePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const previews = files.map(f => URL.createObjectURL(f));
    setUpdatePhotos(prev => [...prev, ...previews]);
  }

  async function handleSubmitUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdateSending(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await api.addConstructionUpdate(updateProjectId, {
        title: updateTitle,
        description: updateDescription || undefined,
        progressPercent: updateProgress ? Number(updateProgress) : undefined,
        photoUrls: updatePhotos.length > 0 ? updatePhotos : undefined,
      }, token);
      setUpdateSuccess(true);
      fetchProjects();
    } catch {
      alert('Failed to post construction update.');
    } finally {
      setUpdateSending(false);
    }
  }

  /* Aggregate stats */
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.projectStatus !== 'DRAFT').length;
  const totalAvailableUnits = projects.reduce((sum, p) => sum + (p.availableUnits || 0), 0);
  const totalInquiries = projects.reduce((sum, p) => sum + (p.totalInquiries || 0), 0);
  const totalViews = projects.reduce((sum, p) => sum + (p.totalViews || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Projects', value: totalProjects, icon: '🏗️', color: 'from-orange-50 to-orange-100 border-orange-200' },
          { label: 'Active', value: activeProjects, icon: '✅', color: 'from-green-50 to-green-100 border-green-200' },
          { label: 'Units Available', value: totalAvailableUnits, icon: '🏠', color: 'from-blue-50 to-blue-100 border-blue-200' },
          { label: 'Total Inquiries', value: totalInquiries, icon: '📩', color: 'from-purple-50 to-purple-100 border-purple-200' },
          { label: 'Total Views', value: totalViews, icon: '👁️', color: 'from-amber-50 to-amber-100 border-amber-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-xl p-4 text-center`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Builder Projects</h2>
        <Link
          href="/builder/new-project"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-4">🏗️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first builder project and start selling units.</p>
          <Link
            href="/builder/new-project"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Create New Project
          </Link>
        </div>
      )}

      {/* ── Project Cards ── */}
      {!loading && projects.length > 0 && (
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row">
                {/* Photo */}
                <div className="sm:w-40 h-32 sm:h-auto bg-gray-100 flex-shrink-0">
                  {project.primaryPhotoUrl ? (
                    <img src={project.primaryPhotoUrl} alt={project.projectName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[8rem]">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                      <p className="text-xs text-gray-500">{[project.locality, project.city].filter(Boolean).join(', ')}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {project.projectStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Unit Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="font-medium text-orange-600">
                      {formatSalePrice(project.minPricePaise)} - {formatSalePrice(project.maxPricePaise)}
                    </span>
                    {project.totalUnits && (
                      <span>
                        <span className="font-semibold text-green-600">{project.availableUnits || 0}</span>/{project.totalUnits} available
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Construction Progress</span>
                      <span className="text-xs font-semibold text-orange-600">{project.constructionProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.constructionProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/builder/new-project?edit=${project.id}`}
                      className="px-3 py-1.5 text-xs font-medium border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => openUpdateModal(project.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Construction Update
                    </button>
                    {project.projectStatus === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(project.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Construction Update Modal ── */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { if (!updateSending) setShowUpdateModal(false); }}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Post Construction Update</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            {updateSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <h4 className="font-semibold text-gray-900 mb-1">Update Posted!</h4>
                <p className="text-sm text-gray-500 mb-4">Your construction update has been published.</p>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-orange-500 font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Update Title *</label>
                  <input
                    type="text"
                    required
                    value={updateTitle}
                    onChange={e => setUpdateTitle(e.target.value)}
                    placeholder="e.g. Plinth work completed for Tower A"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={updateDescription}
                    onChange={e => setUpdateDescription(e.target.value)}
                    placeholder="Describe the progress in detail..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Updated Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={updateProgress}
                    onChange={e => setUpdateProgress(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Photos</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {updatePhotos.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => setUpdatePhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-xs flex items-center justify-center"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer text-sm text-orange-500 hover:text-orange-600 font-medium">
                    + Add Photos
                    <input type="file" accept="image/*" multiple onChange={handleUpdatePhotosChange} className="hidden" />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={updateSending || !updateTitle.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {updateSending ? 'Posting...' : 'Post Update'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
