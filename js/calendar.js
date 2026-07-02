// Calendar Module
window.renderCalendar = function() {
  const container = document.getElementById('calendar-days');
  const label = document.getElementById('calendar-month-year');
  if (!container || !label) return;
  
  container.innerHTML = '';
  
  const year = window.calDate.getFullYear();
  const month = window.calDate.getMonth();
  
  label.innerText = `${window.monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();
  
  for (let i = firstDay; i > 0; i--) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'py-2 text-[10px] text-slate-800 text-center select-none cursor-default';
    dayDiv.innerText = prevLastDate - i + 1;
    container.appendChild(dayDiv);
  }
  
  for (let day = 1; day <= lastDate; day++) {
    const dayDiv = document.createElement('div');
    let cellClass = 'py-2 relative rounded-lg flex flex-col items-center justify-center cursor-pointer transition hover:bg-slate-800 text-xs ';
    
    const isToday = (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear());
    if (isToday) {
      cellClass += 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold';
    } else {
      cellClass += 'text-slate-300 font-semibold';
    }
    
    if (window.selectedDateFilter && 
        window.selectedDateFilter.getDate() === day && 
        window.selectedDateFilter.getMonth() === month && 
        window.selectedDateFilter.getFullYear() === year) {
      cellClass += ' ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400';
    }
    
    dayDiv.className = cellClass;
    dayDiv.innerHTML = `<span>${day}</span>`;
    
    const dayTx = window.transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getDate() === day && tDate.getMonth() === month && tDate.getFullYear() === year;
    });
    
    if (dayTx.length > 0) {
      const dotContainer = document.createElement('div');
      dotContainer.className = 'flex gap-0.5 mt-0.5 justify-center';
      const hasIncome = dayTx.some(t => t.type === 'Pemasukan');
      const hasExpense = dayTx.some(t => t.type === 'Pengeluaran');
      if (hasIncome) dotContainer.innerHTML += '<span class="w-1 h-1 rounded-full bg-emerald-400"></span>';
      if (hasExpense) dotContainer.innerHTML += '<span class="w-1 h-1 rounded-full bg-rose-500"></span>';
      dayDiv.appendChild(dotContainer);
    }
    
    dayDiv.addEventListener('click', () => window.setDateFilter(new Date(year, month, day)));
    container.appendChild(dayDiv);
  }
};

window.changeMonth = function(direction) {
  window.calDate.setMonth(window.calDate.getMonth() + direction);
  window.renderCalendar();
};

window.setDateFilter = function(dateObj) {
  window.selectedDateFilter = dateObj;
  const formatted = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const indicator = document.getElementById('calendar-filter-indicator');
  const filterText = document.getElementById('filter-date-text');
  if (indicator) indicator.classList.remove('hidden');
  if (filterText) filterText.innerText = `Menampilkan transaksi tanggal: ${formatted}`;
  
  window.renderCalendar();
  window.updateDashboard();
};

window.clearDateFilter = function() {
  window.selectedDateFilter = null;
  const indicator = document.getElementById('calendar-filter-indicator');
  if (indicator) indicator.classList.add('hidden');
  window.renderCalendar();
  window.updateDashboard();
};

window.renderMonthlySummary = function() {
  const container = document.getElementById('monthly-summary-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (window.transactions.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-600 italic">Belum ada histori finansial bulanan.</p>';
    return;
  }
  
  const groups = {};
  window.transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) {
      groups[key] = {
        label: `${window.monthNames[date.getMonth()]} ${date.getFullYear()}`,
        income: 0,
        expense: 0
      };
    }
    if (t.type === 'Pemasukan') groups[key].income += parseFloat(t.amount);
    else groups[key].expense += parseFloat(t.amount);
  });
  
  const sorted = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  
  sorted.forEach(key => {
    const g = groups[key];
    const net = g.income - g.expense;
    const row = document.createElement('div');
    row.className = 'p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs';
    row.innerHTML = `
      <div>
        <span class="font-extrabold text-slate-200 block">${g.label}</span>
        <span class="text-[10px] text-slate-500">Bersih: <span class="font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}">Rp ${net.toLocaleString('id-ID')}</span></span>
      </div>
      <div class="text-right space-y-0.5">
        <span class="text-[10px] text-emerald-400 block font-semibold">+ ${g.income.toLocaleString('id-ID')}</span>
        <span class="text-[10px] text-rose-400 block font-semibold">- ${g.expense.toLocaleString('id-ID')}</span>
      </div>
    `;
    container.appendChild(row);
  });
};