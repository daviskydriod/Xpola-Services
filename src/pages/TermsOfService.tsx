// FILE PATH: src/pages/TermsOfService.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="pt-[72px] h-1 bg-[#E02020]" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-montserrat font-black text-3xl text-gray-900 mb-2">Terms of Service</h1>
          <p className="font-poppins text-sm text-gray-400">Last updated: April 2025</p>
        </div>

        <div className="font-poppins text-gray-700 space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the Xpola Services platform at <strong>xpolaservices.com</strong> (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Platform. These Terms apply to all visitors, registered users, and customers in Nigeria and Canada.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">2. About Xpola Services</h2>
            <p>Xpola Services is a multi-sector B2B/B2C platform operating across oil and gas, construction, mining, logistics, consulting, and e-commerce sectors. We provide products and services to customers in Nigeria and Canada. Prices and product availability may differ between the two storefronts.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 18 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information when registering.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must notify us immediately of any unauthorised use of your account at <a href="mailto:info@xpolaservices.com" className="text-[#E02020] hover:underline">info@xpolaservices.com</a>.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">4. Orders and Purchases</h2>
            <p className="mb-3">By placing an order, you represent that you are legally able to enter into a binding contract. All orders are subject to availability and acceptance by Xpola Services.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Prices are displayed in the currency of your selected storefront (NGN for Nigeria, CAD for Canada).</li>
              <li>We reserve the right to refuse or cancel any order for any reason, including suspected fraud.</li>
              <li>Once payment is confirmed, you will receive an order confirmation by email.</li>
              <li>You may not combine items from the Nigeria and Canada storefronts in a single order.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">5. Pricing and Payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All prices are inclusive of applicable VAT or taxes where stated.</li>
              <li>Nigerian orders are processed via <strong>Paystack</strong> in NGN.</li>
              <li>Canadian marketplace orders and checkout are currently unavailable while Moneris setup is pending.</li>
              <li>We do not store your full card details. Payment data is handled by our PCI-compliant payment processors.</li>
              <li>Prices are subject to change without notice, but changes will not affect confirmed orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">6. Delivery</h2>
            <p className="mb-3">Delivery is currently available for enabled Nigerian orders. Canadian marketplace delivery will be documented when the Canada marketplace and Moneris checkout are enabled.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Xpola Services is not responsible for delays caused by third-party logistics providers, customs, or circumstances beyond our control.</li>
              <li>Risk of loss and title for products passes to you upon delivery.</li>
              <li>If your order does not arrive within the stated timeframe, contact us at <a href="mailto:info@xpolaservices.com" className="text-[#E02020] hover:underline">info@xpolaservices.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">7. Returns and Refunds</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Return requests for enabled Nigerian orders must be submitted within 7 days of delivery. Canadian marketplace return terms will be published before launch.</li>
              <li>Items must be unused, in original packaging, and in the same condition as received.</li>
              <li>Certain product categories (e.g. industrial equipment, custom orders) may not be eligible for return.</li>
              <li>Approved refunds will be processed to the original payment method within 5–10 business days.</li>
              <li>Delivery fees are non-refundable unless the return is due to our error.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">8. Intellectual Property</h2>
            <p>All content on the Platform — including text, graphics, logos, images, and software — is the property of Xpola Services or its content suppliers and is protected by applicable copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">9. Prohibited Conduct</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the Platform for any unlawful purpose or in violation of applicable Nigerian or Canadian law</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its related systems</li>
              <li>Transmit any viruses, malware, or malicious code</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Engage in fraudulent transactions or chargebacks</li>
              <li>Scrape, crawl, or extract data from the Platform without our written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Xpola Services shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or inability to access it. Our total liability to you in connection with any claim shall not exceed the amount you paid for the relevant order.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">11. Disclaimer of Warranties</h2>
            <p>The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">12. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria for Nigerian users and the laws of Canada for Canadian users. Any disputes shall be subject to the exclusive jurisdiction of the courts of the relevant country.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">13. Changes to These Terms</h2>
            <p>We reserve the right to update these Terms at any time. Material changes will be communicated via email or a prominent notice on the Platform. Continued use of the Platform after changes take effect constitutes your acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="font-montserrat font-bold text-lg text-gray-900 mb-3">14. Contact</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p><strong>Xpola Services</strong></p>
              <p>Email: <a href="mailto:info@xpolaservices.com" className="text-[#E02020]">info@xpolaservices.com</a></p>
              <p>Website: <a href="https://xpolaservices.com" className="text-[#E02020]">xpolaservices.com</a></p>
            </div>
          </section>

          <div className="border-t border-gray-100 pt-6 flex flex-wrap gap-4 text-sm">
            <Link to="/privacy" className="text-[#E02020] hover:underline font-semibold">Privacy Policy</Link>
            <Link to="/cookies" className="text-[#E02020] hover:underline font-semibold">Cookie Policy</Link>
            <Link to="/contact" className="text-[#E02020] hover:underline font-semibold">Contact Us</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
