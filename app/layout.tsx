import "./../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}
