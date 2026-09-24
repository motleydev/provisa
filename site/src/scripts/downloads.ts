/** Marks the download row that matches the visitor's operating system. */
export function markDetectedOs(doc: Document = document): void {
  const ua = `${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`;
  const os =
    /Mac/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'macos'
    : /Win/i.test(ua) ? 'windows'
    : /Linux/i.test(ua) && !/Android/i.test(ua) ? 'linux'
    : null;
  if (!os) return;
  doc.querySelectorAll(`[data-pv-downloads] [data-os="${os}"]`).forEach((row) => row.setAttribute('data-detected', ''));
}
