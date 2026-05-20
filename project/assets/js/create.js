document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createCampaignForm');
  
  if (!AppState.isConnected) {
    showToast('🔗 Подключите кошелёк для создания кампании', 'info', 5000);
  }
  
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value.trim()) clearError(input);
    });
    input.addEventListener('input', () => {
      if (input.value.trim()) clearError(input);
    });
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      goal: form.goal.value,
      duration: form.duration.value,
      category: form.category.value,
      image: form.image.value.trim() || '💡'
    };
    
    const rules = {
      title: { required: true, min: 5, message: 'Минимум 5 символов' },
      description: { required: true, min: 50, message: 'Минимум 50 символов' },
      goal: { required: true, type: 'number', minValue: 0.1 },
      duration: { required: true, type: 'number', minValue: 1 },
      category: { required: true }
    };

    const errors = validateForm(formData, rules);
    
    Object.entries(errors).forEach(([field, message]) => {
      const input = form.elements[field];
      if (input) showError(input, message);
    });
    
    if (Object.keys(errors).length > 0) {
      showToast('❌ Исправьте ошибки в форме', 'error');
      return;
    }
    
    if (!AppState.isConnected) {
      showToast('🔗 Подключите кошелёк для продолжения', 'info');
      return;
    }
    
    // Отправка
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Создание...';
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCampaign = await MockContract.createCampaign({
        title: formData.title,
        description: formData.description,
        goal: ethersEther(formData.goal),
        duration: parseInt(formData.duration),
        category: formData.category,
        image: formData.image
      });
      
      showToast('✅ Кампания успешно создана!', 'success');

      setTimeout(() => {
        window.location.href = `campaign.html?id=${newCampaign.id}`;
      }, 1500);
      
    } catch (err) {
      showToast('❌ Ошибка создания: ' + err.message, 'error');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Запустить кампанию';
    }
  });
  
  window.onWalletConnected = () => {
    showToast('🎉 Кошелёк подключён! Заполните форму для запуска.', 'success');
  };
});