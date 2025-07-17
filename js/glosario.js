document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const termForm = document.getElementById('term-form');
    const termModal = new bootstrap.Modal(document.getElementById('termModal'));
    const termModalLabel = document.getElementById('termModalLabel');
    const tableBody = document.getElementById('terms-table-body');
    const noDataMessage = document.getElementById('no-data-message');
    const filterForm = document.getElementById('filter-form');

    // Botones de importación/exportación
    const importBtn = document.getElementById('import-excel-btn');
    const importInput = document.getElementById('import-excel-input');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    const STORAGE_KEY = 'glosario_terminos';

    // --- Funciones de Renderizado ---
    const renderTable = () => {
        const filters = getFilters();
        let terms = dataManager.getData(STORAGE_KEY);

        terms = terms.filter(term => {
            const searchMatch = (term.name.toLowerCase().includes(filters.search) || term.definition.toLowerCase().includes(filters.search));
            const statusMatch = (filters.status === '' || term.status === filters.status);
            const domainMatch = (filters.domain === '' || term.domain === filters.domain);
            return searchMatch && statusMatch && domainMatch;
        });

        tableBody.innerHTML = '';
        if (terms.length === 0) {
            noDataMessage.classList.remove('d-none');
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay términos que coincidan.</td></tr>';
            return;
        }

        noDataMessage.classList.add('d-none');

        terms.forEach(term => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${term.name}</td>
                <td>${term.definition}</td>
                <td>${term.domain}</td>
                <td><span class="badge bg-${getStatusColor(term.status)}">${term.status}</span></td>
                <td>${term.version}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${term.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${term.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Aprobado': return 'success';
            case 'Pendiente': return 'warning';
            case 'Rechazado': return 'danger';
            default: return 'secondary';
        }
    };

    // --- Lógica de Formulario (Crear y Editar) ---
    termForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!termForm.checkValidity()) {
            e.stopPropagation();
            termForm.classList.add('was-validated');
            return;
        }

        const termId = document.getElementById('term-id').value;
        const term = {
            id: termId ? parseInt(termId) : null,
            name: document.getElementById('term-name').value,
            definition: document.getElementById('term-definition').value,
            domain: document.getElementById('term-domain').value,
            status: document.getElementById('term-status').value,
            version: document.getElementById('term-version').value,
        };

        if (term.id) {
            dataManager.updateItem(STORAGE_KEY, term);
            uiManager.showToast('Término actualizado con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, term);
            uiManager.showToast('Término añadido con éxito.', 'success');
        }

        termModal.hide();
        renderTable();
    });

    // --- Lógica para Abrir Modal (Añadir vs Editar) ---
    document.getElementById('termModal').addEventListener('show.bs.modal', (e) => {
        termForm.classList.remove('was-validated');
        termForm.reset();
        document.getElementById('term-id').value = '';

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            termModalLabel.textContent = 'Editar Término';
            const termId = button.getAttribute('data-id');
            const term = dataManager.getData(STORAGE_KEY).find(t => t.id == termId);
            if (term) {
                document.getElementById('term-id').value = term.id;
                document.getElementById('term-name').value = term.name;
                document.getElementById('term-definition').value = term.definition;
                document.getElementById('term-domain').value = term.domain;
                document.getElementById('term-status').value = term.status;
                document.getElementById('term-version').value = term.version;
            }
        } else {
            termModalLabel.textContent = 'Añadir Nuevo Término';
        }
    });

    // --- Lógica de Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const termId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar este término?')) {
                dataManager.deleteItem(STORAGE_KEY, termId);
                uiManager.showToast('Término eliminado.', 'danger');
                renderTable();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('termModal'));
            document.getElementById('termModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Lógica de Filtros ---
    const getFilters = () => ({
        search: document.getElementById('search-input').value.toLowerCase().trim(),
        status: document.getElementById('status-filter').value,
        domain: document.getElementById('domain-filter').value
    });

    filterForm.addEventListener('input', renderTable);
    filterForm.addEventListener('reset', () => setTimeout(renderTable, 0));

    // --- Lógica de Importación/Exportación ---
    importBtn.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            let currentData = dataManager.getData(STORAGE_KEY);
            let newItems = 0;
            json.forEach(item => {
                if (item.name) { // Solo importar si tiene nombre
                    const newItem = {
                        name: item.name,
                        definition: item.definition || '',
                        domain: item.domain || 'Sin Dominio',
                        status: item.status || 'Pendiente',
                        version: item.version || '1.0',
                    };
                    dataManager.addItem(STORAGE_KEY, newItem);
                    newItems++;
                }
            });
            uiManager.showToast(`${newItems} términos importados con éxito.`, 'success');
            renderTable();
        };
        reader.readAsArrayBuffer(file);
        importInput.value = ''; // Reset input
    });

    exportExcelBtn.addEventListener('click', () => {
        const terms = dataManager.getData(STORAGE_KEY);
        const worksheet = XLSX.utils.json_to_sheet(terms.map(t => ({
            name: t.name,
            definition: t.definition,
            domain: t.domain,
            status: t.status,
            version: t.version
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Glosario');
        XLSX.writeFile(workbook, 'GlosarioDeNegocio.xlsx');
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const terms = dataManager.getData(STORAGE_KEY);

        doc.text("Glosario de Negocio", 14, 16);
        doc.autoTable({
            head: [['Término', 'Dominio', 'Estado', 'Versión']],
            body: terms.map(t => [t.name, t.domain, t.status, t.version]),
            startY: 20,
        });
        doc.save('GlosarioDeNegocio.pdf');
    });

    // --- Inicialización ---
    renderTable();
});
