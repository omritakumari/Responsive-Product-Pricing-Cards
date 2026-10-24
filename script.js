
"use strict";

/* ==========================================
   1. SELECT DOM ELEMENTS
========================================== */

const billingToggle = document.getElementById("billingToggle");
const monthlyText = document.getElementById("monthlyText");
const yearlyText = document.getElementById("yearlyText");

const priceElements = document.querySelectorAll(".price");
const billingCaptions = document.querySelectorAll(".billing-caption");
const planButtons = document.querySelectorAll(".choose-plan");

const modalOverlay = document.getElementById("planModal");
const closeModalButton = document.getElementById("closeModal");
const confirmButton = document.getElementById("confirmSelection");

const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const selectedPlan = document.getElementById("selectedPlan");
const selectedBilling = document.getElementById("selectedBilling");
const selectedPrice = document.getElementById("selectedPrice");

const toast = document.getElementById("toast");
const currentYear = document.getElementById("currentYear");


/* ==========================================
   2. PRICING CONFIGURATION
========================================== */

// These values are demo prices in INR.
// Yearly values are monthly-equivalent prices.

const pricingConfig = {
    Starter: {
        monthly: 0,
        yearly: 0
    },

    Professional: {
        monthly: 999,
        yearly: 799
    },

    Enterprise: {
        monthly: 2499,
        yearly: 1999
    }
};

let selectedPlanName = null;
let previousFocusedElement = null;
let toastTimeout = null;


/* ==========================================
   3. FORMAT PRICE
========================================== */

function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
    }).format(amount);
}


/* ==========================================
   4. GET BILLING PERIOD
========================================== */

function getBillingPeriod() {
    return billingToggle.checked ? "yearly" : "monthly";
}


/* ==========================================
   5. UPDATE PRICES
========================================== */

function updatePrices() {
    const billingPeriod = getBillingPeriod();

    // Update the visual active billing label.
    monthlyText.classList.toggle(
        "active",
        billingPeriod === "monthly"
    );

    yearlyText.classList.toggle(
        "active",
        billingPeriod === "yearly"
    );

    // Update the accessible description of the toggle.
    billingToggle.setAttribute(
        "aria-label",
        billingPeriod === "monthly"
            ? "Switch to yearly billing"
            : "Switch to monthly billing"
    );

    // Update all cards from their data attributes.
    priceElements.forEach((priceElement, index) => {
        const monthlyPrice = Number(priceElement.dataset.monthly);
        const yearlyPrice = Number(priceElement.dataset.yearly);

        const price = billingPeriod === "yearly"
            ? yearlyPrice
            : monthlyPrice;

        priceElement.classList.add("changing");

        priceElement.textContent = formatPrice(price);

        // Remove animation state on the next frame.
        requestAnimationFrame(() => {
            priceElement.classList.remove("changing");
        });

        // Update billing caption.
        const caption = billingCaptions[index];

        if (price === 0) {
            caption.textContent = "Free forever";
        } else if (billingPeriod === "yearly") {
            const annualTotal = yearlyPrice * 12;

            caption.textContent =
                `₹${formatPrice(annualTotal)} billed annually`;
        } else {
            caption.textContent =
                `Billed ₹${formatPrice(monthlyPrice)} monthly`;
        }
    });

    // If the modal is open, keep its summary in sync.
    if (selectedPlanName && modalOverlay.classList.contains("show")) {
        updateModalSummary(selectedPlanName);
    }
}


/* ==========================================
   6. UPDATE MODAL SUMMARY
========================================== */

function updateModalSummary(planName) {
    const billingPeriod = getBillingPeriod();
    const plan = pricingConfig[planName];

    if (!plan) return;

    const monthlyEquivalent = plan[billingPeriod];

    selectedPlan.textContent = planName;

    selectedBilling.textContent =
        billingPeriod === "yearly"
            ? "Yearly billing"
            : "Monthly billing";

    selectedPrice.textContent =
        monthlyEquivalent === 0
            ? "Free"
            : `₹${formatPrice(monthlyEquivalent)}/month`;

    if (monthlyEquivalent === 0) {
        modalTitle.textContent = "Your journey starts here!";
        modalMessage.textContent =
            "You've selected the Starter plan. This demo won't create an account.";
    } else {
        modalTitle.textContent = "Great choice!";
        modalMessage.textContent =
            `You've selected the ${planName} plan. Review your selection below.`;
    }
}


/* ==========================================
   7. OPEN PLAN MODAL
========================================== */

function openPlanModal(planName) {
    if (!pricingConfig[planName]) {
        showToast("Sorry, this plan is unavailable.");
        return;
    }

    selectedPlanName = planName;
    previousFocusedElement = document.activeElement;

    updateModalSummary(planName);

    modalOverlay.classList.add("show");
    modalOverlay.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    // Put keyboard focus inside the dialog.
    closeModalButton.focus();
}


/* ==========================================
   8. CLOSE PLAN MODAL
========================================== */

function closePlanModal() {
    modalOverlay.classList.remove("show");
    modalOverlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

    if (previousFocusedElement) {
        previousFocusedElement.focus();
    }

    selectedPlanName = null;
}


/* ==========================================
   9. SHOW TOAST MESSAGE
========================================== */

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* ==========================================
   10. PLAN BUTTON EVENTS
========================================== */

planButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const planName = button.dataset.plan;
        openPlanModal(planName);
    });
});


/* ==========================================
   11. BILLING SWITCH EVENT
========================================== */

billingToggle.addEventListener("change", updatePrices);


/* ==========================================
   12. MODAL EVENTS
========================================== */

closeModalButton.addEventListener("click", closePlanModal);

confirmButton.addEventListener("click", () => {
    const planName = selectedPlanName;

    closePlanModal();

    if (planName) {
        showToast(
            `${planName} selected. Payment integration is not enabled.`
        );
    }
});

// Close the modal when the user clicks outside it.
modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
        closePlanModal();
    }
});

// Close the modal with Escape.
document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        modalOverlay.classList.contains("show")
    ) {
        closePlanModal();
    }
});


/* ==========================================
   13. FAQ ACCORDION BEHAVIOR
========================================== */

// Keep only one FAQ item open at a time.

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
        if (!item.open) return;

        faqItems.forEach((otherItem) => {
            if (otherItem !== item) {
                otherItem.open = false;
            }
        });
    });
});


/* ==========================================
   14. FOOTER YEAR
========================================== */

currentYear.textContent = new Date().getFullYear();


/* ==========================================
   15. INITIALIZE APPLICATION
========================================== */

function initializePricingPage() {
    updatePrices();
}

initializePricingPage();
