export default function TermsPage() {
  return (
    <div className="pb-24">
      <h1 className="text-[#1A1A1A] text-[36px] sm:text-[48px] font-normal leading-[1.1] font-serif mb-4">
        Terms of Service
      </h1>
      <p className="text-[#AAAAAA] text-[13px] font-sans mb-12">
        Last updated: March 24, 2026
      </p>

      <Section title="1. Acceptance of Terms">
        <P>
          By accessing or using the services provided by Synapse AI Inc.
          (&quot;Synapse,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
          including our website, applications, wearable devices, and APIs
          (collectively, the &quot;Services&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, do not use the Services.
        </P>
      </Section>

      <Section title="2. Eligibility">
        <P>
          You must be at least 16 years old to use the Services. By using the
          Services, you represent that you meet this requirement and have the legal
          capacity to enter into these Terms.
        </P>
      </Section>

      <Section title="3. Account Registration">
        <P>
          You may need to create an account to access certain features. You are
          responsible for maintaining the confidentiality of your account credentials
          and for all activities under your account. You agree to provide accurate
          information and to notify us immediately of any unauthorized use.
        </P>
      </Section>

      <Section title="4. Use of Services">
        <P>You agree to use the Services only for lawful purposes. You may not:</P>
        <Ul>
          <Li>Violate any applicable law or regulation</Li>
          <Li>Infringe on the intellectual property or privacy rights of others</Li>
          <Li>
            Use the Services to send unsolicited communications or spam
          </Li>
          <Li>
            Attempt to gain unauthorized access to any part of the Services
          </Li>
          <Li>
            Reverse engineer, decompile, or disassemble any aspect of the Services
          </Li>
          <Li>
            Use the Services to build a competing product or service
          </Li>
          <Li>
            Misrepresent your identity or impersonate another person
          </Li>
        </Ul>
      </Section>

      <Section title="5. Your Data">
        <P>
          You retain ownership of all data you provide to the Services. By using the
          Services, you grant Synapse a limited, non-exclusive license to process
          your data solely to provide and improve the Services. We do not claim
          ownership of your contacts, relationship data, or any content you create.
        </P>
        <P>
          For details on how we handle your data, please see our{" "}
          <a
            href="/privacy"
            className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
          >
            Privacy Policy
          </a>
          .
        </P>
      </Section>

      <Section title="6. Wearable Devices">
        <P>
          If you purchase or use Synapse hardware (Pendant, Spectacles), you
          acknowledge that:
        </P>
        <Ul>
          <Li>
            You are responsible for complying with local recording and consent laws
            when using audio capture features
          </Li>
          <Li>
            On-device processing is designed to keep data local, but you are
            responsible for the physical security of your device
          </Li>
          <Li>
            Hardware warranties are subject to separate terms provided at the time
            of purchase
          </Li>
        </Ul>
      </Section>

      <Section title="7. AI Features and Persona">
        <P>
          Synapse offers AI-powered features including Whisper (proactive assistant)
          and Persona (digital clone). You acknowledge that:
        </P>
        <Ul>
          <Li>
            AI-generated suggestions, introductions, and insights are provided as
            recommendations and may not always be accurate
          </Li>
          <Li>
            You are responsible for reviewing and approving any actions taken on
            your behalf by AI features
          </Li>
          <Li>
            The Persona feature may only be used to represent yourself, not to
            impersonate others
          </Li>
        </Ul>
      </Section>

      <Section title="8. API Access">
        <P>
          If you access the Synapse API, you agree to use it in accordance with our
          API documentation and rate limits. API keys are confidential and should not
          be shared. We reserve the right to revoke API access for misuse.
        </P>
      </Section>

      <Section title="9. Intellectual Property">
        <P>
          The Services, including all software, designs, text, and trademarks, are
          owned by Synapse AI Inc. and protected by intellectual property laws. You
          may not copy, modify, distribute, or create derivative works from the
          Services without our prior written consent.
        </P>
      </Section>

      <Section title="10. Termination">
        <P>
          You may terminate your account at any time through the Settings page. We
          may suspend or terminate your access if you violate these Terms. Upon
          termination, your right to use the Services ceases immediately. We will
          delete your data in accordance with our Privacy Policy.
        </P>
      </Section>

      <Section title="11. Disclaimers">
        <P>
          The Services are provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, either express or implied. We do not
          guarantee that the Services will be uninterrupted, error-free, or secure.
          We are not responsible for the accuracy of AI-generated content or
          relationship insights.
        </P>
      </Section>

      <Section title="12. Limitation of Liability">
        <P>
          To the maximum extent permitted by law, Synapse shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages
          arising from your use of the Services, even if we have been advised of the
          possibility of such damages. Our total liability shall not exceed the
          amount you paid us in the 12 months preceding the claim.
        </P>
      </Section>

      <Section title="13. Changes to These Terms">
        <P>
          We may update these Terms from time to time. We will notify you of
          material changes by posting the updated Terms on this page. Your continued
          use of the Services after changes are posted constitutes acceptance of the
          revised Terms.
        </P>
      </Section>

      <Section title="14. Contact Us">
        <P>
          If you have questions about these Terms, contact us at{" "}
          <a
            href="mailto:legal@synapse.com"
            className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
          >
            legal@synapse.com
          </a>
          .
        </P>
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
