function renderDashboard(){

let income=0;

let expense=0;

table.innerHTML="";

transactions.forEach(tx=>{

if(
tx.type==="Pemasukan"
)

income+=tx.amount;

else

expense+=tx.amount;

table.innerHTML+=`

<tr>

<td>

${new Date()
.toLocaleDateString()}

</td>

<td>

${tx.description}

</td>

<td>

${tx.type}

</td>

<td>

Rp ${tx.amount
.toLocaleString()}

</td>

</tr>

`;

});

balance.innerText=

"Rp "+

(income-expense)

.toLocaleString();

incomeEl.innerText=
"Rp "+income.toLocaleString();

expenseEl.innerText=
"Rp "+expense.toLocaleString();

count.innerText=
transactions.length;

}