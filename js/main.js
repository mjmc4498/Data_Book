document.addEventListener("DOMContentLoaded", function() {
    // --- Lógica del Layout Principal (Sidebar y Tema) ---
    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("wrapper").classList.toggle("toggled");
        });
    }

    const themeSwitch = document.getElementById("theme-switch");
    if(themeSwitch) {
        const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeSwitch.checked = true;
            updateThemeIcon(true);
        }

        themeSwitch.addEventListener("change", function(e) {
            const isChecked = e.target.checked;
            const theme = isChecked ? "dark" : "light";
            document.documentElement.setAttribute("data-bs-theme", theme);
            localStorage.setItem('theme', theme);
            updateThemeIcon(isChecked);
        });
    }

    function updateThemeIcon(isDark) {
        const label = document.querySelector("label[for='theme-switch'] i");
        if (label) {
            label.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        }
    }

    // --- Carga y actualización del perfil de usuario ---
    const loadUserProfile = () => {
        const profile = window.dataManager.getData('user_profile')[0] || { name: 'Usuario' };
        const navbarUserName = document.getElementById('navbar-user-name');
        if (navbarUserName) {
            navbarUserName.textContent = profile.name;
        }
    };

    window.updateNavbarUser = loadUserProfile; // Exponer la función para ser llamada desde iframes

    // --- Utilidades para la gestión de datos (Simulación con localStorage) ---
    window.dataManager = {
        getData: function(key) {
            return JSON.parse(localStorage.getItem(key)) || [];
        },
        saveData: function(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },
        addItem: function(key, item) {
            const data = this.getData(key);
            item.id = new Date().getTime();
            data.push(item);
            this.saveData(key, data);
        },
        updateItem: function(key, updatedItem) {
            let data = this.getData(key);
            const index = data.findIndex(item => item.id == updatedItem.id);
            if (index !== -1) {
                data[index] = { ...data[index], ...updatedItem };
                this.saveData(key, data);
            } else {
                // Si no existe, lo creamos (útil para perfil y config)
                this.addItem(key, updatedItem);
            }
        },
        deleteItem: function(key, id) {
            let data = this.getData(key);
            data = data.filter(item => item.id != id);
            this.saveData(key, data);
        },
    };

    // --- Utilidades Generales de UI ---
    window.uiManager = {
        showToast: function(message, type = 'success') {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                console.error('No se encontró el elemento #toast-container en el DOM.');
                return;
            }

            const toastId = `toast-${new Date().getTime()}`;
            const toastHTML = `
                <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                </div>
            `;

            toastContainer.insertAdjacentHTML('beforeend', toastHTML);

            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
            toast.show();
            toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
        },
        initializeTooltips: function() {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    };

    // --- Inicialización ---
    loadUserProfile();
});
