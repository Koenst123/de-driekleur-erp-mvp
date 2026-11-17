const paths = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/>',
  articles: '<path d="M21 8 12 3 3 8l9 5 9-5v9l-9 5-9-5V8m9 5v9M7.5 5.5l9 5"/>',
  sales: '<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h4"/>',
  purchase: '<path d="M3 5h2l2.5 12h11L21 8H6m4 13h.01M18 21h.01"/>',
  warehouse: '<path d="M3 21V9l9-6 9 6v12H3Zm5 0v-9h8v9m-8-4h8"/>',
  stock: '<path d="M3 6h18M3 12h18M3 18h18M7 4v16M17 4v16"/>',
  customers: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5v2"/>',
  suppliers: '<path d="M3 5h12v13H3zm12 5h4l3 4v4h-7"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
  invoices: '<path d="M6 3h12v19l-3-2-3 2-3-2-3 2V3m3 5h6m-6 4h6m-6 4h4"/>',
  documents: '<path d="M3 6h7l2 2h9v12H3z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  trend: '<path d="m3 17 6-6 4 4 7-8m-6 0h6v6"/>',
  warning: '<path d="m12 3 10 17H2L12 3zm0 6v4m0 3h.01"/>',
  spark: '<path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3z"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7m-2-7V4m0 7h7"/>',
};
export function icon(name, size = 20) {
  return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
}
