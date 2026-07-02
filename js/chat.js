// Chat Module
window.appendMessage = function(text, sender, isLoading = false) {
  const container = document.getElementById('chat-messages');
  if (!container) return null;
  
  const id = 'msg-' + Math.random().toString(36).substr(2, 9);
  const isUser = sender === 'user';
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  let contentHtml = '';
  if (isLoading) {
    contentHtml = `
      <div class="flex items-center gap-1.5 text-slate-400">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style="animation-delay: 0.2s"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style="animation-delay: 0.4s"></span>
        <span class="text-xs ml-1 font-medium italic">${text}</span>
      </div>
    `;
  } else {
    let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="text-emerald-400 font-semibold">$1</em>')
                        .replace(/\n/g, '<br>');
    contentHtml = `<p class="leading-relaxed text-xs md:text-sm">${processed}</p>`;
  }
  
  const html = `
    <div class="flex items-start gap-3 max-w-[90%] md:max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : ''} animate-fade-in">
      <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
        isUser ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'
      }">
        <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-3.5 h-3.5"></i>
      </div>
      <div class="space-y-1 w-full">
        <div id="${id}" class="p-4 rounded-2xl ${
          isUser ? 'bg-emerald-500 text-slate-950 rounded-tr-none font-medium' : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none shadow-md'
        }">
          ${contentHtml}
        </div>
        <span class="text-[9px] text-slate-500 block ${isUser ? 'text-right px-1' : 'px-1'}">${isUser ? 'Kamu' : 'FinBot'} • ${timeStr}</span>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', html);
  window.scrollToBottom();
  lucide.createIcons();
  return id;
};

window.replaceLoadingMessage = function(msgId, text, isError = false) {
  const bubble = document.getElementById(msgId);
  if (!bubble) return;
  
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="text-emerald-400 font-semibold">$1</em>')
                      .replace(/\n/g, '<br>');
  
  bubble.innerHTML = `<p class="leading-relaxed text-xs md:text-sm">${processed}</p>`;
  if (isError) {
    bubble.className = 'p-4 rounded-2xl bg-rose-900/20 border border-rose-500/20 text-rose-300 rounded-tl-none shadow-md';
  }
};

window.parseFinanceMessage = function(msg) {
  const lower = msg.toLowerCase();
  let amount = 0;
  
  const cleanMsg = lower.replace(/\./g, '');
  const numMatch = cleanMsg.match(/(\d+)\s*(ribu|rb|jt|juta|m|milyar|rupiah|rp)?/i);
  
  if (numMatch) {
    const rawPart = numMatch[0];
    const valMatch = rawPart.match(/\d+/);
    if (valMatch) {
      let val = parseInt(valMatch[0]);
      if (rawPart.includes('ribu') || rawPart.includes('rb')) val *= 1000;
      else if (rawPart.includes('juta') || rawPart.includes('jt')) val *= 1000000;
      else if (rawPart.includes('milyar')) val *= 1000000000;
      amount = val;
    }
  }
  
  if (amount === 0) {
    const simpleNum = lower.match(/\d+/);
    if (simpleNum) amount = parseInt(simpleNum[0]);
  }
  
  if (amount === 0) return null;
  
  let type = 'Pengeluaran';
  const incomeKeywords = ['gaji', 'bonus', 'dapat', 'terima', 'masuk', 'transferan', 'pemasukan', 'jual'];
  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) {
      type = 'Pemasukan';
      break;
    }
  }
  
  let category = 'Lain-lain';
  const categories = [
    { name: 'Makanan & Minuman', keys: ['makan', 'minum', 'kopi', 'starbucks', 'warteg', 'snack', 'jajan', 'restoran'] },
    { name: 'Transportasi', keys: ['bensin', 'pertalite', 'gojek', 'grab', 'ojek', 'parkir', 'tol', 'tiket'] },
    { name: 'Tagihan & Utilitas', keys: ['listrik', 'token', 'air', 'pdam', 'wifi', 'internet', 'pulsa', 'netflix'] },
    { name: 'Gaya Hidup', keys: ['bioskop', 'nonton', 'baju', 'belanja', 'gaming', 'topup', 'liburan'] },
    { name: 'Kesehatan', keys: ['obat', 'dokter', 'klinik', 'apotek', 'vitamin'] },
    { name: 'Investasi', keys: ['reksadana', 'saham', 'crypto', 'tabungan', 'emas'] },
    { name: 'Gaji & Pendapatan', keys: ['gaji', 'bonus', 'payday', 'proyek', 'freelance'] }
  ];
  
  for (const cat of categories) {
    for (const kw of cat.keys) {
      if (lower.includes(kw)) {
        category = cat.name;
        break;
      }
    }
    if (category !== 'Lain-lain') break;
  }
  
  let description = msg.replace(/\b\d+\s*(ribu|rb|jt|juta|rupiah|rp)?\b/gi, '').trim();
  description = description.replace(/^(beli|isi|bayar|dapat|terima)\s+/gi, '');
  description = description.charAt(0).toUpperCase() + description.slice(1);
  if (description.length < 2) description = msg;
  
  return { amount, type, category, description };
};

// Chat form handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('user-input');
      if (!input) return;
      const message = input.value.trim();
      if (!message) return;
      
      input.value = '';
      window.appendMessage(message, 'user');
      
      const loadingId = window.appendMessage('Menganalisis & menyinkronkan data...', 'bot', true);
      
      setTimeout(async () => {
        const parsed = window.parseFinanceMessage(message);
        
        if (parsed) {
          const newTx = {
            id: 'tx-' + Date.now(),
            date: new Date().toISOString(),
            description: parsed.description,
            category: parsed.category,
            type: parsed.type,
            amount: parsed.amount
          };
          
          let webhookSuccess = false;
          if (window.webhookUrl) {
            try {
              await fetch(window.webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTx)
              });
              webhookSuccess = true;
            } catch (err) {
              console.error('Webhook failed:', err);
            }
          }
          
          window.transactions.unshift(newTx);
          window.saveToLocalStorage();
          window.updateDashboard();
          window.renderCalendar();
          window.renderMonthlySummary();
          
          let reply = `Transaksi berhasil saya catat!\n\n• **Tipe:** ${newTx.type}\n• **Deskripsi:** ${newTx.description}\n• **Kategori:** ${newTx.category}\n• **Jumlah:** Rp ${newTx.amount.toLocaleString('id-ID')}\n\n${webhookSuccess ? '⚡ *Tersinkron ke Google Sheets!*' : '💾 *Tersimpan di database lokal.*'}`;
          
          window.replaceLoadingMessage(loadingId, reply, false);
        } else {
          window.replaceLoadingMessage(loadingId, 'Maaf, saya tidak bisa memahami format transaksi tersebut. Pastikan Anda menyebutkan nominal angka (contoh: "50rb" atau "100000") dan deskripsi transaksi.', true);
        }
      }, 800);
    });
  }
});

