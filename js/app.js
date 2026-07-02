// Main Application Controller
window.transactions = [];
window.webhookUrl = localStorage.getItem('finbot_webhook_url') || '';
window.currentView = 'chat';
window.selectedDateFilter = null;
window.calDate = new Date();

window.monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Initial mock data
const initialMockData = [
  { id: 'tx-1', date: new Date(Date.now() - 48 * 3600000).toISOString(), description: 'Gaji Bulanan Masuk', category: 'Gaji & Pendapatan', type: 'Pemasukan', amount: 8500000 },
  { id: 'tx-2', date: new Date(Date.now() - 24 * 3600000).toISOString(), description: 'Beli Kopi Starbucks', category: 'Makanan & Minuman', type: 'Pengeluaran', amount: 55000 },
  { id: 'tx-3', date: new Date().toISOString(), description: 'Isi token listrik rumah', category: 'Tagihan & Utilitas', type: 'Pengeluaran', amount: 200000 }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  
  const stored = localStorage.getItem('finbot_transactions');
  if (stored) {
    window.transactions = JSON.parse(stored);
  } else {
    window.transactions = [...initialMockData];
    window.saveToLocalStorage();
  }
  
  if (window.webhookUrl) {
    const input = document.getElementById('webhook-url-input');
    if (input) input.value = window.webhookUrl;
  }
  
  window.updateDashboard();
  window.renderCalendar();
  window.renderMonthlySummary();
  window.addInitialGreeting();
  window.scrollToBottom();
});

window.saveToLocalStorage = function() {
  localStorage.setItem('finbot_transactions', JSON.stringify(window.transactions));
};

window.switchView = function(view) {
  window.currentView = view;
  const viewChat = document.getElementById('view-chat');
  const viewReport = document.getElementById('view-report');
  const dtChat = document.getElementById('dt-tab-chat');
  const dtReport = document.getElementById('dt-tab-report');
  const mbChat = document.getElementById('mobile-tab-chat');
  const mbReport = document.getElementById('mobile-tab-report');

  if (view === 'chat') {
    if (viewChat) viewChat.classList.remove('hidden');
    if (viewReport) viewReport.classList.add('hidden');
    if (dtChat) {
      dtChat.className = 'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 bg-emerald-500 text-slate-950 shadow-md';
    }
    if (dtReport) {
      dtReport.className = 'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-slate-200';
    }
    if (mbChat) mbChat.className = 'flex flex-col items-center gap-1 transition-all duration-200 text-emerald-400';
    if (mbReport) mbReport.className = 'flex flex-col items-center gap-1 transition-all duration-200 text-slate-500';
    setTimeout(() => window.scrollToBottom(), 50);
  } else {
    if (viewChat) viewChat.classList.add('hidden');
    if (viewReport) viewReport.classList.remove('hidden');
    if (dtChat) {
      dtChat.className = 'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-slate-200';
    }
    if (dtReport) {
      dtReport.className = 'flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 bg-emerald-500 text-slate-950 shadow-md';
    }
    if (mbChat) mbChat.className = 'flex flex-col items-center gap-1 transition-all duration-200 text-slate-500';
    if (mbReport) mbReport.className = 'flex flex-col items-center gap-1 transition-all duration-200 text-emerald-400';
    window.updateDashboard();
    window.renderCalendar();
    window.renderMonthlySummary();
  }
};

window.scrollToBottom = function() {
  const container = document.getElementById('chat-messages');
  if (container) container.scrollTop = container.scrollHeight;
};

window.toggleModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.toggle('hidden');
};

window.openConfirmModal = function(title, msg, onConfirm) {
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = msg;
  
  const actionBtn = document.getElementById('confirm-action-btn');
  if (actionBtn) {
    actionBtn.onclick = () => {
      onConfirm();
      window.closeConfirmModal();
    };
  }
  
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeConfirmModal = function() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.add('hidden');
};

window.triggerResetConfirmation = function() {
  window.openConfirmModal(
    'Reset Seluruh Data?',
    'Tindakan ini akan menghapus semua riwayat finansial Anda. Data tidak dapat dipulihkan.',
    () => {
      window.transactions = [];
      window.saveToLocalStorage();
      window.updateDashboard();
      window.renderCalendar();
      window.renderMonthlySummary();
      window.showSystemMessage('Database berhasil direset.', 'success');
    }
  );
};

