let currentCampaign = null;

async function loadCampaign(campaignId) {
  const loading = document.getElementById('campaignLoading');
  const content = document.getElementById('campaignContent');
  const notFound = document.getElementById('campaignNotFound');
  
  loading.classList.remove('hidden');
  content.classList.add('hidden');
  notFound.classList.add('hidden');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const campaign = MockContract.campaigns.find(c => c.id === parseInt(campaignId));
  
  if (!campaign) {
    loading.classList.add('hidden');
    notFound.classList.remove('hidden');
    return;
  }
  
  currentCampaign = campaign;
  renderCampaignDetail(campaign);
  
  loading.classList.add('hidden');
  content.classList.remove('hidden');
}

function renderCampaignDetail(c) {
  const progress = calculateProgress(c.raised, c.goal);
  const isFunded = c.raised >= c.goal;
  const isEnded = c.deadline < Date.now();
  const isCreator = AppState.userAddress && c.creator.toLowerCase() === AppState.userAddress.toLowerCase();
  
  document.getElementById('cImage').textContent = c.image;
  document.getElementById('cTitle').textContent = c.title;
  document.getElementById('cDescription').innerHTML = c.description.replace(/\n/g, '<br>');
  document.getElementById('cCreator').textContent = shortenAddress(c.creator);
  document.getElementById('cCategory').textContent = {
    tech: '💻 Технологии',
    social: '🤝 Социальные',
    eco: '🌱 Экология',
    art: '🎨 Искусство',
    other: '📦 Другое'
  }[c.category] || c.category;
  document.getElementById('cDeadline').textContent = formatDate(c.deadline);
  
  document.getElementById('cRaised').textContent = formatEther(c.raised);
  document.getElementById('cGoal').textContent = formatEther(c.goal);
  document.getElementById('cProgress').textContent = progress;
  document.getElementById('cProgressEl').value = progress;
  document.getElementById('sideGoal').textContent = formatEther(c.goal);
  
  const statusEl = document.getElementById('cStatus');
  if (isEnded) {
    statusEl.textContent = isFunded ? '✅ Финансирована' : '❌ Не удалась';
    statusEl.style.color = isFunded ? '#48bb78' : '#f56565';
  } else if (isFunded) {
    statusEl.textContent = '🎯 Цель достигнута!';
    statusEl.style.color = '#48bb78';
  } else {
    const days = Math.ceil((c.deadline - Date.now()) / (1000*60*60*24));
    statusEl.textContent = `⏳ ${days} дн. осталось`;
    statusEl.style.color = '#667eea';
  }
  
  document.getElementById('cContract').textContent = '0x' + 'abc123'.repeat(6);
  document.getElementById('cContributors').textContent = Math.floor(Number(c.raised) / 1e17) + 5;
  
  // Управление кнопками
  const contributeForm = document.getElementById('contributeForm');
  const contributeBtn = document.getElementById('contributeBtn');
  const withdrawCard = document.getElementById('withdrawCard');
  const withdrawBtn = document.getElementById('withdrawBtn');
  
  if (isEnded || isFunded) {
    contributeForm.style.display = 'none';
  } else {
    contributeForm.style.display = 'flex';
  }
  
  if (isCreator && isFunded && !isEnded) {
    withdrawCard.style.display = 'block';
  } else {
    withdrawCard.style.display = 'none';
  }
  
  withdrawBtn?.addEventListener('click', async () => {
    if (!AppState.isConnected) {
      showToast('🔗 Подключите кошелёк', 'info');
      return;
    }
    
    try {
      showToast('⏳ Подтвердите транзакцию вывода...', 'info');
      await new Promise(r => setTimeout(r, 1500));
      
      await MockContract.withdraw(c.id);
      showToast('✅ Средства успешно выведены!', 'success');
      withdrawCard.style.display = 'none';
      
      // Обновляем статус
      document.getElementById('cStatus').textContent = '💰 Средства выведены';
      document.getElementById('cTxStatus').textContent = 'Completed';
      
    } catch (err) {
      showToast('❌ Ошибка: ' + err.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Получаем ID из URL
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('id');
  
  if (campaignId) {
    loadCampaign(campaignId);
  } else {
    document.getElementById('campaignLoading').classList.add('hidden');
    document.getElementById('campaignNotFound').classList.remove('hidden');
  }
  
  document.getElementById('contributeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!AppState.isConnected) {
      showToast('🔗 Подключите кошелёк для вклада', 'info');
      return;
    }
    
    const amountInput = document.getElementById('contributeAmount');
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount < 0.01) {
      showToast('❌ Минимальный вклад: 0.01 ETH', 'error');
      return;
    }
    
    const btn = document.getElementById('contributeBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Обработка...';
    
    try {
      showToast('⏳ Подтвердите транзакцию в кошельке...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await MockContract.contribute(currentCampaign.id, ethersEther(amount));
      
      showToast(`✅ Вклад ${amount} ETH успешно внесён!`, 'success');
      loadCampaign(currentCampaign.id); 
      
    } catch (err) {
      showToast('❌ Ошибка транзакции: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💸 Поддержать проект';
      amountInput.value = '';
    }
  });
  
  window.shareOnTwitter = () => {
    if (!currentCampaign) return;
    const text = encodeURIComponent(`Поддержите "${currentCampaign.title}" на CrowdChain!`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  window.onWalletConnected = () => {
    if (currentCampaign) renderCampaignDetail(currentCampaign);
  };
});