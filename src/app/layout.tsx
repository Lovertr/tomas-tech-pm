import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOMAS TECH — Project Manager",
  description: "ระบบบริหารโปรเจคภายใน TOMAS TECH CO., LTD.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TOMAS PM" />
        <meta name="theme-color" content="#003087" />
        <meta name="application-name" content="TOMAS PM" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <script dangerouslySetInnerHTML={{__html: `
          if("serviceWorker" in navigator){
            navigator.serviceWorker.register("/sw.js").catch(function(){});
          }
          // PWA Install Prompt
          var deferredPrompt=null;
          window.addEventListener("beforeinstallprompt",function(e){
            e.preventDefault();
            deferredPrompt=e;
            // Create install banner
            if(!document.getElementById("pwa-install-banner")){
              var d=document.createElement("div");
              d.id="pwa-install-banner";
              d.style.cssText="position:fixed;bottom:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#003087,#0050d0);color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 -2px 16px rgba(0,0,0,.2);font-family:system-ui,sans-serif";
              d.innerHTML='<div style="display:flex;align-items:center;gap:12px;flex:1">'
                +'<img src="/icon-72x72.png" style="width:40px;height:40px;border-radius:8px" />'
                +'<div><div style="font-weight:700;font-size:14px">TOMAS PM</div>'
                +'<div style="font-size:12px;opacity:.9">Install app for better experience</div></div></div>'
                +'<div style="display:flex;gap:8px;flex-shrink:0">'
                +'<button onclick="pwaDismiss()" style="background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer">Not now</button>'
                +'<button onclick="pwaInstall()" style="background:#F7941D;border:none;color:#fff;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700;cursor:pointer">Install</button>'
                +'</div>';
              document.body.appendChild(d);
            }
          });
          window.addEventListener("appinstalled",function(){
            var b=document.getElementById("pwa-install-banner");
            if(b)b.remove();
            deferredPrompt=null;
          });
          function pwaInstall(){
            if(deferredPrompt){
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(function(){
                deferredPrompt=null;
                var b=document.getElementById("pwa-install-banner");
                if(b)b.remove();
              });
            }
          }
          function pwaDismiss(){
            var b=document.getElementById("pwa-install-banner");
            if(b)b.remove();
            try{sessionStorage.setItem("pwa-dismissed","1")}catch(e){}
          }
        `}} />
      </body>
    </html>
  );
}
