export function destination(input, engine = 'duckduckgo') {
  const text = input.trim();
  if (!text) throw new Error('Type an address or search first.');
  if (/^https?:\/\//i.test(text)) {
    const url = new URL(text);
    if (url.username || url.password) throw new Error('Use an address without a username or password.');
    return url.href;
  }
  if (!/\s/.test(text) && /^[a-z\d-]+(?:\.[a-z\d-]+)+(?:\:\d+)?(?:[/?#]|$)/i.test(text)) {
    return new URL('https://' + text).href;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(text)) throw new Error('Only HTTP and HTTPS addresses work here.');
  return (engine === 'google' ? 'https://www.google.com/search?q=' : 'https://duckduckgo.com/?q=') + encodeURIComponent(text);
}