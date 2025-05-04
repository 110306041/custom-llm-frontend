export function extractMethod(responseText) {
  console.log('進入extractMethod了')
  const result = {};
  const parseAmount = (raw) => {
    if (!raw) return NaN;
    const num = parseInt(raw.replace(/,/g, ""), 10);
    return isNaN(num) ? NaN : num;
  };

  const pushAmount = (rr, amount) => {
    if (!result[rr]) result[rr] = [];
    if (!result[rr].includes(amount)) result[rr].push(amount);
  };

  // Pattern 1: Direct action
  const regexDirect = /(RR[1-5]).*?(increase|add|invest|allocate|put|reduce|remove|decrease).*?(?:NT\$)?([\d,]+)/gi;
  let match;
  while ((match = regexDirect.exec(responseText)) !== null) {
    const rr = match[1];
    const verb = match[2].toLowerCase();
    const amount = parseAmount(match[3]);
    if (isNaN(amount) || amount < 10000) continue;

    const signedAmount = /reduce|remove|decrease/.test(verb) ? -amount : amount;
    pushAmount(rr, signedAmount);
  }

  // Pattern 2: Example
  const regexExample = /(?:NT\$)?([\d,]+).*?(?:for|to|in)?\s*(RR[1-5])/gi;
  while ((match = regexExample.exec(responseText)) !== null) {
    const amount = parseAmount(match[1]);
    const rr = match[2];
    if (isNaN(amount) || amount < 10000) continue;
    pushAmount(rr, amount);
  }

  // Pattern 3: or pattern
  const regexOrPattern = /(RR[1-5]).*?(?:NT\$)?([\d,]+).*?or.*?(?:NT\$)?([\d,]+)/gi;
  while ((match = regexOrPattern.exec(responseText)) !== null) {
    const rr = match[1];
    const amount1 = parseAmount(match[2]);
    const amount2 = parseAmount(match[3]);
    if (isNaN(amount1) || isNaN(amount2)) continue;
    if (amount1 < 10000 || amount2 < 10000) continue;
    pushAmount(rr, amount1);
    pushAmount(rr, amount2);
  }

  // Pattern 4: shift amount
  const regexShift = /(?:shift|move|switch)\s+(?:NT\$)?([\d,]+)\s+from\s+(RR[1-5])\s+to\s+(RR[1-5])/gi;
  while ((match = regexShift.exec(responseText)) !== null) {
    const amount = parseAmount(match[1]);
    const fromRR = match[2];
    const toRR = match[3];
    if (isNaN(amount) || amount < 10000) continue;
    pushAmount(fromRR, -amount);
    pushAmount(toRR, amount);
  }

  // Pattern 5: Suggestion
  const regexSuggestAfterRR = /(RR[1-5]).*?(such as|like).*?(?:NT\$)?([\d,]+)/gi;
  while ((match = regexSuggestAfterRR.exec(responseText)) !== null) {
    const rr = match[1];
    const amount = parseAmount(match[3]);
    if (isNaN(amount) || amount < 10000) continue;
    pushAmount(rr, amount);
  }

    // Pattern 6: Recommend maximum (e.g., "recommend a maximum of NT$100,000 to RR1")
  const regexRecommendMax = /(?:recommend(?:ed)?|suggest(?:ed)?)\s+(?:a\s+)?(?:maximum|limit)\s+(?:of\s+)?(?:NT\$)?([\d,]+).*?\s+(?:to\s+)?(RR[1-5])/gi;
  while ((match = regexRecommendMax.exec(responseText)) !== null) {
    const amount = parseAmount(match[1]);
    const rr = match[2];
    if (isNaN(amount) || amount < 10000) continue;
    pushAmount(rr, amount);
  }

  // Pattern 7: Contextual suggestion without RR in same sentence
  const sentences = responseText.split(/(?<=[.?!])\s+/);
  let lastMentionedRR = null;

  for (const sentence of sentences) {
    // 追蹤最近提到的 RR
    const rrMatch = sentence.match(/RR[1-5]/);
    if (rrMatch) {
      lastMentionedRR = rrMatch[0];
    }

    // 嘗試找出模糊建議金額
    const vagueAmountMatch = sentence.match(/(?:around|about|approximately|maybe|could be|might be|possible allocation(?: is| could be)?|consider investing)\s+(?:NT\$)?([\d,]+)/i);
    if (vagueAmountMatch && lastMentionedRR) {
      const amount = parseAmount(vagueAmountMatch[1]);
      if (!isNaN(amount) && amount >= 10000) {
        pushAmount(lastMentionedRR, amount);
      }
    }
  }

  // Pattern 8: Range pattern like "around NT$50,000 to NT$100,000" near RR
  const regexRange = /(RR[1-5]).*?(?:around\s+)?(?:NT\$)?([\d,]+)\s*(?:to|~|and|-)\s*(?:NT\$)?([\d,]+)/gi;
  while ((match = regexRange.exec(responseText)) !== null) {
    const rr = match[1];
    const amount1 = parseAmount(match[2]);
    const amount2 = parseAmount(match[3]);
    if (isNaN(amount1) || isNaN(amount2)) continue;
    if (amount1 < 10000 || amount2 < 10000) continue;
    pushAmount(rr, amount1);
    pushAmount(rr, amount2);
  }


  return result;
}
