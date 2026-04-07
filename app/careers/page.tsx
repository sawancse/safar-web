'use client';

import { useState } from 'react';

const DEPARTMENTS = [
  { key: 'all', label: 'All Departments' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'sales', label: 'Sales & Marketing' },
  { key: 'design', label: 'Design' },
  { key: 'operations', label: 'Operations' },
];

const JOBS = [
  { role: 'Full-Stack Engineer', team: 'Engineering', dept: 'engineering', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '2-5 years',
    desc: 'Build and ship features across our Java/Spring Boot backend and Next.js frontend. Own services end-to-end.' },
  { role: 'Mobile Developer (React Native)', team: 'Engineering', dept: 'engineering', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '2-4 years',
    desc: 'Build our Expo/React Native mobile app used by thousands of travellers and hosts across India.' },
  { role: 'DevOps Engineer', team: 'Infrastructure', dept: 'engineering', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '3-6 years',
    desc: 'Manage AWS ECS, Terraform, Docker, CI/CD pipelines. Keep 12 microservices running smoothly.' },
  { role: 'AI/ML Engineer', team: 'Engineering', dept: 'engineering', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '2-5 years',
    desc: 'Build AI-powered pricing, smart search, and recommendation systems using Python/FastAPI.' },
  { role: 'Sales Manager — Host Acquisition', team: 'Sales', dept: 'sales', loc: 'Hyderabad / Mumbai / Bangalore', type: 'Full-time', exp: '3-6 years',
    desc: 'Drive host onboarding across key Indian cities. Build relationships with property owners, PG operators, and hotel chains.' },
  { role: 'Business Development Executive', team: 'Sales', dept: 'sales', loc: 'Pan-India (Field)', type: 'Full-time', exp: '1-3 years',
    desc: 'On-ground sales to onboard PGs, hotels, and homestays. Meet targets, conduct property visits, and close deals.' },
  { role: 'Digital Marketing Manager', team: 'Marketing', dept: 'sales', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '3-5 years',
    desc: 'Own SEO, SEM, social media, and performance marketing. Drive organic traffic and paid acquisition for Safar.' },
  { role: 'Content & Social Media Lead', team: 'Marketing', dept: 'sales', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '2-4 years',
    desc: 'Create compelling travel content, manage Instagram/YouTube, build the Safar brand story across India.' },
  { role: 'Partnership Manager — Builder & VAS', team: 'Sales', dept: 'sales', loc: 'Hyderabad / Mumbai', type: 'Full-time', exp: '3-6 years',
    desc: 'Forge partnerships with builders, banks, legal firms, and interior designers for our value-added services.' },
  { role: 'Growth Marketing Analyst', team: 'Marketing', dept: 'sales', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '1-3 years',
    desc: 'Analyze user funnels, run A/B tests, optimize conversion rates. Work with GA4, Mixpanel, and SQL.' },
  { role: 'Product Designer', team: 'Design', dept: 'design', loc: 'Hyderabad / Remote', type: 'Full-time', exp: '2-5 years',
    desc: 'Design intuitive UX for web and mobile. Create flows for booking, hosting, and property management.' },
  { role: 'Customer Success Lead', team: 'Operations', dept: 'operations', loc: 'Hyderabad', type: 'Full-time', exp: '2-4 years',
    desc: 'Support hosts and guests. Handle escalations, improve CSAT scores, and build help center content.' },
  { role: 'City Launch Manager', team: 'Operations', dept: 'operations', loc: 'New Cities (Relocate)', type: 'Full-time', exp: '3-5 years',
    desc: 'Launch Safar in new Indian cities. Set up local supply, partnerships, and go-to-market strategy.' },
];

const TECH_STACK = ['Java 17', 'Spring Boot', 'Next.js 14', 'React Native', 'PostgreSQL', 'Elasticsearch', 'Redis', 'Kafka', 'AWS ECS', 'Python/FastAPI', 'Terraform', 'Docker'];

const PERKS = [
  { icon: '💰', title: 'Competitive Pay', desc: 'Market-leading salary + ESOPs for early joiners' },
  { icon: '🏠', title: 'Remote Friendly', desc: 'Work from anywhere in India for most roles' },
  { icon: '🏥', title: 'Health Insurance', desc: 'Comprehensive cover for you and your family' },
  { icon: '📚', title: 'Learning Budget', desc: '₹50K/year for courses, conferences, and books' },
  { icon: '✈️', title: 'Travel Credits', desc: 'Free Safar stays for team offsites and personal travel' },
  { icon: '🚀', title: 'Fast Growth', desc: 'Early-stage startup with massive India TAM' },
];

