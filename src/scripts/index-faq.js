const faqDictionary = {
    eng: {
        subtitle: "Quick answers to common questions",
        items: [
            {
                q: "How do I book an appointment?",
                a: "You can view clinic schedule availability on the \"Set An Appointment\" tab, then contact our clinic directly via phone or Facebook Messenger to reserve your session."
            },
            {
                q: "What should I bring to my appointment?",
                a: "Please bring a valid ID, any relevant medical records, developmental evaluations, or physician referrals for your initial consultation."
            },
            {
                q: "Can I reschedule or cancel my appointment?",
                a: "Yes. To reschedule or cancel your session, please notify our clinic staff at least 24 hours in advance so we can adjust the schedule."
            },
            {
                q: "How long is each therapy session?",
                a: "Standard therapy sessions typically last 45 to 60 minutes, tailored to your child's individualized treatment plan and developmental goals."
            }
        ]
    },
    fil: {
        subtitle: "Mga sagot sa karaniwang tanong tungkol sa aming therapy center",
        items: [
            {
                q: "Paano po mag-book ng appointment?",
                a: "Pwede ninyong i-check ang available clinic schedule sa \"Set An Appointment\" tab, tapos i-contact lang ang aming clinic staff sa phone o Facebook Messenger para ma-reserve ang inyong session."
            },
            {
                q: "Ano ang dapat dalhin sa appointment?",
                a: "Magdala lamang po ng valid ID, mga medical records, previous developmental evaluations, o referral galing sa inyong doktor para sa initial consultation."
            },
            {
                q: "Pwede po ba mag-reschedule o mag-cancel?",
                a: "Opo, pwede po. Paki-inform lang po ang aming clinic staff at least 24 hours bago ang inyong appointment para maayos po natin ang schedule."
            },
            {
                q: "Gaano po katagal ang bawat therapy session?",
                a: "Ang bawat therapy session ay karaniwang tumatagal ng 45 hanggang 60 minutes, depende sa individualized treatment plan at developmental goals ng inyong anak."
            }
        ]
    }
};

function initFaqLanguageToggle(toggleId, subtitleId, gridId) {
    const toggleContainer = document.getElementById(toggleId);
    const subtitleEl = document.getElementById(subtitleId);
    const gridEl = document.getElementById(gridId);
    if (!toggleContainer || !gridEl) return;

    toggleContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-btn');
        if (!btn) return;

        const lang = btn.dataset.lang;
        if (!faqDictionary[lang]) return;

        toggleContainer.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const data = faqDictionary[lang];
        if (subtitleEl) subtitleEl.textContent = data.subtitle;

        let html = '';
        data.items.forEach(item => {
            html += `
                <div class="faq-card">
                    <h4>${item.q}</h4>
                    <p>${item.a}</p>
                </div>
            `;
        });
        gridEl.innerHTML = html;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initFaqLanguageToggle('landingFaqLangToggle', 'landingFaqSubtitle', 'landingFaqGrid');
});