window.triggerDeleteTransaction = function(id) {
  window.openConfirmModal(
    'Hapus Transaksi?',
    'Apakah Anda yakin ingin menghapus transaksi ini?',
    () => {
      window.transactions = window.transactions.filter(t => t.id !== id);
      window.saveToLocalStorage();
      window.updateDashboard();
      window.renderCalendar();
      window.renderMonthlySummary();
      window.showSystemMessage('Transaksi berhasil dihapus.', 'info');
    }
  );
};

window.updateDashboard = function() {
  const tbody = document.getElementById('sheets-table-body');
  const emptyState = document.getElementById('no-data-state');
  
  if (tbody) tbody.innerHTML = '';
  
  let filteredTx = [...window.transactions];
  if (window.selectedDateFilter) {
    filteredTx = window.transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getDate() === window.selectedDateFilter.getDate() &&
             tDate.getMonth() === window.selectedDateFilter.getMonth() &&
             tDate.getFullYear() === window.selectedDateFilter.getFullYear();
    });
  }
  
  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };
  
  if (filteredTx.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    safeSetText('total-income', 'Rp 0');
    safeSetText('total-expense', 'Rp 0');
    safeSetText('total-balance', 'Rp 0');
    safeSetText('total-transactions', '0');
    const bars = document.getElementById('category-bars');
    if (bars) bars.innerHTML = '<p class="text-xs text-slate-600 italic">Belum ada data pengeluaran.</p>';
    return;
  }
  
  if (emptyState) emptyState.classList.add('hidden');
  
  let income = 0, expense = 0;
  let categoryStats = {};
  
  filteredTx.forEach((tx, index) => {
    const amountNum = parseFloat(tx.amount);
    if (tx.type === 'Pemasukan') {
      income += amountNum;
    } else {
      expense += amountNum;
      categoryStats[tx.category] = (categoryStats[tx.category] || 0) + amountNum;
    }
    
    const dateObj = new Date(tx.date);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' + 
                          dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-900/60 transition-colors border-b border-slate-800 text-slate-300';
    row.innerHTML = `
      <td class="py-2.5 px-4 text-center border-r border-slate-800 text-slate-500 font-semibold">${index + 1}</td>
      <td class="py-2.5 px-4 border-r border-slate-800 text-slate-400">${formattedDate}</td>
      <td class="py-2.5 px-4 border-r border-slate-800 text-slate-200 font-medium">${tx.description}</td>
      <td class="py-2.5 px-4 border-r border-slate-800">
        <span class="px-2 py-0.5 rounded-full text-[9px] bg-slate-800 border border-slate-700 text-slate-400">${tx.category}</span>
      </td>
      <td class="py-2.5 px-4 border-r border-slate-800">
        <span class="font-bold text-[9px] uppercase tracking-wider ${tx.type === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'}">${tx.type}</span>
      </td>
      <td class="py-2.5 px-4 text-right font-bold ${tx.type === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'}">
        ${tx.type === 'Pemasukan' ? '+' : '-'} Rp ${amountNum.toLocaleString('id-ID')}
      </td>
      <td class="py-2.5 px-4 text-center">
        <button onclick="window.triggerDeleteTransaction('${tx.id}')" class="p-1 hover:text-rose-400 text-slate-600 rounded-lg hover:bg-rose-500/10 transition">
          <i data-lucide="trash" class="w-3.5 h-3.5"></i>
        </button>
      </td>
    `;
    if (tbody) tbody.appendChild(row);
  });
  
  window.renderCategoryBars(categoryStats, expense);
  
  let globalIncome = 0, globalExpense = 0;
  window.transactions.forEach(t => {
    const val = parseFloat(t.amount);
    if (t.type === 'Pemasukan') globalIncome += val;
    else globalExpense += val;
  });
  
  const balance = globalIncome - globalExpense;
  safeSetText('total-income', 'Rp ' + globalIncome.toLocaleString('id-ID'));
  safeSetText('total-expense', 'Rp ' + globalExpense.toLocaleString('id-ID'));
  
  const balanceEl = document.getElementById('total-balance');
  if (balanceEl) {
    balanceEl.innerText = 'Rp ' + balance.toLocaleString('id-ID');
    balanceEl.className = `font-bold text-xs md:text-sm ${balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`;
  }
  
  safeSetText('total-transactions', window.transactions.length);
  lucide.createIcons();
};

