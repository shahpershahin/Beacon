import './globals.css';

export const metadata = {
  title: 'StartupIndia Tracker',
  description: 'Track your startup progress, finances, and milestones.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
