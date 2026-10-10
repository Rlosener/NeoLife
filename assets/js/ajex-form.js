(function () {
    "use strict";

    const DEFAULT_WHATSAPP_NUMBER = "905338472879";
    const fieldLabels = {
        ad_soyad: "Ad Soyad",
        eposta: "E-posta",
        telefon: "Telefon",
        konu: "Konu",
        mesaj: "Mesaj",
        ilgilenilen_proje: "İlgilenilen Proje",
        iletisim_izni: "İletişim İzni"
    };

    function normalizeSearchText(value) {
        return value
            .toLocaleLowerCase("tr-TR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ı/g, "i")
            .trim();
    }

    function getResponseElement(form) {
        let response = form.querySelector("[data-form-response]");

        if (!response) {
            response = document.createElement("p");
            response.className = "form-response mt-20";
            response.dataset.formResponse = "";
            response.setAttribute("role", "status");
            response.setAttribute("aria-live", "polite");
            form.appendChild(response);
        }

        return response;
    }

    function buildWhatsAppUrl(form) {
        const recipient = String(form.dataset.whatsappNumber || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
        const formData = new FormData(form);
        const topic = String(formData.get("konu") || "").trim();
        const requestedTopic = new URLSearchParams(window.location.search).get("konu");
        const subjectParts = [form.dataset.subject || "NeoLife web sitesi bilgi talebi"];

        if (topic) subjectParts.push(topic);
        if (requestedTopic && requestedTopic !== topic) subjectParts.push(requestedTopic);

        const lines = ["Merhaba, NeoLife web sitesi üzerinden bilgi almak istiyorum.", "", `Talep: ${subjectParts.join(" · ")}`];
        formData.forEach(function (value, key) {
            const cleanValue = String(value).trim();
            if (!cleanValue) return;
            lines.push(`${fieldLabels[key] || key}: ${cleanValue}`);
        });
        lines.push("", `Sayfa: ${document.title}`);

        return `https://wa.me/${recipient}?text=${encodeURIComponent(lines.join("\n"))}`;
    }

    function setFormBusy(form, isBusy) {
        const button = form.querySelector('[type="submit"]');
        if (!button) return;

        button.disabled = isBusy;
        button.setAttribute("aria-busy", String(isBusy));
        form.classList.toggle("is-submitting", isBusy);
    }

    function initWhatsAppForm(form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            if (form.classList.contains("is-submitting")) return;

            const response = getResponseElement(form);
            response.classList.remove("is-success", "is-error");
            response.replaceChildren();

            if (!form.checkValidity()) {
                form.reportValidity();
                response.textContent = "Lütfen zorunlu alanları kontrol edin.";
                response.classList.add("is-error");
                return;
            }

            const whatsappUrl = buildWhatsAppUrl(form);
            setFormBusy(form, true);

            const message = document.createTextNode("WhatsApp mesajınız hazırlanıyor. Açılmazsa ");
            const fallback = document.createElement("a");
            fallback.href = whatsappUrl;
            fallback.target = "_blank";
            fallback.rel = "noopener";
            fallback.textContent = "WhatsApp üzerinden devam edin";
            response.append(message, fallback, document.createTextNode("."));
            response.classList.add("is-success");

            window.location.assign(whatsappUrl);
            window.setTimeout(function () {
                setFormBusy(form, false);
            }, 1500);
        });
    }

    function initBlogSearch(form) {
        const input = form.querySelector('input[name="q"]');
        if (!input) return;

        const posts = Array.from(document.querySelectorAll("[data-blog-post]"));
        const emptyState = document.querySelector("[data-blog-search-empty]");
        if (!posts.length) return;

        function applySearch(updateAddress) {
            const query = normalizeSearchText(input.value);
            let visibleCount = 0;

            posts.forEach(function (post) {
                const matches = !query || normalizeSearchText(post.textContent).includes(query);
                post.hidden = !matches;
                visibleCount += matches ? 1 : 0;
            });

            if (emptyState) emptyState.hidden = visibleCount !== 0;

            if (updateAddress && window.history && typeof window.history.replaceState === "function") {
                const url = new URL(window.location.href);
                if (input.value.trim()) url.searchParams.set("q", input.value.trim());
                else url.searchParams.delete("q");
                window.history.replaceState({}, "", url);
            }

            if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
                window.requestAnimationFrame(function () {
                    window.ScrollTrigger.refresh();
                });
            }
        }

        input.value = new URLSearchParams(window.location.search).get("q") || "";
        applySearch(false);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            applySearch(true);
        });

        let debounceTimer;
        input.addEventListener("input", function () {
            window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(function () {
                applySearch(true);
            }, 180);
        });
    }

    function setMobileMenuState(isOpen) {
        const menu = document.getElementById("mobile-menu");
        const openButtons = document.querySelectorAll(".tp-offcanvas-toogle");
        if (!menu) return;

        const shouldRestoreFocus = !isOpen && document.activeElement && menu.contains(document.activeElement);
        menu.setAttribute("aria-hidden", String(!isOpen));
        menu.toggleAttribute("inert", !isOpen);
        menu.setAttribute("role", "dialog");
        menu.setAttribute("aria-modal", String(isOpen));
        document.querySelectorAll("header, #smooth-wrapper").forEach(function (region) {
            region.toggleAttribute("inert", isOpen);
        });
        document.body.classList.toggle("is-mobile-menu-open", isOpen);
        openButtons.forEach(function (button) {
            button.setAttribute("aria-expanded", String(isOpen));
        });

        if (isOpen) {
            const closeButton = menu.querySelector(".tp-offcanvas-close-toggle");
            window.setTimeout(function () {
                if (closeButton) closeButton.focus();
            }, 40);
        } else if (shouldRestoreFocus) {
            const firstOpener = document.querySelector(".tp-offcanvas-toogle");
            if (firstOpener) firstOpener.focus();
        }
    }

    function closeMobileMenu() {
        const menu = document.getElementById("mobile-menu");
        const overlay = document.querySelector(".tp-offcanvas-overlay");
        if (menu) menu.classList.remove("tp-offcanvas-open");
        if (overlay) overlay.classList.remove("tp-offcanvas-overlay-open");
        setMobileMenuState(false);
    }

    function initMobileMenuAccessibility() {
        const menu = document.getElementById("mobile-menu");
        setMobileMenuState(Boolean(menu && menu.classList.contains("tp-offcanvas-open")));

        document.querySelectorAll(".tp-offcanvas-toogle").forEach(function (button) {
            button.addEventListener("click", function () {
                setMobileMenuState(true);
            });
        });

        document.querySelectorAll(".tp-offcanvas-close-toggle, .tp-offcanvas-overlay").forEach(function (button) {
            button.addEventListener("click", function () {
                setMobileMenuState(false);
            });
        });

        if (menu) {
            menu.addEventListener("click", function (event) {
                if (event.target.closest("a:not([aria-disabled='true'])")) closeMobileMenu();
            });
        }

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && menu && menu.classList.contains("tp-offcanvas-open")) {
                closeMobileMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth >= 1200 && menu && menu.classList.contains("tp-offcanvas-open")) {
                closeMobileMenu();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-neolife-whatsapp-form]").forEach(initWhatsAppForm);
        document.querySelectorAll("[data-blog-search]").forEach(initBlogSearch);
        initMobileMenuAccessibility();

        document.addEventListener("click", function (event) {
            const disabledLink = event.target.closest('a[aria-disabled="true"]');
            if (disabledLink) event.preventDefault();
        });
    });
}());
