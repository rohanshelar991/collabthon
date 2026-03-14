import Script from "next/script";

export function GA4({ measurementId }: { measurementId?: string }) {
  if (!measurementId) return null;
  const src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  const inline = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag(js, new Date());
gtag(config, );`;
  return (
    <>
      <Script src={src} strategy="afterInteractive" />
      <Script id="ga4-inline" strategy="afterInteractive">{inline}</Script>
    </>
  );
}
