export default function PrivacyPage() {
  return (
    <div className="pb-24">
      <h1 className="text-[#1A1A1A] text-[36px] sm:text-[48px] font-normal leading-[1.1] font-serif mb-4">
        Privacy Policy
      </h1>
      <p className="text-[#AAAAAA] text-[13px] font-sans mb-12">
        Last updated: March 24, 2026
      </p>

      <Section title="1. Introduction">
        <P>
          Synapse AI Inc. (&quot;Synapse,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to
          protecting your privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our website, mobile
          applications, wearable devices, and related services (collectively, the
          &quot;Services&quot;).
        </P>
        <P>
          By accessing or using our Services, you agree to the terms of this Privacy
          Policy. If you do not agree, please do not use our Services.
        </P>
      </Section>

      <Section title="2. Information We Collect">
        <Subtitle>Account Information</Subtitle>
        <P>
          When you create an account, we collect your name, email address, and
          profile photo through Google OAuth. We do not store your Google password.
        </P>

        <Subtitle>Contact and Relationship Data</Subtitle>
        <P>
          With your explicit permission, we access your Google Contacts, Gmail
          metadata (sender, recipient, subject line, timestamps — never full email
          bodies), and Google Calendar events to build your relationship graph. We
          also process contacts you import via LinkedIn data exports, CSV uploads,
          or business card scans.
        </P>

        <Subtitle>Wearable Device Data</Subtitle>
        <P>
          If you use a Synapse Pendant or Synapse Spectacles, audio is captured and
          processed entirely on-device. Only extracted metadata — names, topics, and
          interaction summaries — is synced to your account. Raw audio never leaves
          your device unless you explicitly choose to export it.
        </P>

        <Subtitle>Usage Data</Subtitle>
        <P>
          We collect anonymized usage analytics such as feature engagement, session
          duration, and error logs to improve the Services. This data cannot be used
          to identify individual users.
        </P>
      </Section>

      <Section title="3. How We Use Your Information">
        <P>We use the information we collect to:</P>
        <Ul>
          <Li>Build and maintain your personal relationship graph</Li>
          <Li>Provide AI-powered relationship insights, reminders, and suggestions</Li>
          <Li>Enrich contact profiles with publicly available information</Li>
          <Li>Enable network visualization and intro path discovery</Li>
          <Li>Manage your pipelines, tags, and outreach workflows</Li>
          <Li>Send you product updates and service notifications (with your consent)</Li>
          <Li>Improve and develop new features based on anonymized usage patterns</Li>
        </Ul>
      </Section>

      <Section title="4. On-Device Processing">
        <P>
          Privacy is a core design principle at Synapse. All sensitive AI processing
          — including audio transcription, contact identification, and conversation
          analysis — happens locally on your device. We use on-device machine
          learning models (CoreML on iOS, TensorFlow Lite on Android) to ensure
          your most personal data never touches our servers.
        </P>
        <P>
          Cloud sync is optional and uses end-to-end encryption when enabled. You
          retain full control over what data leaves your device.
        </P>
      </Section>

      <Section title="5. Data Sharing and Disclosure">
        <P>
          We do not sell, rent, or trade your personal information to third parties.
          We may share information only in the following circumstances:
        </P>
        <Ul>
          <Li>
            <strong className="text-[#1A1A1A]">Service Providers:</strong> Trusted
            third-party services that help us operate (e.g., cloud hosting,
            analytics). These providers are contractually bound to protect your data.
          </Li>
          <Li>
            <strong className="text-[#1A1A1A]">Legal Requirements:</strong> When
            required by law, regulation, or legal process, or to protect the rights,
            safety, or property of Synapse, our users, or the public.
          </Li>
          <Li>
            <strong className="text-[#1A1A1A]">With Your Consent:</strong> When you
            explicitly authorize sharing, such as requesting an introduction through
            the platform.
          </Li>
        </Ul>
      </Section>

      <Section title="6. Data Security">
        <P>
          We implement industry-standard security measures to protect your
          information, including:
        </P>
        <Ul>
          <Li>AES-256 encryption for data at rest</Li>
          <Li>TLS 1.3 for data in transit</Li>
          <Li>End-to-end encryption for optional cloud sync</Li>
          <Li>Regular security audits and penetration testing</Li>
          <Li>SOC 2 Type II compliance (in progress)</Li>
        </Ul>
        <P>
          While no system is 100% secure, we take every reasonable precaution to
          safeguard your data.
        </P>
      </Section>

      <Section title="7. Data Retention">
        <P>
          We retain your personal information for as long as your account is active
          or as needed to provide the Services. You may request deletion of your
          data at any time through the Settings page or by contacting us. Upon
          account deletion, all personal data is permanently removed from our
          systems within 30 days.
        </P>
      </Section>

      <Section title="8. Your Rights">
        <P>Depending on your jurisdiction, you may have the right to:</P>
        <Ul>
          <Li>Access the personal data we hold about you</Li>
          <Li>Request correction of inaccurate data</Li>
          <Li>Request deletion of your data</Li>
          <Li>Export your data in standard formats (JSON, CSV)</Li>
          <Li>Withdraw consent for data processing at any time</Li>
          <Li>Object to or restrict certain data processing activities</Li>
        </Ul>
        <P>
          To exercise any of these rights, contact us at{" "}
          <a
            href="mailto:privacy@synapse.com"
            className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
          >
            privacy@synapse.com
          </a>
          .
        </P>
      </Section>

      <Section title="9. Google API Disclosure">
        <P>
          Synapse&apos;s use and transfer of information received from Google APIs
          adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Specifically:
        </P>
        <Ul>
          <Li>
            We only request the minimum scopes necessary: read-only access to Gmail
            metadata, Calendar events, and Contacts.
          </Li>
          <Li>We never read, store, or process full email bodies.</Li>
          <Li>
            Google user data is used solely to provide relationship intelligence
            features to the authenticated user.
          </Li>
          <Li>
            We do not use Google data for advertising, market research, or any
            purpose unrelated to the Services.
          </Li>
          <Li>
            We do not allow humans to read Google user data except with your
            explicit consent, for security purposes, to comply with law, or when
            aggregated and anonymized for internal operations.
          </Li>
        </Ul>
      </Section>

      <Section title="10. International Data Transfers">
        <P>
          If you access our Services from outside the United States, your data may
          be transferred to and processed in the United States. We use Standard
          Contractual Clauses and other approved mechanisms to ensure adequate
          protection for international data transfers.
        </P>
      </Section>

      <Section title="11. Children's Privacy">
        <P>
          Our Services are not directed to individuals under 16 years of age. We do
          not knowingly collect personal information from children. If we learn that
          we have collected data from a child under 16, we will delete it promptly.
        </P>
      </Section>

      <Section title="12. Changes to This Policy">
        <P>
          We may update this Privacy Policy from time to time. We will notify you of
          material changes by posting the updated policy on this page and updating
          the &quot;Last updated&quot; date. Your continued use of the Services after
          changes are posted constitutes acceptance of the revised policy.
        </P>
      </Section>

      <Section title="13. Contact Us">
        <P>
          If you have any questions about this Privacy Policy or our data practices,
          please contact us:
        </P>
        <div className="mt-4 space-y-1.5">
          <P>Synapse AI Inc.</P>
          <P>
            Email:{" "}
            <a
              href="mailto:privacy@synapse.com"
              className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
            >
              privacy@synapse.com
            </a>
          </P>
          <P>
            Web:{" "}
            <a
              href="https://synapse.spaecs.com"
              className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
            >
              synapse.spaecs.com
            </a>
          </P>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#E5E5E3] pt-8 mb-10">
      <h2 className="text-[#1A1A1A] text-[20px] font-normal leading-[1.3] font-serif mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[#1A1A1A] text-[15px] font-medium font-sans mt-5 mb-2">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#888888] text-[16px] leading-[1.65] font-sans mb-4 max-w-[520px]">
      {children}
    </p>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside ml-5 mb-4 max-w-[520px] space-y-2">
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-[#888888] text-[16px] leading-[1.65] font-sans">
      {children}
    </li>
  );
}
