// pages/privacy-policy.tsx

import React from "react";
import Head from "next/head";

const PrivacyPolicy = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - Hack-A-Byte</title>
        <meta name="description" content="Privacy Policy for Hack-A-Byte Game" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className="bg-gray-100 text-gray-900">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-4xl font-semibold text-indigo-700 text-center mb-8">Privacy Policy</h1>
          <p className="text-xl text-gray-700 text-center mb-6">
            <strong>Effective Date:</strong> December 1, 2024
          </p>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              Hack-A-Byte collects the following types of data to enhance your experience and improve the game:
            </p>
            <ul className="list-inside list-disc text-gray-700">
              <li>
                <strong>Personal Information:</strong> When you sign up, we collect your username, email address, and
                other details required for account creation.
              </li>
              <li>
                <strong>Usage Data:</strong> Non-personal data such as gameplay behavior, device type, and IP address
                are collected to optimize game performance.
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
            <ul className="list-inside list-disc text-gray-700">
              <li>To deliver, maintain, and enhance your Hack-A-Byte experience.</li>
              <li>To notify you about game updates, new features, and promotional offers.</li>
              <li>To prevent fraud, enforce our Terms of Service, and ensure a secure environment for all users.</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Account Security</h2>
            <p className="text-gray-700 mb-4">
              Hack-A-Byte takes reasonable steps to secure your account's password. However, please note that in-game
              devices' passwords are not secured. We encourage users to protect their devices and avoid sharing
              sensitive information in-game.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Sharing of Information</h2>
            <p className="text-gray-700 mb-4">
              We do not sell or share your personal information with third parties except for the following:
            </p>
            <ul className="list-inside list-disc text-gray-700">
              <li>To comply with legal obligations.</li>
              <li>
                With trusted service providers that assist in the functioning of Hack-A-Byte (e.g., hosting providers).
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement security measures to protect your personal information. However, no method of transmission
              over the internet is 100% secure, and we cannot guarantee the absolute security of your data.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. To
              make any such requests, please contact us at{" "}
              <a href="mailto:virexela@icloud.com" className="text-indigo-600">
                virexela@icloud.com
              </a>
              .
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. When we make changes, we will update the "Effective
              Date" at the top of this page. Please review this policy periodically to stay informed about our data
              practices.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:virexela@icloud.com" className="text-indigo-600">
                virexela@icloud.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
