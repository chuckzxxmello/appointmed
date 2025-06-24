import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft, FileText } from "lucide-react"

export default function TermsOfServicePage() {
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
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-900" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
            <p className="text-xl text-gray-600">AppointMED - ELAD School of Potentials Therapy Center</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2025</p>
          </div>

          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
              <CardTitle className="text-2xl text-blue-900">Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Welcome to AppointMED, the online appointment scheduling platform for ELAD School of Potentials
                  Therapy Center. These Terms of Service ("Terms") govern your use of our website and services located
                  at Camerino St. Brgy. Luciano, Trece Martires, Philippines, 4109. By accessing or using our service,
                  you agree to be bound by these Terms and our Privacy Policy.
                </p>
              </section>

              {/* Acceptance of Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By creating an account or using our services, you acknowledge that you have read, understood, and
                  agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These Terms are governed by the laws of the Republic of the Philippines, including but not limited to
                  the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable healthcare regulations.
                </p>
              </section>

              {/* Services Description */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Services Description</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  AppointMED provides an online platform for scheduling appointments with healthcare professionals at
                  ELAD School of Potentials Therapy Center. Our services include:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Online appointment scheduling and management</li>
                  <li>Patient profile management</li>
                  <li>Appointment reminders and notifications</li>
                  <li>Secure communication with healthcare providers</li>
                  <li>Access to therapy center information and announcements</li>
                </ul>
              </section>

              {/* User Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
                <p className="text-gray-700 leading-relaxed mb-4">As a user of AppointMED, you agree to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide accurate and complete information when creating your account</li>
                  <li>Keep your login credentials secure and confidential</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Use the service only for lawful purposes</li>
                  <li>Respect the privacy and rights of other users</li>
                  <li>Comply with all applicable laws and regulations of the Philippines</li>
                </ul>
              </section>

              {/* Privacy and Data Protection */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Privacy and Data Protection</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We are committed to protecting your privacy in accordance with the Data Privacy Act of 2012 (Republic
                  Act No. 10173) of the Philippines. Your personal and health information will be:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Collected and processed only for legitimate healthcare purposes</li>
                  <li>Stored securely using industry-standard encryption</li>
                  <li>Shared only with authorized healthcare professionals involved in your care</li>
                  <li>Protected against unauthorized access, disclosure, or misuse</li>
                  <li>Retained only for as long as necessary for healthcare and legal purposes</li>
                </ul>
              </section>

              {/* Medical Disclaimer */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Medical Disclaimer</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  AppointMED is a scheduling platform and does not provide medical advice, diagnosis, or treatment. All
                  medical services are provided by licensed healthcare professionals at ELAD School of Potentials
                  Therapy Center.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  In case of medical emergencies, please contact emergency services immediately at 911 or proceed to the
                  nearest hospital. Do not rely on our platform for emergency medical situations.
                </p>
              </section>

              {/* Appointment Policies */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Appointment Policies</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Appointments must be scheduled at least 24 hours in advance</li>
                  <li>Cancellations must be made at least 4 hours before the scheduled appointment</li>
                  <li>Late arrivals may result in shortened sessions or rescheduling</li>
                  <li>Payment is required at the time of service unless other arrangements are made</li>
                  <li>No-shows may be subject to cancellation fees as per clinic policy</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by Philippine law, AppointMED and ELAD School of Potentials Therapy
                  Center shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                  arising from your use of our services. Our total liability shall not exceed the amount paid by you for
                  the services in question.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law and Jurisdiction</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of the
                  Philippines. Any disputes arising from these Terms or your use of our services shall be subject to the
                  exclusive jurisdiction of the courts of Trece Martires, Cavite, Philippines.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes
                  via email or through our platform. Your continued use of our services after such modifications
                  constitutes acceptance of the updated Terms.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>ELAD School of Potentials Therapy Center</strong>
                    </p>
                    <p>Camerino St. Brgy. Luciano, Trece Martires, Philippines, 4109</p>
                    <p>Email: eladschoolofpotentials@yahoo.com</p>
                    <p>Phone: +63 947 429 5648</p>
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
