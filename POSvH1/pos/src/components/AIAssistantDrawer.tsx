import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { Button, Input } from './ui';
import { usePOSStore } from '../store/pos-store';
import { askAssistant } from '../lib/ai-assistant';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  source?: 'ai' | 'local';
}

const AIAssistantDrawer = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'AI assistant is ready. Ask for upsell ideas, discount guidance, or a checkout summary.',
      source: 'local',
    },
  ]);

  const {
    activeOrders,
    selectedOrderType,
    paymentModes,
    menuItems,
    currencySymbol,
  } = usePOSStore();

  const context = useMemo(
    () => ({
      currencySymbol: currencySymbol || '₱',
      orderType: selectedOrderType,
      cartItems: activeOrders.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.selectedVariant?.price || item.price,
      })),
      paymentModes,
      popularItems: menuItems.filter((item) => item.special_dish === 1).map((item) => item.name),
      menuCatalog: menuItems.map((item) => ({
        name: item.name,
        category: item.course_label || item.course || 'Uncategorized',
        price: item.price,
      })),
    }),
    [activeOrders, selectedOrderType, paymentModes, menuItems, currencySymbol]
  );

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-ai-assistant', openHandler as EventListener);

    const keyHandler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', keyHandler);

    return () => {
      window.removeEventListener('open-ai-assistant', openHandler as EventListener);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    const result = await askAssistant(trimmed, context);

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: result.text, source: result.source },
    ]);
    setLoading(false);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl border-l border-gray-200 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-slate-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <div>
                <p className="text-sm font-semibold">POS AI Assistant</p>
                <p className="text-[11px] text-slate-200">Ctrl/Cmd + J</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] opacity-80">
                    {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    <span>
                      {message.role === 'user' ? 'You' : `Assistant${message.source === 'local' ? ' (local)' : ''}`}
                    </span>
                  </div>
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-xs text-slate-500">Assistant is thinking...</div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white space-y-2">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything about menu, prices, categories, cart, promos, or checkout..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              <Button onClick={submit} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2 text-xs">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setInput('Give me upsell suggestions for this cart')}
              >
                Upsell
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setInput('Summarize this order before payment')}
              >
                Summary
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setInput('What discount strategy should I use right now?')}
              >
                Discounts
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AIAssistantDrawer;
