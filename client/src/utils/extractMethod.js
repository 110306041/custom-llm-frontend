export function extractMethod(responseText) {
  const result = {};
  const parseAmount = (raw) => {
    if (!raw) return NaN;
    const num = parseInt(raw.replace(/,/g, ""), 10);
    return isNaN(num) ? NaN : num;
  };

  // Pattern 1: Direct action (e.g., "increase RR3 by NT$50,000")
  const regexDirect = /(RR[1-5]).*?(increase|add|invest|allocate|put|reduce|remove|decrease).*?(?:NT\$)?([\d,]+)/gi;
  let match;
  while ((match = regexDirect.exec(responseText)) !== null) {
    const rr = match[1];
    const verb = match[2].toLowerCase();
    const amount = parseAmount(match[3]);
    if (isNaN(amount) || amount < 10000) continue;

    const sign = /reduce|remove|decrease/.test(verb) ? -1 : 1;
    result[rr] = (result[rr] || 0) + sign * amount;
  }

  // Pattern 2: Example (e.g., "NT$50,000 to RR2")
  const regexExample = /(?:NT\$)?([\d,]+).*?(?:for|to|in)?\s*(RR[1-5])/gi;
  while ((match = regexExample.exec(responseText)) !== null) {
    const amount = parseAmount(match[1]);
    const rr = match[2];
    if (isNaN(amount) || amount < 10000) continue;
    if (!result[rr]) result[rr] = amount;
  }

  // Pattern 3: or pattern (e.g., "RR1: NT$50,000 or NT$100,000")
  const regexOrPattern = /(RR[1-5]).*?(?:NT\$)?([\d,]+).*?or.*?(?:NT\$)?([\d,]+)/gi;
  while ((match = regexOrPattern.exec(responseText)) !== null) {
    const rr = match[1];
    const raw1 = match[2];
    const raw2 = match[3];
    const amount1 = parseAmount(raw1);
    const amount2 = parseAmount(raw2);
    if (isNaN(amount1) || isNaN(amount2)) continue;
    if (amount1 < 10000 || amount2 < 10000) continue;
    result[rr] = [amount1, amount2];
  }

  // Pattern 4: shift amount (e.g., "shift NT$100,000 from RR3 to RR5")
  const regexShift = /(?:shift|move|switch)\s+(?:NT\$)?([\d,]+)\s+from\s+(RR[1-5])\s+to\s+(RR[1-5])/gi;
  while ((match = regexShift.exec(responseText)) !== null) {
    const amount = parseAmount(match[1]);
    const fromRR = match[2];
    const toRR = match[3];
    if (isNaN(amount) || amount < 10000) continue;
    result[fromRR] = (result[fromRR] || 0) - amount;
    result[toRR] = (result[toRR] || 0) + amount;
  }

  // Pattern 5: Suggestion (e.g., "RR1, such as NT$50,000")
  const regexSuggestAfterRR = /(RR[1-5]).*?(such as|like).*?(?:NT\$)?([\d,]+)/gi;
  while ((match = regexSuggestAfterRR.exec(responseText)) !== null) {
    const rr = match[1];
    const amount = parseAmount(match[3]);
    if (isNaN(amount) || amount < 10000) continue;
    if (!result[rr]) result[rr] = amount;
  }

  return result;
}
