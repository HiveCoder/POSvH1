export interface AssistantCartItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface AssistantContext {
  currencySymbol: string;
  orderType: string;
  cartItems: AssistantCartItem[];
  paymentModes: string[];
  popularItems: string[];
  menuCatalog: Array<{
    name: string;
    category: string;
    price: number;
  }>;
}

interface AssistantResult {
  text: string;
  source: 'ai' | 'local';
}

const aiEnabled = String(import.meta.env.VITE_AI_ENABLED || 'false').toLowerCase() === 'true';
const aiUrl = import.meta.env.VITE_AI_API_URL || '';
const aiModel = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini';
const aiApiKey = import.meta.env.VITE_AI_API_KEY || '';
const LOCAL_FALLBACK_MESSAGE = 'Sorry, I may not be able to help you with that.';

function formatAmount(amount: number, symbol: string) {
  return `${symbol}${amount.toFixed(2)}`;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasAnyPhrase(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function hasAnyWord(text: string, words: string[]): boolean {
  return words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));
}

function groupMenuByCategory(context: AssistantContext) {
  const grouped = new Map<string, Array<{ name: string; price: number }>>();

  context.menuCatalog.forEach((item) => {
    const key = item.category;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push({ name: item.name, price: item.price });
  });

  return grouped;
}

function findCategoryFromMessage(message: string, categories: string[]): string | null {
  const normalizedMessage = normalizeText(message);

  for (const category of categories) {
    const normalizedCategory = normalizeText(category);
    const categorySingular = normalizedCategory.endsWith('s')
      ? normalizedCategory.slice(0, -1)
      : normalizedCategory;

    if (
      normalizedMessage.includes(normalizedCategory)
      || (categorySingular.length > 2 && normalizedMessage.includes(categorySingular))
    ) {
      return category;
    }
  }

  return null;
}

function findItemsFromMessage(message: string, context: AssistantContext) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return [] as AssistantContext['menuCatalog'];

  const matches = context.menuCatalog.filter((item) => {
    const normalizedName = normalizeText(item.name);
    return normalizedMessage.includes(normalizedName) || normalizedName.includes(normalizedMessage);
  });

  return matches.slice(0, 5);
}

