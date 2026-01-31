// HTML escape helper to prevent XSS
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Base HTML template wrapper
export function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${escapeHtml(title)} - rooftopper.club</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  ${content}
</body>
</html>`;
}

// Location page template
export interface Location {
  id: string;
  name: string;
  coordinate: string;
  created_at: string;
}

export function locationTemplate(location: Location): string {
  const content = `
  <main class="page-content">
    <div class="location-card">
      <h1>${escapeHtml(location.name)}</h1>
      <div class="location-details">
        <p><strong>Coordinates:</strong> ${escapeHtml(location.coordinate)}</p>
        <p><strong>Added:</strong> ${new Date(location.created_at).toLocaleDateString()}</p>
      </div>
      <a href="/" class="back-link">← Back to Map</a>
    </div>
  </main>`;

  return baseTemplate(location.name, content);
}

