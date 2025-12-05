'use client';

import PageLabel from '@/app/components/PageLabel';

export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '2rem',
      }}
    >
      <PageLabel pageName="Terms of Service" />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#4a9eff' }}>
          Terms of Service
        </h1>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
          Last updated: December 2025
        </p>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
            By accessing and using Song Pig A/B Testing Platform ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            2. Account Terms
          </h2>
          <ul style={{ opacity: 0.9, lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>You must be at least 13 years old to use this service.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You are responsible for all content posted and activity that occurs under your account.</li>
            <li>You must not use the service for any illegal or unauthorized purpose.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            3. Content and Intellectual Property
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
            You retain all rights to your original content, including songs, comments, and other materials you upload to the Service. By uploading content, you grant Song Pig a license to store, display, and process your content solely for the purpose of providing the Service.
          </p>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            You agree not to upload content that infringes on the intellectual property rights of others, including copyrighted music that you do not own or have permission to use.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            4. Privacy
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
            Your privacy is important to us. All rooms are private and invite-only. Feedback, votes, and comments are only visible to room members and the room creator.
          </p>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            We collect and use your information as described in our Privacy Policy. By using the Service, you consent to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            5. Prohibited Uses
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
            You agree not to:
          </p>
          <ul style={{ opacity: 0.9, lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to the Service or other accounts</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Use the Service to distribute spam or unsolicited communications</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            6. Service Availability
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            We strive to provide reliable service but do not guarantee uninterrupted or error-free operation. The Service is provided "as is" without warranties of any kind.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            7. Termination
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason we deem necessary.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            8. Changes to Terms
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#60a5fa' }}>
            9. Contact
          </h2>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            If you have questions about these Terms of Service, please contact us through the feedback button on the site.
          </p>
        </section>
      </div>
    </main>
  );
}

