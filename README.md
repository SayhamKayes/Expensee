<div align="center">
  <img src="https://raw.githubusercontent.com/SayhamKayes/Expensee/refs/heads/main/public/Expensee_logo_favicon.png" alt="Expensee Logo" width="120" />
  <h1>Expensee</h1>
  <p><b>Record Expense | Track it | Export it.</b></p>
  <br>
  <a href="https://sayham.itch.io/expensee">
    <img src="https://img.shields.io/badge/Download-Android_APK-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
  </a>
  <br><br>
</div>

<p>Expensee is a beautifully designed, mobile-first expense tracking application. Built with a modern glassmorphism UI, it features intelligent voice input for hands-free tracking, rich interactive charts, and a strict privacy-first architecture where all data lives locally on your device.</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/SayhamKayes/Expensee/refs/heads/main/public/app%20view/README-file-image.png" alt="Expensee Dashboard" width="800" />
</p>

<h2>✨ Features</h2>
<ul>
  <li>🎙️ <b>Smart Voice Input:</b> Tap the mic and say <i>"12 dollars for lunch"</i> — Expensee's smart parser automatically extracts the amount, purpose, and category. Works flawlessly on both Web and Native Android.</li>
  <li>📊 <b>Rich Analytics:</b> Visualize your spending with interactive 14-day trend lines, 7-day bar charts, and category-based pie charts.</li>
  <li>🎯 <b>Budget Tracking:</b> Set a monthly budget and watch your progress with dynamic, color-coded progress bars.</li>
  <li>📱 <b>Mobile-First Design:</b> A sleek, app-like experience with a bottom navigation bar, smooth transitions, and a premium frosted-glass aesthetic.</li>
  <li>🔒 <b>100% Privacy Focused:</b> No servers, no tracking. All your financial data is saved locally on your device.</li>
  <li>🔄 <b>Cross-Platform:</b> Runs seamlessly as a modern web app (PWA) or as a native Android APK.</li>
</ul>

<h2>📥 Download</h2>
<p>You can download the latest compiled Android APK directly from itch.io:<br>
👉 <a href="https://sayham.itch.io/expensee"><b>Download Expensee for Android</b></a></p>

<h2>🛠️ Tech Stack</h2>
<ul>
  <li><b>Frontend:</b> React, TypeScript, Vite</li>
  <li><b>Styling:</b> Tailwind CSS (Glassmorphism design)</li>
  <li><b>Charts:</b> Recharts</li>
  <li><b>Icons:</b> Lucide React</li>
  <li><b>Package Manager:</b> Bun</li>
  <li><b>Mobile Engine:</b> Capacitor (for Native Android APK)</li>
  <li><b>Speech Engine:</b> Web Speech API &amp; Capacitor Speech Recognition Plugin</li>
</ul>

<h2>🚀 Getting Started</h2>

<h3>Prerequisites</h3>
<p>Make sure you have <a href="https://nodejs.org/">Node.js</a> and <a href="https://bun.sh/">Bun</a> installed on your machine.</p>

<h3>Local Web Development</h3>
<ol>
  <li>Clone the repository:
    <pre><code>git clone https://github.com/SayhamKayes/Expensee.git
cd Expensee</code></pre>
  </li>
  <li>Install dependencies:
    <pre><code>bun install</code></pre>
  </li>
  <li>Start the development server:
    <pre><code>bun run dev</code></pre>
  </li>
  <li>Open <code>http://localhost:5173</code> in your browser. <i>(Note: Voice input requires testing via localhost or a secure HTTPS connection like Vercel or LocalTunnel).</i></li>
</ol>

<h3>Build for Android (APK)</h3>
<p>Expensee uses Capacitor to compile into a native Android app with native microphone permissions.</p>
<ol>
  <li>Build the web assets:
    <pre><code>bun run build</code></pre>
  </li>
  <li>Sync the native Android code:
    <pre><code>bunx cap sync android</code></pre>
  </li>
  <li>Open the project in Android Studio to build the APK:
    <pre><code>bunx cap open android</code></pre>
  </li>
</ol>

<h2>🔒 Privacy &amp; Data Storage</h2>
<p>Expensee is built with a strict offline-first philosophy.</p>
<ul>
  <li>There is no backend server or database attached to this application.</li>
  <li>All expenses, budgets, and settings are stored locally using browser storage/device storage.</li>
  <li>Your voice data is processed using the device's native OS speech engine.</li>
</ul>

<h2>🤝 Contributing</h2>
<p>Contributions, issues, and feature requests are welcome! Feel free to check the <a href="https://github.com/SayhamKayes/Expensee/issues">issues page</a>.</p>

<h2>📄 License</h2>
<p>This project is open-source and available under the <a href="LICENSE">MIT License</a>.</p>

<hr>
<p align="center"><i>Designed &amp; Developed by <a href="https://sayhamkayes.github.io/portfolio/">Sayham Kayes</a></i></p>