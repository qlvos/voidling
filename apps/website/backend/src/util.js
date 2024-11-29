

export function formatNumber(num) {
  return (num).toFixed(20).match(/^-?\d*\.?0*\d{0,2}/)[0];
}

export function formatAmount(amount) {
  return parseInt(amount, 10).toLocaleString('en-US');
}

export function hiddenLink(text, link) {
  return `<a href=${link} style="text-decoration:none" target="_blank">${text}</a>`;
}

