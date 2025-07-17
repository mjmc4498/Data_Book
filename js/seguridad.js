document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const roleForm = document.getElementById('role-form');
    const roleModal = new bootstrap.Modal(document.getElementById('roleModal'));
    const roleModalLabel = document.getElementById('roleModalLabel');
    const tableBody = document.getElementById('roles-table-body');
    const searchInput = document.getElementById('search-input');

    const STORAGE_KEY = 'seguridad_roles';

    // --- Renderizado ---
    const renderTable = () => {
        const searchTerm = searchInput.value.toLowerCase();
        let roles = dataManager.getData(STORAGE_KEY);

        if (searchTerm) {
            roles = roles.filter(role =>
                role.name.toLowerCase().includes(searchTerm) ||
                role.description.toLowerCase().includes(searchTerm) ||
                role.permissions.toLowerCase().includes(searchTerm)
            );
        }

        tableBody.innerHTML = '';
        if (roles.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay roles que coincidan.</td></tr>';
            return;
        }

        roles.forEach(role => {
            const row = document.createElement('tr');
            const permissionsPreview = role.permissions.substring(0, 70) + (role.permissions.length > 70 ? '...' : '');
            row.innerHTML = `
                <td>${role.name}</td>
                <td>${role.description}</td>
                <td><small><code>${permissionsPreview}</code></small></td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${role.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${role.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    // --- Formulario ---
    roleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!roleForm.checkValidity()) {
            e.stopPropagation();
            roleForm.classList.add('was-validated');
            return;
        }
        const roleId = document.getElementById('role-id').value;
        const role = {
            id: roleId ? parseInt(roleId) : null,
            name: document.getElementById('role-name').value,
            description: document.getElementById('role-description').value,
            permissions: document.getElementById('role-permissions').value,
        };
        if (role.id) dataManager.updateItem(STORAGE_KEY, role);
        else dataManager.addItem(STORAGE_KEY, role);
        uiManager.showToast('Rol guardado.', 'success');
        roleModal.hide();
        renderTable();
    });

    // --- Abrir Modal ---
    document.getElementById('roleModal').addEventListener('show.bs.modal', (e) => {
        roleForm.classList.remove('was-validated');
        roleForm.reset();
        document.getElementById('role-id').value = '';
        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            roleModalLabel.textContent = 'Editar Rol';
            const roleId = button.getAttribute('data-id');
            const role = dataManager.getData(STORAGE_KEY).find(r => r.id == roleId);
            if (role) {
                document.getElementById('role-id').value = role.id;
                document.getElementById('role-name').value = role.name;
                document.getElementById('role-description').value = role.description;
                document.getElementById('role-permissions').value = role.permissions;
            }
        } else {
            roleModalLabel.textContent = 'Añadir Nuevo Rol';
        }
    });

    // --- Delegación de eventos ---
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            const modalTrigger = new bootstrap.Modal(document.getElementById('roleModal'));
            document.getElementById('roleModal')._trigger = editBtn;
            modalTrigger.show(editBtn);
        } else if (deleteBtn) {
            const roleId = deleteBtn.getAttribute('data-id');
            if (confirm('¿Seguro que quieres eliminar este rol?')) {
                dataManager.deleteItem(STORAGE_KEY, roleId);
                uiManager.showToast('Rol eliminado.', 'danger');
                renderTable();
            }
        }
    });

    // --- Filtro ---
    searchInput.addEventListener('input', renderTable);

    // --- Inicialización ---
    renderTable();
});
