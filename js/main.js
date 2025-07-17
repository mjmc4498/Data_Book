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
        // Cargar el tema guardado en localStorage
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
            localStorage.setItem('theme', theme); // Guardar el tema
            updateThemeIcon(isChecked);
        });
    }

    function updateThemeIcon(isDark) {
        const label = document.querySelector("label[for='theme-switch'] i");
        if (label) {
            label.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        }
    }

    // --- Utilidades para la gestión de datos (Simulación con localStorage) ---
    window.dataManager = {
        /**
         * Obtiene los datos de una clave específica del localStorage.
         * @param {string} key - La clave para los datos (ej. 'glosario_terminos').
         * @returns {Array} - Un array de objetos.
         */
        getData: function(key) {
            return JSON.parse(localStorage.getItem(key)) || [];
        },

        /**
         * Guarda un array de datos en una clave específica del localStorage.
         * @param {string} key - La clave para los datos.
         * @param {Array} data - El array de datos a guardar.
         */
        saveData: function(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },

        /**
         * Añade un nuevo item a un array existente en localStorage.
         * @param {string} key - La clave para los datos.
         * @param {object} item - El objeto a añadir.
         */
        addItem: function(key, item) {
            const data = this.getData(key);
            item.id = new Date().getTime(); // Asignar un ID único basado en el timestamp
            data.push(item);
            this.saveData(key, data);
        },

        /**
         * Actualiza un item existente en un array de localStorage.
         * @param {string} key - La clave para los datos.
         * @param {object} updatedItem - El objeto con los datos actualizados (debe incluir el id).
         */
        updateItem: function(key, updatedItem) {
            let data = this.getData(key);
            const index = data.findIndex(item => item.id == updatedItem.id);
            if (index !== -1) {
                data[index] = { ...data[index], ...updatedItem };
                this.saveData(key, data);
            }
        },

        /**
         * Elimina un item de un array en localStorage por su ID.
         * @param {string} key - La clave para los datos.
         * @param {number} id - El ID del item a eliminar.
         */
        deleteItem: function(key, id) {
            let data = this.getData(key);
            data = data.filter(item => item.id != id);
            this.saveData(key, data);
        },
    };

    // --- Utilidades Generales de UI ---
    window.uiManager = {
        /**
         * Muestra una notificación toast de Bootstrap.
         * @param {string} message - El mensaje a mostrar.
         * @param {string} type - 'success', 'danger', 'warning', 'info'.
         */
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

        /**
         * Inicializa los tooltips de Bootstrap en la página actual.
         */
        initializeTooltips: function() {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    };
});
