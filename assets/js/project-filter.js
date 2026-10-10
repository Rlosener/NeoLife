(function () {
    "use strict";

    const FILTER_KEYS = ["project", "location", "status"];

    function getSelectedFilters(form) {
        return FILTER_KEYS.reduce(function (filters, key) {
            const field = form.elements.namedItem(key);
            filters[key] = field ? field.value : "";
            return filters;
        }, {});
    }

    function cardMatches(card, filters) {
        const statuses = (card.dataset.status || "").split(/\s+/).filter(Boolean);
        const projectMatches = !filters.project || card.dataset.project === filters.project;
        const locationMatches = !filters.location || card.dataset.location === filters.location;
        const statusMatches = !filters.status || statuses.includes(filters.status);

        return projectMatches && locationMatches && statusMatches;
    }

    function updateAddress(filters) {
        const url = new URL(window.location.href);

        FILTER_KEYS.forEach(function (key) {
            if (filters[key]) {
                url.searchParams.set(key, filters[key]);
            } else {
                url.searchParams.delete(key);
            }
        });

        window.history.replaceState({}, "", url);
    }

    function refreshScrollAnimations() {
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
            window.requestAnimationFrame(function () {
                window.ScrollTrigger.refresh();
            });
        }
    }

    function applyFilters(form, cards, emptyState, countState) {
        const filters = getSelectedFilters(form);
        let visibleCount = 0;

        cards.forEach(function (card) {
            const matches = cardMatches(card, filters);
            card.hidden = !matches;
            visibleCount += matches ? 1 : 0;
        });

        emptyState.hidden = visibleCount !== 0;
        if (countState) {
            countState.textContent = `${visibleCount} proje listeleniyor.`;
        }
        updateAddress(filters);
        refreshScrollAnimations();
    }

    function restoreFiltersFromAddress(form) {
        const searchParams = new URLSearchParams(window.location.search);

        FILTER_KEYS.forEach(function (key) {
            const field = form.elements.namedItem(key);
            const value = searchParams.get(key);

            if (field) {
                field.value = "";
            }

            if (field && value && Array.from(field.options).some(function (option) {
                return option.value === value;
            })) {
                field.value = value;
            }
        });
    }

    function syncNiceSelect(form) {
        if (!window.jQuery || !window.jQuery.fn || typeof window.jQuery.fn.niceSelect !== "function") {
            return;
        }

        window.jQuery(form).find("select").niceSelect("update");
    }

    function initProjectFilter(form) {
        const projectArea = form.closest(".tp-project-area");
        const projectList = projectArea && projectArea.querySelector("[data-project-list]");
        const emptyState = projectArea && projectArea.querySelector("[data-project-empty]");
        const countState = projectArea && projectArea.querySelector("[data-project-count]");
        const resetButton = form.querySelector("[data-project-reset]");

        if (!projectList || !emptyState) {
            return;
        }

        const cards = Array.from(projectList.querySelectorAll("[data-project-card]"));

        if (!cards.length) {
            return;
        }

        restoreFiltersFromAddress(form);
        syncNiceSelect(form);
        applyFilters(form, cards, emptyState, countState);

        const handleFilterChange = function () {
            applyFilters(form, cards, emptyState, countState);
        };

        if (window.jQuery) {
            window.jQuery(form).on("change.projectFilter", "select", handleFilterChange);
        } else {
            form.addEventListener("change", handleFilterChange);
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            applyFilters(form, cards, emptyState, countState);
        });

        if (resetButton) {
            resetButton.addEventListener("click", function () {
                window.setTimeout(function () {
                    syncNiceSelect(form);
                    applyFilters(form, cards, emptyState, countState);
                }, 0);
            });
        }

        window.addEventListener("popstate", function () {
            restoreFiltersFromAddress(form);
            syncNiceSelect(form);
            applyFilters(form, cards, emptyState, countState);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-project-filter]").forEach(initProjectFilter);
    });
}());
