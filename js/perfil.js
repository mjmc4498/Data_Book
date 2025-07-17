document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const profileForm = document.getElementById('profile-form');

    const STORAGE_KEY = 'user_profile';

    const loadProfileData = () => {
        // Usamos [0] porque el perfil es un objeto único en un array.
        const profile = dataManager.getData(STORAGE_KEY)[0];
        if (profile) {
            document.getElementById('profile-name').value = profile.name || '';
            document.getElementById('profile-role').value = profile.role || 'Analista de Datos';

            // Actualizar la vista previa
            document.getElementById('profile-name-display').textContent = profile.name || 'Usuario de Prueba';
            document.getElementById('profile-role-display').textContent = profile.role || 'Analista de Datos';
        }
    };

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const profileData = {
            // Asignamos un ID fijo (1) para el perfil, ya que solo hay uno.
            id: 1,
            name: document.getElementById('profile-name').value,
            role: document.getElementById('profile-role').value,
        };

        // Usamos updateItem que creará el item si no existe.
        dataManager.updateItem(STORAGE_KEY, profileData);
        uiManager.showToast('Perfil actualizado con éxito.', 'success');

        // Actualizar la vista previa en la página y la navbar principal
        loadProfileData();
        window.parent.updateNavbarUser();
    });

    // Cargar los datos al iniciar la página
    loadProfileData();
});
