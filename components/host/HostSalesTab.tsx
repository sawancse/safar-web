'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

/* ── Types ─────────────────────────────────────────────────── */

interface SaleProperty {
  id: string;
  propertyType: string;
  title: string;
  city: string;
  state: string;
  locality: string;
  askingPricePaise: number;
  carpetAreaSqft: number;
  plotAreaSqft: number;
  bhk: number;
  status: string;
  views: number;
  inquiryCount: number;
  photoUrls: string[];
  createdAt: string;
}

interface SaleInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  message: string;
  budgetMinPaise: number;
  budgetMaxPaise: number;
  financingType: string;
  preferredVisitDate: string;
  status: string;
  createdAt: string;
}

interface SiteVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  visitDate: string;
  visitTime: string;
  status: string;
  feedback: string;
  rating: number | null;
  createdAt: string;
}

/* ── Status Colors ─────────────────────────────────────────── */

const PROPERTY_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  PAUSED: 'bg-blue-100 text-blue-700',
  SOLD: 'bg-purple-100 text-purple-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

const INQUIRY_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-orange-100 text-orange-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  VISIT_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  NEGOTIATING: 'bg-yellow-100 text-yellow-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-600',
  DROPPED: 'bg-gray-100 text-gray-600',
};

const VISIT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-gray-100 text-gray-600',
};

/* ── Helper ────────────────────────────────────────────────── */

function formatPriceRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `${(rupees / 100000).toFixed(2)} L`;
  if (rupees >= 1000) return `${(rupees / 1000).toFixed(1)} K`;
  return rupees.toLocaleString('en-IN');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/* ── Main Component ────────────────────────────────────────── */