window.renderCategoryBars = function(categoryStats, totalExpense) {
  const container = document.getElementById('category-bars');
  if (!container) return;
  container.innerHTML = '';
  
  if (totalExpense === 0 || Object.keys(categoryStats).length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-600 italic">Belum ada pengeluaran yang terekam.</p>';
    return;
  }
  
  const sorted = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  
  sorted.forEach(([cat, amt]) => {
    const pct = Math.round((amt / totalExpense) * 100);
    const div = document.createElement('div');
    div.className = 'space-y-1';
    div.innerHTML = `
      <div class="flex justify-between text-[11px] font-semibold">
        <span class="text-slate-300">${cat}</span>
        <span class="text-slate-400">Rp ${amt.toLocaleString('id-ID')} <span class="text-emerald-400">(${pct}%)</span></span>
      </div>
      <div class="w-full bg-slate-900 rounded-full h-1 border border-slate-800">
        <div class="bg-emerald-500 h-1 rounded-full" style="width: ${pct}%"></div>
      </div>
    `;
    container.appendChild(div);
  });
};

window.showSystemMessage = function(text, type = 'info') {
  const colors = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    error: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-400'
  };
  
  const alert = document.createElement('div');
  alert.className = `fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto px-4 py-3 border rounded-xl shadow-2xl z-50 transition-all duration-300 text-xs font-semibold flex items-center gap-2 ${colors[type]}`;
  alert.innerHTML = `<i data-lucide="info" class="w-4 h-4"></i> ${text}`;
  document.body.appendChild(alert);
  lucide.createIcons();
  
  setTimeout(() => {
    alert.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => alert.remove(), 300);
  }, 3000);
};

window.quickInput = function(text) {
  const input = document.getElementById('user-input');
  if (input) {
    input.value = text;
    input.focus();
  }
};

window.clearChat = function() {
  const container = document.getElementById('chat-messages');
  if (container) {
    container.innerHTML = '';
    window.addInitialGreeting();
  }
};

window.addInitialGreeting = function() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  if (container.children.length === 0) {
    const greetingHtml = `
      <div class="flex items-start gap-3 max-w-[90%] md:max-w-[75%] animate-fade-in">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <i data-lucide="bot" class="w-4 h-4"></i>
        </div>
        <div class="space-y-1.5">
          <div class="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl rounded-tl-none text-xs md:text-sm text-slate-300 leading-relaxed shadow-sm">
            Halo! Saya <span class="text-emerald-400 font-semibold">FinBot AI</span>. Ketik pengeluaran atau pemasukan kamu secara alami di bawah ini. Saya akan menganalisisnya dan menyimpannya langsung ke Google Sheets.
            <div class="mt-3 pt-3 border-t border-slate-800/60 space-y-2 text-[11px] text-slate-400">
              <p class="font-medium text-slate-300">Contoh format input:</p>
              <p class="flex items-center gap-1.5"><i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> "Beli kopi susu starbucks 45 ribu"</p>
              <p class="flex items-center gap-1.5"><i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> "Gaji bulanan masuk 7.500.000 rupiah"</p>
              <p class="flex items-center gap-1.5"><i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> "Beli bensin motor 50rb sore tadi"</p>
            </div>
          </div>
          <span class="text-[9px] text-slate-500 block px-1">Sistem Otomatis • Baru saja</span>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', greetingHtml);
    lucide.createIcons();
  }
};

window.addEventListener("load", () => {

    const fill = document.getElementById("loading-fill");
    const percent = document.getElementById("loading-percent");
    const screen = document.getElementById("loading-screen");
    const text = document.getElementById("loading-text");

    const status = [

        "Menghubungkan AI...",
        "Memuat transaksi...",
        "Menyiapkan Dashboard...",
        "Menghitung saldo...",
        "Menyusun laporan...",
        "Selesai"

    ];

    let progress = 0;

    const interval = setInterval(()=>{

        progress++;

        fill.style.width = progress+"%";
        percent.innerHTML = progress+"%";

        if(progress==15) text.innerHTML=status[0];
        if(progress==35) text.innerHTML=status[1];
        if(progress==55) text.innerHTML=status[2];
        if(progress==75) text.innerHTML=status[3];
        if(progress==90) text.innerHTML=status[4];

        if(progress>=100){

            clearInterval(interval);

            text.innerHTML=status[5];

            setTimeout(()=>{

                screen.classList.add("loading-hide");

            },400);

        }

    },20);

});