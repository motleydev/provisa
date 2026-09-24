/**
 * Submits every `form[data-pv-form]` to its endpoint as JSON (the contract the
 * Pages Functions under functions/api/ expect) and reports in the form's
 * status line. Checks required fields and email format first, marking the
 * first problem field and moving focus to it.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initForms(doc: Document = document): void {
  doc.addEventListener('submit', async (event) => {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>('form[data-pv-form]');
    if (!form) return;
    event.preventDefault();

    const endpoint = form.dataset.pvForm!;
    const status = form.querySelector<HTMLElement>('[data-pv-status]');
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    const report = (state: 'ok' | 'error' | '', message: string) => {
      if (!status) return;
      status.dataset.state = state;
      status.textContent = message;
    };

    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]'));
    fields.forEach((f) => f.removeAttribute('aria-invalid'));
    const missing = fields.find((f) => f.required && !f.value.trim());
    const badEmail = fields.find((f) => f.type === 'email' && f.value.trim() && !EMAIL.test(f.value.trim()));
    const problem = missing ?? badEmail;
    if (problem) {
      problem.setAttribute('aria-invalid', 'true');
      problem.focus();
      report('error', missing ? `Please fill in ${labelOf(problem)}.` : 'Please enter a valid email address.');
      return;
    }

    const data: Record<string, string> = {};
    for (const f of fields) data[f.name] = f.value.trim();

    if (submit) submit.disabled = true;
    report('', 'Sending…');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        form.reset();
        report('ok', form.dataset.success ?? 'Thanks!');
      } else {
        report('error', body.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      report('error', 'Network error. Please try again.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

function labelOf(field: HTMLElement): string {
  const label = field.id ? field.ownerDocument.querySelector(`label[for="${field.id}"]`) : null;
  const text = (label?.firstChild?.textContent ?? field.getAttribute('placeholder') ?? 'this field').trim();
  return text.toLowerCase();
}
