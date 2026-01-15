import { useEffect, useState } from "react";
import { getSystemSettings, shouldRenderGTM } from "../lib/systemSettings";

export function GTMProvider({ children }: { children: React.ReactNode }) {
  const [gtmLoaded, setGtmLoaded] = useState(false);

  useEffect(() => {
    const initGTM = async () => {
      await getSystemSettings();

      const gtmConfig = shouldRenderGTM();

      if (!gtmConfig.enabled) {
        if (import.meta.env.DEV) {
          console.log("[GTM] Not enabled");
        }
        return;
      }

      if (gtmConfig.customHtml) {
        if (import.meta.env.DEV) {
          console.log(
            "[GTM] Custom HTML detected, injecting into head:",
            gtmConfig.customHtml.substring(0, 100) + "..."
          );
        }

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = gtmConfig.customHtml;

        const scripts = tempDiv.querySelectorAll("script");
        scripts.forEach((oldScript) => {
          const newScript = document.createElement("script");

          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
          }

          document.head.appendChild(newScript);
        });

        setGtmLoaded(true);
        return;
      }

      if (gtmConfig.containerId) {
        if (import.meta.env.DEV) {
          console.log(
            `[GTM] Loading with Container ID: ${gtmConfig.containerId} (source: ${gtmConfig.source})`
          );
        }

        const scriptExists = document.querySelector(
          `script[src*="googletagmanager.com/gtm.js?id=${gtmConfig.containerId}"]`
        );

        if (!scriptExists) {
          const script = document.createElement("script");
          script.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmConfig.containerId}');
          `;
          document.head.appendChild(script);

          const noScriptExists = document.querySelector(
            `noscript iframe[src*="${gtmConfig.containerId}"]`
          );
          if (!noScriptExists) {
            const noscript = document.createElement("noscript");
            noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmConfig.containerId}"
              height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
            document.body.insertBefore(noscript, document.body.firstChild);
          }

          if (import.meta.env.DEV) {
            console.log(
              `[GTM] Successfully loaded GTM with ID: ${gtmConfig.containerId}`
            );
          }
        }

        setGtmLoaded(true);
      }
    };

    initGTM();
  }, []);

  return <>{children}</>;
}

export function useGTM() {
  const pushEvent = (event: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event,
        ...data,
      });

      if (import.meta.env.DEV) {
        console.log("[GTM] Event pushed:", { event, ...data });
      }
    }
  };

  return { pushEvent };
}

declare global {
  interface Window {
    dataLayer: any[];
  }
}
