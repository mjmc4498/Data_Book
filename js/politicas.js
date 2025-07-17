document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const policyForm = document.getElementById('policy-form');
    const policyModal = new bootstrap.Modal(document.getElementById('policyModal'));
    const policyModalLabel = document.getElementById('policyModalLabel');
    const tableBody = document.getElementById('policies-table-body');

    // Botones
    const importBtn = document.getElementById('import-excel-btn');
    const importInput = document.getElementById('import-excel-input');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    const STORAGE_KEY = 'repositorio_politicas';

    // --- Renderizado ---
    const renderTable = () => {
        const policies = dataManager.getData(STORAGE_KEY);
        tableBody.innerHTML = '';

        if (policies.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay políticas definidas.</td></tr>';
            return;
        }

        policies.forEach(policy => {
            const row = document.createElement('tr');
            const reviewDate = new Date(policy.reviewDate + 'T00:00:00'); // Asegurar que se interprete como local
            const today = new Date();
            today.setHours(0,0,0,0); // Ignorar la hora para la comparación
            const isOverdue = reviewDate < today;

            row.innerHTML = `
                <td>${policy.name}</td>
                <td>${policy.regulation}</td>
                <td>${policy.owner}</td>
                <td>
                    <span class="badge ${isOverdue ? 'bg-danger' : 'bg-success'}">
                        ${reviewDate.toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${policy.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${policy.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    // --- Formulario (Crear/Editar) ---
    policyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!policyForm.checkValidity()) {
            e.stopPropagation();
            policyForm.classList.add('was-validated');
            return;
        }

        const policyId = document.getElementById('policy-id').value;
        const policy = {
            id: policyId ? parseInt(policyId) : null,
            name: document.getElementById('policy-name').value,
            regulation: document.getElementById('policy-regulation').value,
            owner: document.getElementById('policy-owner').value,
            reviewDate: document.getElementById('policy-review-date').value,
        };

        if (policy.id) {
            dataManager.updateItem(STORAGE_KEY, policy);
            uiManager.showToast('Política actualizada.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, policy);
            uiManager.showToast('Política añadida.', 'success');
        }

        policyModal.hide();
        renderTable();
    });

    // --- Abrir Modal ---
    document.getElementById('policyModal').addEventListener('show.bs.modal', (e) => {
        policyForm.classList.remove('was-validated');
        policyForm.reset();
        document.getElementById('policy-id').value = '';

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            policyModalLabel.textContent = 'Editar Política';
            const policyId = button.getAttribute('data-id');
            const policy = dataManager.getData(STORAGE_KEY).find(p => p.id == policyId);
            if (policy) {
                document.getElementById('policy-id').value = policy.id;
                document.getElementById('policy-name').value = policy.name;
                document.getElementById('policy-regulation').value = policy.regulation;
                document.getElementById('policy-owner').value = policy.owner;
                document.getElementById('policy-review-date').value = policy.reviewDate;
            }
        } else {
            policyModalLabel.textContent = 'Añadir Nueva Política';
        }
    });

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const policyId = target.getAttribute('data-id');
            if (confirm('¿Seguro que quieres eliminar esta política?')) {
                dataManager.deleteItem(STORAGE_KEY, policyId);
                uiManager.showToast('Política eliminada.', 'danger');
                renderTable();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('policyModal'));
            document.getElementById('policyModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Importación/Exportación ---
    importBtn.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet);

            let newItems = 0;
            json.forEach(item => {
                if (item.name && item.reviewDate) {
                    // Excel a menudo convierte fechas a números; necesitamos reconvertirlo.
                    if (typeof item.reviewDate === 'number') {
                        item.reviewDate = new Date(Math.round((item.reviewDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                    }
                    dataManager.addItem(STORAGE_KEY, { ...item });
                    newItems++;
                }
            });
            uiManager.showToast(`${newItems} políticas importadas.`, 'success');
            renderTable();
        };
        reader.readAsArrayBuffer(file);
        importInput.value = '';
    });

    exportExcelBtn.addEventListener('click', () => {
        const policies = dataManager.getData(STORAGE_KEY);
        const worksheet = XLSX.utils.json_to_sheet(policies.map(p => ({
            name: p.name,
            regulation: p.regulation,
            owner: p.owner,
            reviewDate: p.reviewDate
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Políticas');
        XLSX.writeFile(workbook, 'RepositorioDePoliticas.xlsx');
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const policies = dataManager.getData(STORAGE_KEY);

        doc.text("Repositorio de Políticas", 14, 16);
        doc.autoTable({
            head: [['Política', 'Responsable', 'Próxima Revisión']],
            body: policies.map(p => [p.name, p.owner, new Date(p.reviewDate + 'T00:00:00').toLocaleDateString()]),
            startY: 20,
        });
        doc.save('RepositorioDePoliticas.pdf');
    });

    // --- Inicialización ---
    renderTable();
});
