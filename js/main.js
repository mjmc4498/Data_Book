document.addEventListener("DOMContentLoaded", function() {
    // Toggle Menu
    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            const wrapper = document.getElementById("wrapper");
            wrapper.classList.toggle("toggled");
        });
    }

    // Theme Switch
    const themeSwitch = document.getElementById("theme-switch");
    if(themeSwitch) {
        themeSwitch.addEventListener("change", function(e) {
            const isChecked = e.target.checked;
            document.documentElement.setAttribute("data-bs-theme", isChecked ? "dark" : "light");

            // Update icon
            const label = document.querySelector("label[for='theme-switch'] i");
            if(label) {
                if(isChecked) {
                    label.classList.remove('bi-moon-stars-fill');
                    label.classList.add('bi-sun-fill');
                } else {
                    label.classList.remove('bi-sun-fill');
                    label.classList.add('bi-moon-stars-fill');
                }
            }
        });
    }

    // Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
