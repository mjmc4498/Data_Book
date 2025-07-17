document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const roleForm = document.getElementById('role-form');
    const roleModal = new bootstrap.Modal(document.getElementById('roleModal'));
    const roleModalLabel = document.getElementById('roleModalLabel');
    const tableBody = document.getElementById('roles-table-body');

    const STORAGE_KEY = 'seguridad_roles';

    // --- Renderizado ---
    const renderTable = () => {
        const roles = dataManager.getData(STORAGE_KEY);
        tableBody.innerHTML = '';

        if (roles.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay roles definidos.</td></tr>';
            return;
        }

        roles.forEach(role => {
            const row = document.createElement('tr');
            // Mostrar solo una parte de los permisos para no alargar la tabla
            const permissionsPreview = role.permissions.substring(0, 70) + (role.permissions.length > 70 ? '...' : '');
            row.innerHTML = `
                <td>${role.name}</td>
                <td>${role.description}</td>
                <td><small><code>${permissionsPreview}</code></small></td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${role.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${role.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    // --- Formulario (Crear/Editar) ---
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

        if (role.id) {
            dataManager.updateItem(STORAGE_KEY, role);
            uiManager.showToast('Rol actualizado con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, role);
            uiManager.showToast('Rol creado con éxito.', 'success');
        }

        roleModal.hide();
        renderTable();
    });

    // --- Abrir Modal (Añadir vs Editar) ---
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

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const roleId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar este rol?')) {
                dataManager.deleteItem(STORAGE_KEY, roleId);
                uiManager.showToast('Rol eliminado.', 'danger');
                renderTable();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('roleModal'));
            document.getElementById('roleModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Inicialización ---
    renderTable();
});