function buildLocalReply(userMessage: string, context: AssistantContext): string {
  const lower = userMessage.toLowerCase();
  const normalized = normalizeText(userMessage);
  const subtotal = context.cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalQty = context.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const groupedMenu = groupMenuByCategory(context);
  const categories = [...groupedMenu.keys()];

  if (hasAnyWord(normalized, ['hello', 'hi', 'hey'])) {
    return `Hi Sir/Ma'am! Pwede po ako tumulong sa menu categories, item prices, cart summary, payment modes, promos, bundles, at checkout readiness.`;
  }

  if (
    hasAnyPhrase(normalized, [
      'what should i give',
      'what should i offer',
      'what should i serve',
      'what can i suggest',
      'what to recommend',
      'at this time',
      'right now',
    ])
  ) {
    const hour = new Date().getHours();
    const daypart = hour < 11 ? 'morning' : hour < 15 ? 'lunch' : hour < 19 ? 'afternoon' : 'dinner';

    const picks = context.popularItems.slice(0, 3);
    if (picks.length > 0) {
      return `Sir/Ma'am, for ${daypart} ito po ang safe recommendations ngayon based sa system:\n- ${picks.join('\n- ')}\nPwede rin po ninyo itanong: "What are the menu categories here?" or "Show me promos and bundles."`;
    }

    return `For ${daypart}, best offer po ngayon is one main + one beverage + one dessert combo. Sabihin lang po ninyo yung category para mailista ko exact items na available.`;
  }

  if (
    hasAnyWord(normalized, ['category', 'categories'])
    || (hasAnyWord(normalized, ['menu']) && hasAnyWord(normalized, ['available', 'list', 'show', 'what', 'here', 'have']))
  ) {
    if (categories.length === 0) {
      return `Wala pang available menu categories sa system ngayon.`;
    }

    const lines = categories
      .map((category) => `- ${category} (${groupedMenu.get(category)?.length || 0})`)
      .join('\n');
    return `Sir/Ma'am, ito po ang available menu categories:\n${lines}`;
  }

  const askedCategory = findCategoryFromMessage(userMessage, categories);
  if (askedCategory) {
    const items = groupedMenu.get(askedCategory) || [];
    if (!items.length) {
      return `Sa ngayon, wala pang items under ${askedCategory}.`;
    }

    const lines = items
      .slice(0, 12)
      .map((item) => `- ${item.name} (${formatAmount(item.price, context.currencySymbol)})`)
      .join('\n');
    return `Sir/Ma'am, ito po ang items under ${askedCategory}:\n${lines}${items.length > 12 ? '\n- ...and more' : ''}`;
  }

  if (hasAnyPhrase(normalized, ['mode of payment']) || hasAnyWord(normalized, ['payment', 'pay'])) {
    return `Available payment options po: ${context.paymentModes.join(', ') || 'Not configured'}.`;
  }

  if (hasAnyPhrase(normalized, ['how much']) || hasAnyWord(normalized, ['price', 'cost'])) {
    const matchedItems = findItemsFromMessage(userMessage, context);
    if (matchedItems.length > 0) {
      const lines = matchedItems
        .map((item) => `- ${item.name}: ${formatAmount(item.price, context.currencySymbol)} (${item.category})`)
        .join('\n');
      return `Sir/Ma'am, ito po ang matching prices:\n${lines}`;
    }
  }

  if (hasAnyWord(normalized, ['menu']) && hasAnyWord(normalized, ['what', 'show', 'list', 'here'])) {
    const top = context.menuCatalog.slice(0, 12).map((item) => `- ${item.name} (${item.category})`).join('\n');
    return `Sir/Ma'am, ito po ang menu items na available sa system ngayon:\n${top}${context.menuCatalog.length > 12 ? '\n- ...and more' : ''}`;
  }

  if (lower.includes('summary') || lower.includes('cart') || lower.includes('order')) {
    if (context.cartItems.length === 0) {
      return `Empty pa po ang cart natin. Try po tayo mag-add ng 2-3 items muna, then tanong po kayo ulit for upsell or checkout recommendation.`;
    }

    const lines = context.cartItems
      .slice(0, 5)
      .map((item) => `- ${item.name} x${item.quantity} = ${formatAmount(item.quantity * item.unitPrice, context.currencySymbol)}`)
      .join('\n');

    return `Order summary natin ngayon (${context.orderType}):\n${lines}\nTotal items: ${totalQty}\nEstimated subtotal: ${formatAmount(subtotal, context.currencySymbol)}\nPayment options: ${context.paymentModes.join(', ')}`;
  }

  if (lower.includes('suggest') || lower.includes('upsell') || lower.includes('recommend')) {
    const existing = new Set(context.cartItems.map((item) => item.name));
    const suggestions = context.popularItems.filter((name) => !existing.has(name)).slice(0, 3);

    if (!suggestions.length) {
      return `Nasa cart na po yung top featured items. Suggestion ko po: dagdagan ang beverages or desserts para tumaas ang average ticket.`;
    }

    return `Upsell suggestions po for this order:\n- ${suggestions.join('\n- ')}\nTip: i-partner ang one beverage + one dessert para mas mataas ang average order value.`;
  }

  if (lower.includes('discount') || lower.includes('promo')) {
    return `Safe discount playbook po:\n1) Offer 5% for orders above ${formatAmount(700, context.currencySymbol)}\n2) Mas okay ang combo pricing kaysa direct discount kapag possible\n3) I-tie ang discounts sa slow-moving items or add-ons`;
  }

  return `${LOCAL_FALLBACK_MESSAGE}\nPero kaya ko po tumulong sa menu items, categories, prices, cart summary, payment modes, bundles, promos, at checkout.`;
}

export async function askAssistant(message: string, context: AssistantContext): Promise<AssistantResult> {
  if (!aiEnabled || !aiUrl) {
    return { text: buildLocalReply(message, context), source: 'local' };
  }

  try {
    const systemPrompt = `You are a POS assistant for restaurant staff. Be concise, practical, and operational. Use currency symbol ${context.currencySymbol}. Prefer a polite Filipino/Taglish cashier tone (e.g., "Sir/Ma'am"). Answer only based on the provided POS context. If the request is outside POS context, respond exactly: "${LOCAL_FALLBACK_MESSAGE}"`;
    const contextPrompt = `Order type: ${context.orderType}\nCart items: ${JSON.stringify(context.cartItems)}\nPayment modes: ${context.paymentModes.join(', ')}\nPopular menu items: ${context.popularItems.join(', ')}\nMenu catalog: ${JSON.stringify(context.menuCatalog)}`;

    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(aiApiKey ? { Authorization: `Bearer ${aiApiKey}` } : {}),
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${contextPrompt}\n\nUser request: ${message}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (!aiText || typeof aiText !== 'string') {
      throw new Error('AI response format invalid');
    }

    return { text: aiText.trim() || LOCAL_FALLBACK_MESSAGE, source: 'ai' };
  } catch {
    return { text: buildLocalReply(message, context), source: 'local' };
  }
}
