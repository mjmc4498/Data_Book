document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const settingsForm = document.getElementById('settings-form');

    const STORAGE_KEY = 'user_settings';

    const loadSettings = () => {
        const settings = dataManager.getData(STORAGE_KEY)[0];
        if (settings) {
            document.getElementById('items-per-page').value = settings.itemsPerPage || '25';
            document.getElementById('email-notifications').checked = settings.emailNotifications || false;
            document.getElementById('high-contrast').checked = settings.highContrast || false;
        }
    };

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const settingsData = {
            id: 1, // ID fijo para el objeto de configuración
            itemsPerPage: document.getElementById('items-per-page').value,
            emailNotifications: document.getElementById('email-notifications').checked,
            highContrast: document.getElementById('high-contrast').checked,
        };

        dataManager.updateItem(STORAGE_KEY, settingsData);
        uiManager.showToast('Configuración guardada con éxito.', 'success');
    });

    // Cargar la configuración al iniciar
    loadSettings();
});
