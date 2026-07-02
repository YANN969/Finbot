// Webhook Module
window.saveWebhookUrl = function() {
  const input = document.getElementById('webhook-url-input');
  if (!input) return;
  
  const url = input.value.trim();
  if (url === '') {
    localStorage.removeItem('finbot_webhook_url');
    window.webhookUrl = '';
    window.showSystemMessage('Mode Simulasi Offline aktif.', 'info');
  } else if (url.startsWith('https://script.google.com/')) {
    localStorage.setItem('finbot_webhook_url', url);
    window.webhookUrl = url;
    window.showSystemMessage('Berhasil terhubung ke Google Sheets!', 'success');
    window.toggleModal('setup-modal');
  } else {
    window.showSystemMessage('URL Google Web App tidak valid!', 'error');
  }
};

window.copyToClipboard = function() {
  const block = document.getElementById('script-code-block');
  if (!block) return;
  
  const code = block.innerText;
  const textarea = document.createElement('textarea');
  textarea.value = code;
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    window.showSystemMessage('Kode berhasil disalin ke clipboard!', 'success');
  } catch (err) {
    window.showSystemMessage('Gagal menyalin kode.', 'error');
  }
  
  document.body.removeChild(textarea);
};

window.sendToGoogleSheets = async function(transaction){

  const webhook =
  localStorage.getItem(
    "finbot_webhook_url"
  );

  if(!webhook){

    console.log(
      "Webhook belum disetting"
    );

    return false;
  }

  try{

    const response =
    await fetch(
      webhook,
      {

        method:"POST",

        headers:{
          "Content-Type":
          "application/json"
        },

        body:JSON.stringify({

          date:
          transaction.date ||
          new Date().toISOString(),

          description:
          transaction.description,

          amount:
          Number(
            transaction.amount
          ),

          category:
          transaction.category ||
          "Lainnya",

          type:
          transaction.type

        })

      }
    );

    console.log(
      "Sync Google Sheets berhasil"
    );

    return true;

  }catch(err){

    console.error(
      "Google Sheets Error:",
      err
    );

    window.showSystemMessage(

      "Gagal kirim ke Google Sheets",

      "error"

    );

    return false;

  }

};