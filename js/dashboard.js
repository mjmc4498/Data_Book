document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    if (!dataManager) {
        console.error("El dataManager no se ha cargado. Asegúrate de que el script principal funcione correctamente.");
        return;
    }

    const updateKPIs = () => {
        // KPI de Términos
        const terminos = dataManager.getData('glosario_terminos');
        document.getElementById('kpi-terminos').textContent = terminos.length;

        // KPI de Activos
        const activos = dataManager.getData('diccionario_activos');
        document.getElementById('kpi-activos').textContent = activos.length;

        // KPI de Incidentes
        const incidentes = dataManager.getData('gestion_incidentes');
        const incidentesAbiertos = incidentes.filter(i => i.status === 'Reportado' || i.status === 'En Investigación').length;
        document.getElementById('kpi-incidentes').textContent = incidentesAbiertos;
    };

    const renderTermsChart = () => {
        const terms = dataManager.getData('glosario_terminos');
        const placeholder = document.getElementById('terms-chart-placeholder');
        const ctx = document.getElementById('termsChart').getContext('2d');

        if (window.termsPieChart) {
            window.termsPieChart.destroy();
        }

        if (terms.length === 0) {
            placeholder.classList.remove('d-none');
            return;
        }

        placeholder.classList.add('d-none');

        const statusCounts = terms.reduce((acc, term) => {
            acc[term.status] = (acc[term.status] || 0) + 1;
            return acc;
        }, {});

        window.termsPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    label: 'Estado de Términos',
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        'rgba(25, 135, 84, 0.7)', // success (Aprobado)
                        'rgba(255, 193, 7, 0.7)',  // warning (Pendiente)
                        'rgba(220, 53, 69, 0.7)', // danger (Rechazado)
                    ],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Distribución de Estados de Términos'
                    }
                }
            }
        });
    };

    const renderIncidentsChart = () => {
        const incidents = dataManager.getData('gestion_incidentes');
        const placeholder = document.getElementById('incidents-chart-placeholder');
        const ctx = document.getElementById('incidentsChart').getContext('2d');

        if (window.incidentsBarChart) {
            window.incidentsBarChart.destroy();
        }

        if (incidents.length === 0) {
            placeholder.classList.remove('d-none');
            return;
        }

        placeholder.classList.add('d-none');

        const statusCounts = incidents.reduce((acc, incident) => {
            acc[incident.status] = (acc[incident.status] || 0) + 1;
            return acc;
        }, {});

        window.incidentsBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    label: 'Número de Incidentes',
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        'rgba(13, 202, 240, 0.7)', // info (Reportado)
                        'rgba(255, 193, 7, 0.7)',  // warning (En Investigación)
                        'rgba(25, 135, 84, 0.7)', // success (Solucionado)
                        'rgba(108, 117, 125, 0.7)' // secondary (Cerrado)
                    ]
                }]
            },
            options: {
                responsive: true,
                 scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    };


    // --- Inicialización y actualización ---
    const initializeDashboard = () => {
        updateKPIs();
        renderTermsChart();
        renderIncidentsChart();
    };

    // Actualizar el dashboard cuando se cambia de pestaña (para reflejar cambios)
    window.parent.document.addEventListener('click', (e) => {
        if (e.target.closest('#sidebar-wrapper a[href*="dashboard.html"]')) {
            setTimeout(initializeDashboard, 50); // Pequeño delay para asegurar que todo cargue
        }
    });

    initializeDashboard();
});