export default function HostSalesTab({ token }: { token: string }) {
  const [subTab, setSubTab] = useState<'properties' | 'inquiries' | 'visits'>('properties');
  const [properties, setProperties] = useState<SaleProperty[]>([]);
  const [inquiries, setInquiries] = useState<SaleInquiry[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [subTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (subTab === 'properties') {
        const res = await api.getSellerSaleProperties(token);
        setProperties(Array.isArray(res) ? res : res.content || []);
      } else if (subTab === 'inquiries') {
        const res = await api.getSellerInquiries(token);
        setInquiries(Array.isArray(res) ? res : res.content || []);
      } else {
        const res = await api.getSellerSiteVisits(token);
        setVisits(Array.isArray(res) ? res : res.content || []);
      }
    } catch (e) {
      console.error('Failed to load sales data:', e);
    }
    setLoading(false);
  }

  async function handlePropertyAction(id: string, status: string) {
    setActionLoading(id);
    try {
      await api.updateSalePropertyStatus(id, status, token);
      await loadData();
    } catch (e) {
      console.error('Failed to update property status:', e);
    }
    setActionLoading(null);
  }

  async function handleInquiryAction(id: string, status: string) {
    setActionLoading(id);
    try {
      await api.updateInquiryStatus(id, status, token);
      await loadData();
    } catch (e) {
      console.error('Failed to update inquiry status:', e);
    }
    setActionLoading(null);
  }

  async function handleVisitAction(id: string, status: string) {
    setActionLoading(id);
    try {
      await api.updateVisitStatus(id, status, token);
      await loadData();
    } catch (e) {
      console.error('Failed to update visit status:', e);
    }
    setActionLoading(null);
  }

  /* ── Stats ───────────────────────────────────────────────── */

  const totalListed = properties.length;
  const activeCount = properties.filter(p => p.status === 'ACTIVE').length;
  const soldCount = properties.filter(p => p.status === 'SOLD').length;
  const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiryCount || 0), 0);

  /* ── Sub-tab renderers ───────────────────────────────────── */

  function renderProperties() {
    return (
      <div>
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Listed</p>
            <p className="text-2xl font-bold text-gray-800">{totalListed}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Sold</p>
            <p className="text-2xl font-bold text-purple-600">{soldCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-2xl font-bold text-gray-800">{totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Inquiries</p>
            <p className="text-2xl font-bold text-orange-600">{totalInquiries}</p>
          </div>
        </div>

        {/* List New Property Button */}
        <div className="mb-6">
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <span className="text-lg">+</span>
            List New Property
          </Link>
        </div>

        {/* Property Cards */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-gray-500 mb-4">No properties listed for sale yet.</p>
            <Link
              href="/sell"
              className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              List Your First Property
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map(prop => (
              <div key={prop.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Photo */}
                  <div className="w-full md:w-40 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {prop.photoUrls && prop.photoUrls.length > 0 ? (
                      <img src={prop.photoUrls[0]} alt={prop.title || 'Property'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">🏠</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {prop.title || `${prop.bhk} BHK ${prop.propertyType?.replace(/_/g, ' ')}`}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${PROPERTY_STATUS_COLORS[prop.status] || 'bg-gray-100 text-gray-600'}`}>
                        {prop.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {[prop.locality, prop.city, prop.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-lg font-bold text-gray-800 mb-2">
                      ₹{formatPriceRupees(prop.askingPricePaise)}
                      {prop.carpetAreaSqft > 0 && (
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          ({prop.carpetAreaSqft} sq.ft)
                        </span>
                      )}
                      {prop.plotAreaSqft > 0 && (
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          ({prop.plotAreaSqft} sq.ft plot)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{prop.views || 0} views</span>
                      <span>{prop.inquiryCount || 0} inquiries</span>
                      <span>Listed {formatDate(prop.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/sell?edit=${prop.id}`}
                      className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 text-center transition-colors"
                    >
                      Edit
                    </Link>
                    {prop.status === 'ACTIVE' && (
                      <button
                        onClick={() => handlePropertyAction(prop.id, 'SOLD')}
                        disabled={actionLoading === prop.id}
                        className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === prop.id ? '...' : 'Mark Sold'}
                      </button>
                    )}
                    {prop.status === 'ACTIVE' && (
                      <button
                        onClick={() => handlePropertyAction(prop.id, 'PAUSED')}
                        disabled={actionLoading === prop.id}
                        className="px-4 py-2 border border-blue-300 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === prop.id ? '...' : 'Pause'}
                      </button>
                    )}
                    {prop.status === 'PAUSED' && (
                      <button
                        onClick={() => handlePropertyAction(prop.id, 'ACTIVE')}
                        disabled={actionLoading === prop.id}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === prop.id ? '...' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderInquiries() {
    if (loading) return <div className="text-center py-12 text-gray-500">Loading inquiries...</div>;

    if (inquiries.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📩</div>
          <p className="text-gray-500">No inquiries yet. Inquiries from interested buyers will appear here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {inquiries.map(inq => (
          <div key={inq.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{inq.buyerName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INQUIRY_STATUS_COLORS[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                    {inq.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Property: <span className="text-gray-700 font-medium">{inq.propertyTitle}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(inq.createdAt)}</span>
            </div>

            {inq.message && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700">{inq.message}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {(inq.budgetMinPaise || inq.budgetMaxPaise) && (
                <span>
                  Budget: ₹{inq.budgetMinPaise ? formatPriceRupees(inq.budgetMinPaise) : '0'} - ₹{inq.budgetMaxPaise ? formatPriceRupees(inq.budgetMaxPaise) : 'N/A'}
                </span>
              )}
              {inq.financingType && (
                <span>Financing: {inq.financingType.replace(/_/g, ' ')}</span>
              )}
              {inq.preferredVisitDate && (
                <span>Visit: {formatDate(inq.preferredVisitDate)}</span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {(inq.status === 'NEW' || inq.status === 'CONTACTED') && (
                <button
                  onClick={() => handleInquiryAction(inq.id, 'VISIT_SCHEDULED')}
                  disabled={actionLoading === inq.id}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === inq.id ? '...' : 'Schedule Visit'}
                </button>
              )}
              {inq.status === 'NEW' && (
                <button
                  onClick={() => handleInquiryAction(inq.id, 'CONTACTED')}
                  disabled={actionLoading === inq.id}
                  className="px-4 py-2 border border-blue-300 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === inq.id ? '...' : 'Reply'}
                </button>
              )}
              {inq.status !== 'DROPPED' && inq.status !== 'CLOSED_WON' && inq.status !== 'CLOSED_LOST' && (
                <button
                  onClick={() => handleInquiryAction(inq.id, 'DROPPED')}
                  disabled={actionLoading === inq.id}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === inq.id ? '...' : 'Drop'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderVisits() {
    if (loading) return <div className="text-center py-12 text-gray-500">Loading site visits...</div>;

    if (visits.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500">No site visits scheduled. Schedule visits from the Inquiries tab.</p>
        </div>
      );
    }

    const now = new Date();
    const upcoming = visits.filter(v => v.status === 'SCHEDULED' || v.status === 'CONFIRMED');
    const past = visits.filter(v => v.status === 'COMPLETED' || v.status === 'CANCELLED' || v.status === 'NO_SHOW');

    return (
      <div className="space-y-8">
        {/* Upcoming Visits */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Upcoming Visits ({upcoming.length})</h3>
          {upcoming.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
              No upcoming visits scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(visit => (
                <div key={visit.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{visit.buyerName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VISIT_STATUS_COLORS[visit.status] || 'bg-gray-100 text-gray-600'}`}>
                          {visit.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        Property: <span className="text-gray-700 font-medium">{visit.propertyTitle}</span>
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">{formatDate(visit.visitDate)}</span>
                        {visit.visitTime && <span>{visit.visitTime}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {visit.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleVisitAction(visit.id, 'CONFIRMED')}
                          disabled={actionLoading === visit.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === visit.id ? '...' : 'Confirm'}
                        </button>
                      )}
                      {(visit.status === 'SCHEDULED' || visit.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleVisitAction(visit.id, 'CANCELLED')}
                          disabled={actionLoading === visit.id}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === visit.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Visits */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Past Visits ({past.length})</h3>
          {past.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
              No past visits yet.
            </div>
          ) : (
            <div className="space-y-3">
              {past.map(visit => (
                <div key={visit.id} className="bg-white rounded-xl border p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{visit.buyerName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VISIT_STATUS_COLORS[visit.status] || 'bg-gray-100 text-gray-600'}`}>
                          {visit.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        Property: <span className="text-gray-700 font-medium">{visit.propertyTitle}</span>
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(visit.visitDate)} {visit.visitTime || ''}</p>
                    </div>
                    {visit.rating !== null && visit.rating !== undefined && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`text-lg ${star <= visit.rating! ? 'text-orange-400' : 'text-gray-200'}`}>
                              &#9733;
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {visit.feedback && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Feedback</p>
                      <p className="text-sm text-gray-700">{visit.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md">
        <button
          onClick={() => setSubTab('properties')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'properties' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Properties
        </button>
        <button
          onClick={() => setSubTab('inquiries')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'inquiries' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Inquiries
        </button>
        <button
          onClick={() => setSubTab('visits')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'visits' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Site Visits
        </button>
      </div>

      {/* Content */}
      {subTab === 'properties' && renderProperties()}
      {subTab === 'inquiries' && renderInquiries()}
      {subTab === 'visits' && renderVisits()}
    </div>
  );
}