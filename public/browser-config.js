// Fetch BrowserConfig from database and update title and favicon
(async function() {
  // Title used when no company is involved (registration page, no company selected, API failure)
  const DEFAULT_TITLE = 'NOMARO';
  // Pages outside any company
  const PUBLIC_ROUTES = ['register'];
  // First address segments that are app routes, not company codes
  const APP_ROUTES = ['', 'login', 'dashboard', 'agreement', 'auth', 'reports', 'register', 'unauthorized'];

  function setTitle(text) {
    document.title = text;
    const titleElement = document.getElementById('page-title');
    if (titleElement) titleElement.textContent = text;
  }

  async function updateBrowserConfig() {
    try {
      // Wait for API URL to be set (from main.jsx) or use relative path
      let apiUrl = window.__API_BASE_URL__;
      let attempts = 0;
      const maxAttempts = 50; // Wait up to 5 seconds (50 * 100ms)
      
      // Wait for API URL to be available
      while (!apiUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        apiUrl = window.__API_BASE_URL__;
        attempts++;
      }
      
      const resolvedBase = apiUrl || window.location.origin;
      const normalizedBase = resolvedBase.endsWith('/') ? resolvedBase.slice(0, -1) : resolvedBase;

      // Public pages (company registration) always show the product name, never a company's.
      const pathSegments = (window.location.pathname || '').split('/').filter(Boolean);
      const firstPath = (pathSegments[0] || '').toLowerCase();
      if (PUBLIC_ROUTES.indexOf(firstPath) !== -1) {
        setTitle(DEFAULT_TITLE);
        return;
      }

      // Resolve the company code (tenant) so title/favicon come from the right database.
      // The company code in the address (e.g. /GIA/login) wins over the one stored by an earlier visit.
      let companyCode = null;
      try {
        if (firstPath && APP_ROUTES.indexOf(firstPath) === -1) {
          companyCode = pathSegments[0];
        }
        if (!companyCode) {
          const firstSegment = (window.location.hash || '').replace(/^#\/?/, '').split('/')[0];
          if (firstSegment && APP_ROUTES.indexOf(firstSegment.toLowerCase()) === -1) {
            companyCode = firstSegment;
          }
        }
        if (!companyCode) {
          companyCode = localStorage.getItem('nomaroCompanyCode');
        }
      } catch (e) { /* ignore */ }

      // No company yet: keep the product name
      if (!companyCode) {
        setTitle(DEFAULT_TITLE);
        return;
      }

      const apiEndpoint = companyCode
        ? `${normalizedBase}/api/v1/${encodeURIComponent(companyCode)}/MasterData/GetSystemParameters`
        : `${normalizedBase}/api/v1/MasterData/GetSystemParameters`;
      console.log('Fetching BrowserConfig from:', apiEndpoint);
      
      // Wait for the API response
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.data) {
        const browserConfig = data.data.find(item => item.parameterName === "BrowserConfig");
        
        if (browserConfig) {
          // Update browser title from parameterValue
          if (browserConfig.parameterValue && browserConfig.parameterValue.trim() !== "") {
            setTitle(browserConfig.parameterValue.trim());
          }

          // Update favicon from parameterBinaryValue
          if (browserConfig.parameterBinaryValue) {
            // Remove existing favicon links
            const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
            existingFavicons.forEach(link => link.remove());

            // Update or create favicon link with base64 data
            let faviconLink = document.getElementById('favicon-link');
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.id = 'favicon-link';
              faviconLink.rel = 'icon';
              document.head.appendChild(faviconLink);
            }
            faviconLink.type = 'image/png';
            faviconLink.href = `data:image/png;base64,${browserConfig.parameterBinaryValue}`;
          }
        }
      }
    } catch (err) {
      // Keep default title and favicon if API fails
      console.error("Failed to fetch BrowserConfig:", err);
    }
  }

  // Run immediately - script runs synchronously in head
  await updateBrowserConfig();
})();

