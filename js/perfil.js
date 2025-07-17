document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const profileForm = document.getElementById('profile-form');

    const STORAGE_KEY = 'user_profile';
    const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?u=a042581f4e29026704d';

    const loadProfileData = () => {
        const profile = dataManager.getData(STORAGE_KEY)[0] || {};

        // Cargar datos en el formulario
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-role').value = profile.role || 'Analista de Datos';
        document.getElementById('profile-avatar-url').value = profile.avatarUrl || '';
        document.getElementById('profile-birthdate').value = profile.birthdate || '';
        document.getElementById('profile-phone').value = profile.phone || '';
        document.getElementById('profile-linkedin').value = profile.linkedin || '';
        document.getElementById('profile-twitter').value = profile.twitter || '';

        // Actualizar la vista previa
        document.getElementById('profile-avatar').src = profile.avatarUrl || DEFAULT_AVATAR;
        document.getElementById('profile-name-display').textContent = profile.name || 'Usuario de Prueba';
        document.getElementById('profile-role-display').textContent = profile.role || 'Analista de Datos';

        // Actualizar links de redes sociales
        const socialLinksContainer = document.getElementById('social-links-display');
        socialLinksContainer.innerHTML = '';
        if (profile.linkedin) {
            socialLinksContainer.innerHTML += `<a href="${profile.linkedin}" target="_blank" class="btn btn-outline-primary btn-sm me-2"><i class="bi bi-linkedin"></i> LinkedIn</a>`;
        }
        if (profile.twitter) {
            socialLinksContainer.innerHTML += `<a href="${profile.twitter}" target="_blank" class="btn btn-outline-info btn-sm"><i class="bi bi-twitter"></i> Twitter/X</a>`;
        }
    };

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const profileData = {
            id: 1, // ID fijo para el perfil
            name: document.getElementById('profile-name').value,
            role: document.getElementById('profile-role').value,
            avatarUrl: document.getElementById('profile-avatar-url').value,
            birthdate: document.getElementById('profile-birthdate').value,
            phone: document.getElementById('profile-phone').value,
            linkedin: document.getElementById('profile-linkedin').value,
            twitter: document.getElementById('profile-twitter').value,
        };

        dataManager.updateItem(STORAGE_KEY, profileData);
        uiManager.showToast('Perfil actualizado con éxito.', 'success');

        loadProfileData();
        window.parent.updateNavbarUser();
    });

    loadProfileData();
});
