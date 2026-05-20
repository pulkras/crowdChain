function renderCampaignCard(campaign) {
  const progress = calculateProgress(campaign.raised, campaign.goal);
  const daysLeft = Math.ceil((campaign.deadline - Date.now()) / (1000 * 60 * 60 * 24));
  const isFunded = campaign.raised >= campaign.goal;
  const isEnded = campaign.deadline < Date.now();
  
  const statusText = isEnded 
    ? (isFunded ? '✅ Финансирована' : '❌ Не удалась') 
    : (isFunded ? '🎯 Цель достигнута!' : `⏳ ${daysLeft} дн.`);
  
  return `
    <article class="card" data-id="${campaign.id}" data-category="${campaign.category}">
      <div class="card-image">${campaign.image}</div>
      <div class="card-body">
        <h3 class="card-title">${campaign.title}</h3>
        <p class="card-desc">${campaign.description}</p>
        
        <div class="card-meta">
          <span>👤 ${shortenAddress(campaign.creator)}</span>
          <span>📅 ${formatDate(campaign.deadline)}</span>
        </div>
        
        <div class="progress-wrapper">
          <div class="progress-label">
            <span>${formatEther(campaign.raised)} ETH</span>
            <span>${progress}%</span>
          </div>
          <progress value="${progress}" max="100"></progress>
          <div class="progress-label" style="margin-top: 0.25rem;">
            <small>Цель: ${formatEther(campaign.goal)} ETH</small>
            <small style="color: ${isFunded ? '#48bb78' : '#667eea'}">${statusText}</small>
          </div>
        </div>
      </div>
      <div class="card-actions">
        <a href="campaign.html?id=${campaign.id}" class="btn btn-secondary" style="flex:1">
          Подробнее
        </a>
        ${!isEnded && !isFunded ? `
          <button class="btn btn-primary contribute-btn" data-id="${campaign.id}">
            💰 Вложить
          </button>
        ` : ''}
      </div>
    </article>
  `;
}

function renderCampaigns(campaigns) {
  const grid = document.getElementById('campaignsGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (!campaigns.length) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  grid.innerHTML = campaigns.map(renderCampaignCard).join('');
  
  document.querySelectorAll('.contribute-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const campaignId = parseInt(btn.dataset.id);
      handleContribute(campaignId);
    });
  });
}

function filterCampaigns() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const status = document.getElementById('statusFilter').value;
  
  let filtered = [...MockContract.campaigns];

  if (search) {
    filtered = filtered.filter(c => 
      c.title.toLowerCase().includes(search) || 
      c.description.toLowerCase().includes(search)
    );
  }

  if (category) {
    filtered = filtered.filter(c => c.category === category);
  }

  if (status) {
    filtered = filtered.filter(c => {
      const isFunded = c.raised >= c.goal;
      const isEnded = c.deadline < Date.now();
      
      if (status === 'active') return !isEnded && !isFunded;
      if (status === 'funded') return isFunded && !isEnded;
      if (status === 'ended') return isEnded;
      return true;
    });
  }
  
  renderCampaigns(filtered);
}

async function handleContribute(campaignId) {
  if (!AppState.isConnected) {
    showToast('🔗 Сначала подключите кошелёк', 'info');
    return;
  }
  
  const campaign = MockContract.campaigns.find(c => c.id === campaignId);
  if (!campaign) return;
  
  const amount = prompt(
    `Внесите вклад в "${campaign.title}"\n\nДоступно: ~10 ETH (тест)\nМинимум: 0.01 ETH`,
    '0.1'
  );
  
  if (!amount) return;
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum < 0.01) {
    showToast('❌ Минимальный вклад: 0.01 ETH', 'error');
    return;
  }
  
  try {
    showToast('⏳ Подтвердите транзакцию в кошельке...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await MockContract.contribute(campaignId, ethersEther(amount));
    
    showToast(`✅ Вклад ${amount} ETH успешно внесён!`, 'success');
    filterCampaigns();
    
  } catch (err) {
    showToast('❌ Ошибка транзакции: ' + err.message, 'error');
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCampaigns(MockContract.campaigns);

  document.getElementById('searchInput')?.addEventListener('input', filterCampaigns);
  document.getElementById('categoryFilter')?.addEventListener('change', filterCampaigns);
  document.getElementById('statusFilter')?.addEventListener('change', filterCampaigns);

  window.onWalletConnected = () => {
    showToast('🎉 Теперь вы можете вносить вклады!', 'success');
  };
});