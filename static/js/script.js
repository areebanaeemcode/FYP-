/**
 * Pay-Together — Global Interactive Engine & Theme Controller
 * Handles universal Dark/Light theme toggle, persistence, multi-tab sync, and global utilities.
 */
(function () {
    'use strict';

    /**
     * Check whether dark mode is currently active on the document
     */
    function isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }

    /**
     * Apply the specified theme ('dark' or 'light')
     */
    function applyTheme(theme, savePreference) {
        if (savePreference === undefined) savePreference = true;

        var isDark = (theme === 'dark');

        if (isDark) {
            document.documentElement.classList.add('dark');
            if (document.body) document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            if (document.body) document.body.classList.remove('dark');
        }

        if (savePreference) {
            try {
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            } catch (e) { }
        }

        // Update all toggle buttons in DOM
        updateButtonsUI(isDark);
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        var newTheme = isDarkMode() ? 'light' : 'dark';
        applyTheme(newTheme, true);
    }

    /**
     * Update all theme buttons icons & ARIA attributes
     */
    function updateButtonsUI(isDark) {
        var buttons = document.querySelectorAll('.theme-toggle, #themeToggleBtn, [data-theme-toggle]');
        buttons.forEach(function (btn) {
            btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            btn.setAttribute('title', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');

            // Explicit icon fallback handling in case CSS classes are overridden
            var moon = btn.querySelector('.fa-moon');
            var sun = btn.querySelector('.fa-sun');

            var darkHiddenSpan = btn.querySelector('.dark\\:hidden');
            var darkInlineSpan = btn.querySelector('.dark\\:inline');

            if (darkHiddenSpan && darkInlineSpan) {
                darkHiddenSpan.style.display = isDark ? 'none' : 'inline-flex';
                darkInlineSpan.style.display = isDark ? 'inline-flex' : 'none';
            } else if (moon && sun) {
                moon.style.display = isDark ? 'none' : 'inline-block';
                sun.style.display = isDark ? 'inline-block' : 'none';
            }
        });
    }

    /**
     * Initialize theme on load from storage or system preference
     */
    function initTheme() {
        var savedTheme = null;
        try {
            savedTheme = localStorage.getItem('theme');
        } catch (e) { }

        if (savedTheme === 'dark' || savedTheme === 'light') {
            applyTheme(savedTheme, false);
        } else {
            var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light', false);
        }
    }

    // Attach click listener with event delegation so it works on any current and dynamically created button
    document.addEventListener('click', function (e) {
        var toggleBtn = e.target.closest('.theme-toggle, #themeToggleBtn, [data-theme-toggle]');
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();

            // Visual click feedback
            toggleBtn.style.transform = 'scale(0.92)';
            setTimeout(function () {
                toggleBtn.style.transform = '';
            }, 120);

            toggleTheme();
        }
    }, true); // useCapture ensures it triggers even if child handlers exist

    // Sync theme if changed in another browser tab
    window.addEventListener('storage', function (e) {
        if (e.key === 'theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
            applyTheme(e.newValue, false);
        }
    });

    // Listen for OS system theme changes if no explicit user override is stored
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            var savedTheme = null;
            try { savedTheme = localStorage.getItem('theme'); } catch (err) { }
            if (!savedTheme) {
                applyTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    }

    // Expose API globally
    window.toggleTheme = toggleTheme;
    window.applyTheme = applyTheme;

    // Run initialization
    initTheme();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    }
})();