export default function CareersPage() {
  const [deptFilter, setDeptFilter] = useState('all');
  const [applyJob, setApplyJob] = useState<typeof JOBS[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', linkedin: '', experience: '', coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredJobs = deptFilter === 'all' ? JOBS : JOBS.filter(j => j.dept === deptFilter);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  }

  function resetForm() {
    setApplyJob(null);
    setSubmitted(false);
    setFormData({ name: '', email: '', phone: '', linkedin: '', experience: '', coverLetter: '' });
    setResumeFile(null);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#003B95] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            We're hiring across India
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Build the future of travel
            <br />
            <span className="text-[#FFB700]">with Safar</span>
          </h1>
          <p className="mt-4 text-white/70 text-lg max-w-2xl">
            Join India's first zero-commission stay platform. We're looking for passionate people
            in engineering, sales, marketing, design, and operations.
          </p>
          <div className="flex items-center gap-6 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold">{JOBS.length}</p>
              <p className="text-xs text-white/60">Open Roles</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">50+</p>
              <p className="text-xs text-white/60">Cities</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-white/60">Microservices</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* Perks */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why join Safar?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PERKS.map(p => (
              <div key={p.title} className="border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-[#003B95]/20 transition">
                <span className="text-2xl">{p.icon}</span>
                <h3 className="font-bold text-gray-900 mt-2 text-sm">{p.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map(t => (
              <span key={t} className="px-3 py-1.5 bg-blue-50 text-[#003B95] rounded-full text-sm font-medium">{t}</span>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
            <span className="text-sm text-gray-500">{filteredJobs.length} role{filteredJobs.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Department filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {DEPARTMENTS.map(d => (
              <button key={d.key} onClick={() => setDeptFilter(d.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  deptFilter === d.key
                    ? 'bg-[#003B95] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {d.label}
              </button>
            ))}
          </div>

          {/* Job cards */}
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <div key={job.role} className="border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-[#003B95]/20 transition group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 group-hover:text-[#003B95] transition">{job.role}</h3>
                      {job.dept === 'sales' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">New</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span>{job.team}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{job.loc}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{job.type}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{job.exp}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{job.desc}</p>
                  </div>
                  <button onClick={() => { setApplyJob(job); setSubmitted(false); }}
                    className="shrink-0 px-5 py-2.5 bg-[#003B95] text-white rounded-lg text-sm font-medium hover:bg-[#00296b] transition">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open application */}
        <section className="bg-blue-50 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium">Don't see your role?</p>
          <p className="text-sm text-gray-500 mt-1">
            Send your resume to{' '}
            <a href="mailto:careers@ysafar.com" className="text-[#003B95] font-medium hover:underline">careers@ysafar.com</a>
            {' '}— we're always looking for talented people.
          </p>
        </section>
      </div>

      {/* ── Apply Modal ── */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => resetForm()}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="bg-[#003B95] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Apply for</p>
                  <h3 className="text-lg font-bold mt-1">{applyJob.role}</h3>
                  <p className="text-sm text-white/70 mt-0.5">{applyJob.team} &middot; {applyJob.loc}</p>
                </div>
                <button onClick={resetForm} className="text-white/60 hover:text-white text-2xl leading-none">&times;</button>
              </div>
            </div>

            {submitted ? (
              /* Success state */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Application Submitted!</h4>
                <p className="text-sm text-gray-500 mt-2">
                  Thank you for applying for <strong>{applyJob.role}</strong>.
                  Our team will review your application and get back to you within 5 business days.
                </p>
                <button onClick={resetForm}
                  className="mt-6 px-6 py-2.5 bg-[#003B95] text-white rounded-lg text-sm font-medium hover:bg-[#00296b] transition">
                  Close
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleApply} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" required value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95]"
                      placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input type="tel" required value={formData.phone}
                      onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95]"
                      placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95]"
                    placeholder="you@email.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                  <input type="url" value={formData.linkedin}
                    onChange={e => setFormData(f => ({ ...f, linkedin: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95]"
                    placeholder="https://linkedin.com/in/..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                  <input type="text" required value={formData.experience}
                    onChange={e => setFormData(f => ({ ...f, experience: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95]"
                    placeholder="e.g. 3 years" />
                </div>

                {/* Resume upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume / CV *</label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                    resumeFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#003B95]/40'
                  }`}>
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">{resumeFile.name}</span>
                        <button type="button" onClick={() => setResumeFile(null)} className="text-gray-400 hover:text-red-500 ml-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500">
                          <span className="text-[#003B95] font-medium">Click to upload</span> or drag & drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx"
                          onChange={e => { if (e.target.files?.[0]) setResumeFile(e.target.files[0]); }} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter / Why Safar?</label>
                  <textarea value={formData.coverLetter}
                    onChange={e => setFormData(f => ({ ...f, coverLetter: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95] resize-none"
                    placeholder="Tell us why you'd be a great fit..." />
                </div>

                <button type="submit"
                  disabled={submitting || !formData.name || !formData.email || !formData.phone || !formData.experience || !resumeFile}
                  className="w-full py-3 bg-[#003B95] text-white font-semibold rounded-xl hover:bg-[#00296b] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit Application'}
                </button>

                <p className="text-[11px] text-gray-400 text-center">
                  By submitting, you agree to our privacy policy. We'll only use your data for recruitment purposes.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
