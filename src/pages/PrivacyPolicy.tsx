// FILE PATH: src/pages/PrivacyPolicy.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="pt-[72px] h-1 bg-[#E02020]" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-montserrat font-black text-3xl text-gray-900 mb-2">Privacy Policy</h1>
          <p className="font-poppins text-sm text-gray-400">Last updated: April 2025</p>
        </div>

        <div className="prose prose-sm max-w-none font-poppins text-gray-700 space-y-8">

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">1. Introduction</h2>
            <p>Xpola Services ("we", "us", or "our") operates as a multi-sector B2B/B2C platform serving customers in Nigeria and Canada. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our website at <strong>xpolaservices.com</strong> and our related services.</p>
            <p className="mt-3">By using our platform, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="font-semibold text-gray-800 mb-2">Information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account registration details (name, email address, phone number)</li>
              <li>Delivery addresses and billing information</li>
              <li>Order details and purchase history</li>
              <li>Communications you send us via support tickets or contact forms</li>
              <li>Profile preferences and account settings</li>
            </ul>
            <p className="font-semibold text-gray-800 mb-2 mt-4">Information collected automatically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP address and approximate location</li>
              <li>Browser type, device type, and operating system</li>
              <li>Pages visited, time spent, and navigation patterns</li>
              <li>Cookies and similar tracking technologies (see Section 7)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and fulfill your orders, including sending confirmation and delivery updates</li>
              <li>To create and manage your account</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To send transactional emails (order confirmations, receipts, shipping notices)</li>
              <li>To send promotional communications where you have given consent</li>
              <li>To detect and prevent fraud or unauthorised access</li>
              <li>To comply with legal obligations in Nigeria and Canada</li>
              <li>To improve our platform and personalise your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">4. Legal Basis for Processing (GDPR)</h2>
            <p>We aim to handle personal information in line with Nigeria's <strong>National Data Protection Act (NDPA)</strong> and Canada's <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>, as applicable to the relevant customer and activity. For customers in the European Economic Area or where GDPR applies, we process your data under the following legal bases:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Contract performance:</strong> Processing necessary to fulfil your orders</li>
              <li><strong>Legitimate interests:</strong> Fraud prevention, platform security, analytics</li>
              <li><strong>Consent:</strong> Marketing emails and non-essential cookies (which you may withdraw at any time)</li>
              <li><strong>Legal obligation:</strong> Compliance with applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">5. Sharing Your Information</h2>
            <p>We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Payment processors:</strong> Paystack for enabled Nigerian transactions. Moneris is named as a planned Canadian processor and is not active while the Canadian marketplace is switched off.</li>
              <li><strong>Logistics partners:</strong> To arrange delivery of your orders</li>
              <li><strong>Service providers:</strong> Email delivery, cloud hosting, and analytics tools that process data on our behalf</li>
              <li><strong>Legal authorities:</strong> Where required by Nigerian or Canadian law</li>
            </ul>
            <p className="mt-3">All third-party processors are bound by data processing agreements and may not use your data for their own purposes.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">6. Data Retention</h2>
            <p>We retain your personal data for as long as necessary to fulfil the purposes described in this policy, or as required by law. Specifically:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Account data: retained for the life of your account plus 2 years after closure</li>
              <li>Order records: retained for 7 years for tax and accounting compliance</li>
              <li>Support tickets: retained for 3 years</li>
              <li>Marketing consent records: retained until consent is withdrawn plus 1 year</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">7. Cookies</h2>
            <p>We use cookies and similar technologies to operate our platform. See our <Link to="/cookies" className="text-[#E02020] hover:underline">Cookie Policy</Link> for full details. You can manage cookie preferences at any time through our cookie consent banner or your browser settings.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Ask us to limit how we process your data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent:</strong> Opt out of marketing at any time via your account or unsubscribe links</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:info@xpolaservices.com" className="text-[#E02020] hover:underline">info@xpolaservices.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">9. Security</h2>
            <p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, disclosure, alteration, or destruction. These include encrypted data transmission (HTTPS), hashed passwords, and access controls. However, no internet transmission is 100% secure and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">10. Children's Privacy</h2>
            <p>Our platform is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes by posting the new policy on this page and, where appropriate, via email. Continued use of our platform after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">12. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
              <p><strong>Xpola Services</strong></p>
              <p>Email: <a href="mailto:info@xpolaservices.com" className="text-[#E02020]">info@xpolaservices.com</a></p>
              <p>Website: <a href="https://xpolaservices.com" className="text-[#E02020]">xpolaservices.com</a></p>
            </div>
          </section>

          <div className="border-t border-gray-100 pt-6 flex flex-wrap gap-4 text-sm">
            <Link to="/terms" className="text-[#E02020] hover:underline font-semibold">Terms of Service</Link>
            <Link to="/cookies" className="text-[#E02020] hover:underline font-semibold">Cookie Policy</Link>
            <Link to="/contact" className="text-[#E02020] hover:underline font-semibold">Contact Us</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
