export const metadata = { title: 'Grievance Officer | Safar' };

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Grievance Officer</h1>
          <p className="mt-3 text-white/80">In compliance with the Information Technology Act, 2000 and Consumer Protection Act, 2019.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Grievance Officer Details</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Name:</strong> Grievance Officer, Safar India Pvt. Ltd.</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@ysafar.com" className="text-[#003B95] hover:underline">grievance@ysafar.com</a></p>
            <p><strong>Address:</strong> Safar India Pvt. Ltd., Hyderabad, Telangana, India</p>
            <p><strong>Working Hours:</strong> Monday to Friday, 10:00 AM to 6:00 PM IST</p>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">How to File a Grievance</h2>
          <ol className="text-gray-600 space-y-3 list-decimal pl-5">
            <li>Send an email to <a href="mailto:grievance@ysafar.com" className="text-[#003B95] hover:underline">grievance@ysafar.com</a> with a clear description of your complaint.</li>
            <li>Include your registered email, booking reference (if applicable), and supporting documents.</li>
            <li>You will receive an acknowledgment within 24 hours.</li>
            <li>We aim to resolve all grievances within 15 business days of receipt.</li>
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Escalation</h2>
          <p className="text-gray-600 leading-relaxed">If you are not satisfied with the resolution, you may escalate to the Nodal Officer at <a href="mailto:nodal@ysafar.com" className="text-[#003B95] hover:underline">nodal@ysafar.com</a>. Further appeals can be made to the appropriate Consumer Disputes Redressal Forum.</p>
        </section>
      </div>
    </div>
  );
}
