// Fetch BrowserConfig from database and update title and favicon
(async function() {
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
      const apiEndpoint = `${normalizedBase}/api/v1/MasterData/GetSystemParameters`;
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
            document.title = browserConfig.parameterValue;
            const titleElement = document.getElementById('page-title');
            if (titleElement) {
              titleElement.textContent = browserConfig.parameterValue;
            }
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

