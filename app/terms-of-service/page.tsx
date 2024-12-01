import React from "react";
import Head from "next/head";

const TermsOfService = () => {
  return (
    <>
      <Head>
        <title>Terms of Service - Hack-A-Byte</title>
        <meta name="description" content="Terms of Service for Hack-A-Byte Game" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className="bg-gray-100 text-gray-900">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-4xl font-semibold text-indigo-700 text-center mb-8">Terms of Service</h1>
          <p className="text-xl text-gray-700 text-center mb-6">
            <strong>Effective Date:</strong> December 1, 2024
          </p>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Hack-A-Byte! These Terms of Service govern your use of our game, website, and related services.
              By accessing or using Hack-A-Byte, you agree to comply with these terms.
            </p>
            <p className="text-gray-700 mb-4">
              If you do not agree with any part of these terms, please refrain from using our game and services.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. User Account</h2>
            <p className="text-gray-700 mb-4">
              To access the game, you need to create an account. You agree to provide accurate and complete information
              during registration. You are responsible for maintaining the confidentiality of your account and password.
            </p>
            <p className="text-gray-700 mb-4">
              Hack-A-Byte is not responsible for any unauthorized access to your account. If you believe your account
              has been compromised, contact us immediately.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">
              You agree to use Hack-A-Byte only for lawful purposes and in a way that does not infringe on the rights of
              others. This includes but is not limited to:
            </p>
            <ul className="list-inside list-disc text-gray-700">
              <li>Not engaging in any activity that could harm or disrupt the game.</li>
              <li>Not using the game to simulate any real-life illegal activities.</li>
              <li>Not attempting to bypass the game’s security features.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Failure to comply with these rules may result in your account being suspended or terminated.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. In-Game Transactions</h2>
            <p className="text-gray-700 mb-4">
              Hack-A-Byte uses virtual currency for in-game purchases and rewards. All transactions are conducted using
              in-game currency, which has no real-world monetary value.
            </p>
            <p className="text-gray-700 mb-4">
              Virtual currency can be earned by playing the game, completing challenges, or receiving daily rewards, but
              it cannot be converted to or used as real money.
            </p>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify, suspend, or remove virtual currency and in-game purchases without notice.
              We are not responsible for any loss of virtual currency or items due to technical issues or other reasons.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Privacy and Data</h2>
            <p className="text-gray-700 mb-4">
              Your use of Hack-A-Byte is governed by our{" "}
              <a href="/privacy-policy" className="text-indigo-600">
                Privacy Policy
              </a>
              , which explains how we collect, use, and store your data. By using the game, you consent to our privacy
              practices.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at our discretion, for reasons including but not
              limited to violation of these Terms of Service, disruptive behavior, or fraudulent activity.
            </p>
            <p className="text-gray-700 mb-4">
              If your account is terminated, you will no longer have access to any of the game features or virtual items
              associated with the account.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              Hack-A-Byte is provided "as is" without any warranties of any kind. We are not responsible for any direct,
              indirect, incidental, or consequential damages that may result from using the game.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Modifications</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms of Service at any time. When changes are made, we will update the "Effective
              Date" at the top of this page. You are encouraged to review this page regularly for any updates.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in
              which Hack-A-Byte operates.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions or concerns regarding these Terms of Service, please contact us at{" "}
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

export default TermsOfService;
