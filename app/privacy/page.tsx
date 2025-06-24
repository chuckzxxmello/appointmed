import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft, Lock } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-blue-900" />
              <div>
                <h1 className="text-xl font-bold text-blue-900">AppointMED</h1>
                <p className="text-xs text-gray-600">ELAD School of Potentials</p>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" className="bg-white text-blue-900 border-blue-900 hover:bg-blue-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center">
                <Lock className="h-8 w-8 text-green-700" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-xl text-gray-600">AppointMED - ELAD School of Potentials Therapy Center</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2025</p>
          </div>

          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
              <CardTitle className="text-2xl text-green-900">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  ELAD School of Potentials Therapy Center ("we," "our," or "us") is committed to protecting your
                  privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and
                  safeguard your information when you use our AppointMED platform, in compliance with the Data Privacy
                  Act of 2012 (Republic Act No. 10173) of the Philippines and other applicable laws.
                </p>
              </section>

              {/* Data Privacy Act Compliance */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Privacy Act Compliance</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We are fully committed to complying with the Data Privacy Act of 2012 (Republic Act No. 10173) and its
                  Implementing Rules and Regulations. As a healthcare provider, we understand the sensitive nature of
                  health information and implement appropriate safeguards to protect your data.
                </p>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Your Rights Under the Data Privacy Act:</h3>
                  <ul className="list-disc list-inside text-green-800 space-y-1">
                    <li>Right to be informed about data processing</li>
                    <li>Right to access your personal data</li>
                    <li>Right to object to processing</li>
                    <li>Right to erasure or blocking</li>
                    <li>Right to rectify inaccurate data</li>
                    <li>Right to data portability</li>
                    <li>Right to file a complaint with the National Privacy Commission</li>
                  </ul>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Full name, email address, phone number</li>
                      <li>Date of birth and age</li>
                      <li>Address and contact information</li>
                      <li>Emergency contact details</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Information:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Medical history and current health conditions</li>
                      <li>Therapy and treatment records</li>
                      <li>Appointment history and notes</li>
                      <li>Insurance and payment information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Information:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>IP address and device information</li>
                      <li>Browser type and version</li>
                      <li>Usage patterns and preferences</li>
                      <li>Login and access logs</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We process your personal and health information for the following legitimate purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Providing healthcare services and therapy treatments</li>
                  <li>Scheduling and managing appointments</li>
                  <li>Maintaining medical records and treatment history</li>
                  <li>Communicating about appointments and health matters</li>
                  <li>Processing payments and insurance claims</li>
                  <li>Improving our services and patient care</li>
                  <li>Complying with legal and regulatory requirements</li>
                  <li>Ensuring the security and integrity of our systems</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your
                  information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>With healthcare professionals involved in your care</li>
                  <li>With your explicit consent</li>
                  <li>When required by law or court order</li>
                  <li>To protect the safety and rights of patients and staff</li>
                  <li>With authorized insurance providers for claims processing</li>
                  <li>With trusted service providers under strict confidentiality agreements</li>
                </ul>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security Measures</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement comprehensive security measures to protect your information:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Technical Safeguards:</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• End-to-end encryption</li>
                      <li>• Secure data transmission (SSL/TLS)</li>
                      <li>• Regular security audits</li>
                      <li>• Access controls and authentication</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Administrative Safeguards:</h4>
                    <ul className="text-purple-800 text-sm space-y-1">
                      <li>• Staff training on data privacy</li>
                      <li>• Limited access on need-to-know basis</li>
                      <li>• Regular policy updates</li>
                      <li>• Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal and health information for as long as necessary to provide healthcare services
                  and comply with legal requirements. Medical records are typically retained for a minimum of 10 years
                  after the last treatment, as required by Philippine healthcare regulations. You may request deletion
                  of your data, subject to legal and medical record-keeping requirements.
                </p>
              </section>

              {/* International Data Transfers */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your data is primarily stored and processed within the Philippines. If we need to transfer data
                  internationally (such as for cloud storage or technical support), we ensure adequate protection
                  through appropriate safeguards and compliance with the Data Privacy Act's requirements for
                  international transfers.
                </p>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience on our platform:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Essential cookies for platform functionality</li>
                  <li>Authentication cookies to keep you logged in</li>
                  <li>Preference cookies to remember your settings</li>
                  <li>Analytics cookies to improve our services (anonymized)</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We provide healthcare services to patients of all ages, including minors. For patients under 18 years
                  of age, we require parental or guardian consent for data processing. We take extra care to protect the
                  privacy of minor patients in accordance with Philippine laws and ethical healthcare practices.
                </p>
              </section>

              {/* Your Rights and Choices */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Access and review your personal information</li>
                  <li>Request corrections to inaccurate data</li>
                  <li>Request deletion of your data (subject to legal requirements)</li>
                  <li>Object to certain types of data processing</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent (where applicable)</li>
                  <li>File a complaint with the National Privacy Commission</li>
                </ul>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable
                  laws. We will notify you of any material changes via email or through our platform. Your continued use
                  of our services after such changes constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or wish to exercise your data privacy rights,
                    please contact our Data Protection Officer:
                  </p>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>ELAD School of Potentials Therapy Center</strong>
                    </p>
                    <p>Data Protection Officer</p>
                    <p>Camerino St. Brgy. Luciano, Trece Martires, Philippines, 4109</p>
                    <p>Email: eladschoolofpotentials@yahoo.com</p>
                    <p>Phone: +63 947 429 5648</p>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>National Privacy Commission:</strong> If you believe your data privacy rights have been
                      violated, you may file a complaint with the National Privacy Commission at{" "}
                      <span className="font-medium">privacy.gov.ph</span>
                    </p>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <Link href="/">
              <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to AppointMED
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
