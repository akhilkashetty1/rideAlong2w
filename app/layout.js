import "../src/index.css";

export const metadata = {
  title: "Ride Along Form",
  description: "Two Wheeler Ride Along Assessment",
  icons: { icon: "/Favicon.ico" },
};

export const viewport = { themeColor: "#000000" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* page1.css @imports Poppins; loading it here too guarantees it once all CSS is bundled together */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
