const AppState = {
  isConnected: false,
  userAddress: null,
  campaigns: [],
  currentCampaignId: null
};

const MockContract = {
  campaigns: [
    {
      id: 0,
      title: "EcoBottle — Умная бутылка для воды",
      description: "Бутылка с фильтром и напоминанием о питье воды. Помогает заботиться о здоровье и экологии.",
      goal: ethersEther("50"), // 50 ETH
      raised: ethersEther("32.5"),
      deadline: Date.now() + 14 * 24 * 60 * 60 * 1000, // +14 дней
      category: "tech",
      image: "🌱",
      creator: "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE12"
    },
    {
      id: 1,
      title: "EduKids — Онлайн-школа для детей",
      description: "Интерактивная платформа с игровыми уроками по программированию для детей 7-12 лет.",
      goal: ethersEther("100"),
      raised: ethersEther("78.2"),
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "social",
      image: "🎓",
      creator: "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
    },
    {
      id: 2,
      title: "GreenCity — Вертикальный сад",
      description: "Система автоматического полива и мониторинга для городских вертикальных садов.",
      goal: ethersEther("30"),
      raised: ethersEther("12.1"),
      deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
      category: "eco",
      image: "🏙️",
      creator: "0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C"
    }
  ],

  async createCampaign(data) {
    const newCampaign = {
      id: this.campaigns.length,
      ...data,
      raised: BigInt(0),
      deadline: Date.now() + data.duration * 24 * 60 * 60 * 1000,
      creator: AppState.userAddress
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  },

  async contribute(campaignId, amount) {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Кампания не найдена");
    campaign.raised += amount;
    return campaign;
  },

  async withdraw(campaignId) {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Кампания не найдена");
    if (campaign.raised < campaign.goal) {
      throw new Error("Цель не достигнута");
    }
    return { success: true, amount: campaign.raised };
  }
};

function ethersEther(value) {
  return BigInt(Math.floor(parseFloat(value) * 1e18));
}

function formatEther(value) {
  // Имитация ethers.formatEther
  return (Number(value) / 1e18).toFixed(2);
}

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function calculateProgress(raised, goal) {
  return Math.min(100, Math.round((Number(raised) / Number(goal)) * 100));
}

async function connectWallet() {

  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAddress = "0x" + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      AppState.isConnected = true;
      AppState.userAddress = mockAddress;
      
      localStorage.setItem('crowdchain_wallet', mockAddress);
      
      resolve(mockAddress);
    }, 800);
  });
}

function checkExistingWallet() {
  const saved = localStorage.getItem('crowdchain_wallet');
  if (saved) {
    AppState.isConnected = true;
    AppState.userAddress = saved;
    return true;
  }
  return false;
}

function disconnectWallet() {
  AppState.isConnected = false;
  AppState.userAddress = null;
  localStorage.removeItem('crowdchain_wallet');
  updateWalletUI();
}

function updateWalletUI() {
  const connectBtn = document.getElementById('connectWallet');
  const userAddressEl = document.getElementById('userAddress');
  const disconnectBtn = document.getElementById('disconnectWallet');
  
  if (!connectBtn) return;
  
  if (AppState.isConnected && AppState.userAddress) {
    connectBtn.classList.add('hidden');
    userAddressEl.textContent = shortenAddress(AppState.userAddress);
    userAddressEl.classList.remove('hidden');
    if (disconnectBtn) disconnectBtn.classList.remove('hidden');
  } else {
    connectBtn.classList.remove('hidden');
    userAddressEl.classList.add('hidden');
    if (disconnectBtn) disconnectBtn.classList.add('hidden');
  }
}

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function validateForm(formData, rules) {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field]?.trim();
    
    if (rule.required && !value) {
      errors[field] = rule.message || 'Поле обязательно для заполнения';
      continue;
    }
    
    if (rule.min && value && value.length < rule.min) {
      errors[field] = `Минимум ${rule.min} символов`;
      continue;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.errorMessage || 'Неверный формат';
      continue;
    }
    
    if (rule.type === 'number' && value && isNaN(parseFloat(value))) {
      errors[field] = 'Введите число';
      continue;
    }
    
    if (rule.type === 'number' && rule.minValue && parseFloat(value) < rule.minValue) {
      errors[field] = `Минимальное значение: ${rule.minValue}`;
    }
  }
  
  return errors;
}

function showError(inputEl, message) {
  const errorEl = inputEl.closest('.form-group')?.querySelector('.error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
  inputEl.style.borderColor = '#f56565';
}

function clearError(inputEl) {
  const errorEl = inputEl.closest('.form-group')?.querySelector('.error');
  if (errorEl) errorEl.classList.remove('show');
  inputEl.style.borderColor = '#e2e8f0';
}

document.addEventListener('DOMContentLoaded', () => {
  if (checkExistingWallet()) {
    updateWalletUI();
  }

  const connectBtn = document.getElementById('connectWallet');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      connectBtn.disabled = true;
      connectBtn.textContent = 'Подключение...';
      
      try {
        await connectWallet();
        updateWalletUI();
        showToast('✅ Кошелёк подключён!', 'success');
        
        if (typeof onWalletConnected === 'function') {
          onWalletConnected();
        }
      } catch (err) {
        showToast('❌ Ошибка подключения', 'error');
        console.error(err);
      } finally {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '🔗 Подключить кошелёк';
      }
    });
  }
  
  const disconnectBtn = document.getElementById('disconnectWallet');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      disconnectWallet();
      showToast('🔓 Кошелёк отключён', 'info');
    });
  }
});

window.AppState = AppState;
window.MockContract = MockContract;
window.formatEther = formatEther;
window.formatDate = formatDate;
window.calculateProgress = calculateProgress;
window.showToast = showToast;
window.validateForm = validateForm;
window.showError = showError;
window.clearError = clearError;