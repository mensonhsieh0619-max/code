const STORAGE_KEY = "ai_health_platform_login_state_v2";
// Guard scripts in app-*.html run before shared.js loads and re-check localStorage
// directly, so this value is duplicated there — keep both in sync if changed.
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const ROLES = {
    guest: "訪客",
    user: "一般使用者",
    coach: "健身教練",
    nutritionist: "營養師",
    admin: "系統管理員"
};

const ROLE_PAGES = {
    user: "app-user.html",
    coach: "app-coach.html",
    nutritionist: "app-nutrition.html",
    admin: "app-admin.html"
};

const SECTION_LABELS = {
    "profile-section": "個人資料設定",
    "user-dashboard-section": "使用者首頁",
    "coach-dashboard-section": "教練首頁",
    "nutrition-dashboard-section": "營養師首頁",
    "admin-dashboard-section": "系統管理員首頁",
    "health-input-section": "新增健康資料",
    "health-trend-section": "健康趨勢",
    "ai-health-section": "AI 健康建議",
    "fhir-viewer-section": "FHIR JSON",
    "share-section": "授權分享",
    "registration-section": "競賽報名",
    "my-registration-section": "我的報名",
    "student-list-section": "學員列表",
    "student-exercise-section": "學員運動紀錄",
    "student-heart-rate-section": "學員心率趨勢",
    "training-advice-section": "AI 訓練建議",
    "training-record-section": "訓練紀錄",
    "case-list-section": "個案列表",
    "bmi-analysis-section": "BMI 分析",
    "weight-trend-section": "體重趨勢",
    "blood-pressure-section": "血壓提醒",
    "diet-advice-section": "AI 飲食建議",
    "nutrition-record-section": "營養紀錄",
    "account-management-section": "帳號管理",
    "user-management-section": "使用者管理",
    "fhir-record-section": "FHIR Resource",
    "observation-record-section": "Observation 紀錄",
    "authorization-record-section": "授權紀錄",
    "blockchain-section": "區塊鏈紀錄",
    "registration-list-section": "報名列表",
    "registration-review-section": "報名審核",
    "system-setting-section": "系統設定",
    "notification-section": "通知中心"
};

let state = loadState();
let currentSection = "";
let trendRange = 7;
const chartPoints = {};
const _charts = {};

// ─── State ────────────────────────────────────────────────────────────

function createDefaultState() {
    return {
        currentAccount: null,
        role: "guest",
        demoMode: false,
        patient: {
            name: "王小明",
            gender: "male",
            birthday: "1990-01-01",
            height: 175,
            targetWeight: 68,
            dailyStepGoal: 10000,
            weeklyExerciseGoal: 150,
            heightUpdatedAt: "2026-06-26 09:00"
        },
        accounts: [],
        healthRecords: [
            { id: "HR-001", accountId: "ACC-USER-DEMO", date: "2026-06-20", systolic: 118, diastolic: 76, weight: 71.8, height: 170, heartRate: 72, steps: 7800, exercise: 30, bmi: 24.8 },
            { id: "HR-002", accountId: "ACC-USER-DEMO", date: "2026-06-22", systolic: 124, diastolic: 80, weight: 71.2, height: 170, heartRate: 76, steps: 9200, exercise: 45, bmi: 24.6 },
            { id: "HR-003", accountId: "ACC-USER-DEMO", date: "2026-06-26", systolic: 126, diastolic: 82, weight: 70.8, height: 170, heartRate: 74, steps: 10400, exercise: 55, bmi: 24.5 }
        ],
        authorizations: [
            { id: "AUTH-20260628-001", patientId: "ACC-USER-DEMO", patientName: "王小明", targetRole: "coach", targetName: "李教練", dataScopes: ["運動紀錄", "心率", "步數"], duration: "永久授權", status: "有效", hash: "0xA7F391BC8E44", createdAt: "2026-06-28 10:30", expiredAt: "永久授權" },
            { id: "AUTH-20260628-002", patientId: "ACC-USER-DEMO", patientName: "王小明", targetRole: "nutritionist", targetName: "陳營養師", dataScopes: ["BMI", "體重", "血壓"], duration: "永久授權", status: "有效", hash: "0x4B21E0889F02", createdAt: "2026-06-28 10:35", expiredAt: "永久授權" }
        ],
        registrations: [
            { id: "REG-20260623-001", accountId: "ACC-USER-DEMO", teamName: "FHIR 健康隊", projectName: "AI 健康追蹤與運動管理平台", category: "運動健康", leaderName: "王小明", email: "test@example.com", phone: "0912345678", organization: "XX大學", members: ["陳小華", "林小美"], description: "以 FHIR 串接健康紀錄，並提供 AI 建議與角色權限管理。", roles: "user, coach, nutritionist, admin", fhirResources: "Patient, Observation, Practitioner", githubUrl: "https://github.com/example/ai-health", demoUrl: "", note: "", status: "待審核", reviewComment: "", createdAt: "2026-06-23 10:30" }
        ],
        trainingRecords: [
            { id: "TR-001", coachId: "ACC-COACH-DEMO", studentName: "王小明", title: "本週訓練建議", content: "維持每週 150 分鐘中等強度有氧，加入 2 次肌力訓練。", createdAt: "2026-06-24 14:00" }
        ],
        nutritionRecords: [
            { id: "NR-001", nutritionistId: "ACC-NUTRITION-DEMO", caseName: "王小明", title: "飲食調整", content: "增加蔬菜與優質蛋白質，晚餐減少精緻澱粉。", createdAt: "2026-06-24 15:00" }
        ],
        blockchainLogs: [
            { id: "BC-001", hash: "0xA7F391BC8E44", source: "王小明", event: "授權 coach exercise", createdAt: "2026-06-24 10:00" },
            { id: "BC-002", hash: "0x4B21E0889F02", source: "王小明", event: "授權 nutritionist nutrition", createdAt: "2026-06-24 10:15" }
        ],
        notifications: [
            { id: "NT-001", accountId: "all", title: "系統已啟用正式登入", message: "請使用帳號密碼登入，或使用 Demo 快速登入體驗角色權限。", createdAt: "2026-06-26 09:00", isRead: false },
            { id: "NT-002", accountId: "ACC-USER-DEMO", title: "報名資料已建立", message: "你的競賽報名目前為待審核。", createdAt: "2026-06-23 10:30", isRead: false }
        ]
    };
}

async function hashPassword(password) {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isHashedPassword(value) {
    return /^[a-f0-9]{64}$/i.test(String(value || ""));
}

async function initDefaultAccounts() {
    const defaults = [
        { id: "ACC-USER-DEMO", name: "王小明", email: "user01@example.com", username: "user01", password: "123456", phone: "0912345678", organization: "XX大學", role: "user", status: "active", createdAt: "2026-06-23 10:30" },
        { id: "ACC-COACH-DEMO", name: "李教練", email: "coach01@example.com", username: "coach01", password: "123456", phone: "0922333444", organization: "健康運動中心", role: "coach", status: "active", createdAt: "2026-06-23 10:35" },
        { id: "ACC-NUTRITION-DEMO", name: "陳營養師", email: "nutrition01@example.com", username: "nutrition01", password: "123456", phone: "0933555666", organization: "營養照護中心", role: "nutritionist", status: "active", createdAt: "2026-06-23 10:40" },
        { id: "ACC-ADMIN-DEMO", name: "系統管理員", email: "admin01@example.com", username: "admin01", password: "123456", phone: "0944777888", organization: "平台管理部", role: "admin", status: "active", createdAt: "2026-06-23 10:45" }
    ];
    for (const account of defaults) {
        if (!state.accounts.some((item) => item.username === account.username)) {
            account.password = await hashPassword(account.password);
            state.accounts.push(account);
        }
    }
}

function loadState() {
    const base = createDefaultState();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return base;
        const loaded = JSON.parse(raw);
        const merged = {
            ...base, ...loaded,
            patient: { ...base.patient, ...(loaded.patient || {}) },
            accounts: Array.isArray(loaded.accounts) ? loaded.accounts : base.accounts,
            healthRecords: Array.isArray(loaded.healthRecords) ? loaded.healthRecords : base.healthRecords,
            authorizations: Array.isArray(loaded.authorizations) ? loaded.authorizations : base.authorizations,
            registrations: Array.isArray(loaded.registrations) ? loaded.registrations : base.registrations,
            trainingRecords: Array.isArray(loaded.trainingRecords) ? loaded.trainingRecords : base.trainingRecords,
            nutritionRecords: Array.isArray(loaded.nutritionRecords) ? loaded.nutritionRecords : base.nutritionRecords,
            blockchainLogs: Array.isArray(loaded.blockchainLogs) ? loaded.blockchainLogs : base.blockchainLogs,
            notifications: Array.isArray(loaded.notifications) ? loaded.notifications : base.notifications
        };
        merged.healthRecords = merged.healthRecords.map((record) => ({
            ...record,
            bmi: calculateBMI(record.weight, record.height || merged.patient.height)
        }));
        if (merged.loginAt && Date.now() - merged.loginAt > SESSION_MAX_AGE_MS) {
            merged.currentAccount = null;
            merged.demoMode = false;
            merged.role = "guest";
            merged.loginAt = null;
        }
        return merged;
    } catch (e) {
        console.warn("loadState failed", e);
        return base;
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────

function getCurrentRole() { return state.role || "guest"; }

function currentAccount() {
    if (!state.currentAccount) return null;
    return state.accounts.find((a) => a.id === state.currentAccount?.id || a.username === state.currentAccount?.username) || state.currentAccount;
}

function isLoggedIn() { return Boolean(state.demoMode || state.currentAccount); }

function requireAuth(expectedRole) {
    if (!isLoggedIn() || state.role !== expectedRole) {
        window.location.href = "index.html";
    }
}

async function registerAccount(event) {
    event.preventDefault();
    clearFieldErrors(event.target);
    const account = {
        id: nextAccountId(),
        name: valueOf("register-name"),
        email: valueOf("register-email"),
        username: valueOf("register-username"),
        password: valueOf("register-password"),
        phone: valueOf("register-phone"),
        organization: valueOf("register-organization"),
        role: valueOf("register-role"),
        status: "active",
        createdAt: nowText()
    };
    const confirmPassword = valueOf("register-password-confirm");
    if (Object.values(account).some((v) => String(v).trim() === "")) { showToast("所有欄位皆為必填"); return; }
    let hasError = false;
    if (account.password.length < 6) { showFieldError("register-password", "密碼至少 6 碼"); hasError = true; }
    if (account.password !== confirmPassword) { showFieldError("register-password-confirm", "密碼與確認密碼不一致"); hasError = true; }
    if (state.accounts.some((a) => a.username.toLowerCase() === account.username.toLowerCase())) { showFieldError("register-username", "帳號不可重複"); hasError = true; }
    if (state.accounts.some((a) => a.email.toLowerCase() === account.email.toLowerCase())) { showFieldError("register-email", "Email 不可重複"); hasError = true; }
    if (hasError) { showToast("請修正下方標示的欄位"); return; }
    account.password = await hashPassword(account.password);
    state.accounts.push(account);
    addNotification(account.id, "帳號註冊成功", `已建立 ${ROLES[account.role]} 帳號。`);
    saveState();
    event.target.reset();
    showToast("註冊成功，請登入");
    switchAuthTab("login");
}

async function loginAccount(event) {
    event.preventDefault();
    clearFieldErrors(event.target);
    const username = valueOf("login-username");
    const password = valueOf("login-password");
    const loginFailed = () => {
        showFieldError("login-username", "帳號或密碼錯誤");
        showFieldError("login-password", "帳號或密碼錯誤");
        showToast("帳號或密碼錯誤");
    };
    const candidate = state.accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
    if (!candidate) { loginFailed(); return; }
    let passwordMatches;
    if (isHashedPassword(candidate.password)) {
        passwordMatches = candidate.password === await hashPassword(password);
    } else {
        // legacy plaintext account from before password hashing was added — migrate on successful login
        passwordMatches = candidate.password === password;
        if (passwordMatches) candidate.password = await hashPassword(password);
    }
    if (!passwordMatches) { loginFailed(); return; }
    const account = candidate;
    if (account.status !== "active") { showToast("此帳號已停用"); return; }
    state.currentAccount = account;
    state.role = account.role;
    state.demoMode = false;
    state.loginAt = Date.now();
    saveState();
    window.location.href = ROLE_PAGES[account.role] || "index.html";
}

function demoLogin(role) {
    if (!ROLE_PAGES[role]) return;
    state.currentAccount = null;
    state.role = role;
    state.demoMode = true;
    state.loginAt = Date.now();
    saveState();
    window.location.href = ROLE_PAGES[role];
}

function logoutAccount() {
    state.currentAccount = null;
    state.demoMode = false;
    state.role = "guest";
    state.loginAt = null;
    saveState();
    window.location.href = "index.html";
}

// ─── Navigation ───────────────────────────────────────────────────────

function showSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;
    currentSection = sectionId;
    document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"));
    target.classList.add("active");
    document.querySelectorAll("[data-section]").forEach((btn) => {
        const active = btn.dataset.section === sectionId;
        btn.classList.toggle("active", active);
        btn.closest(".nav-dropdown-wrap")?.classList.toggle("has-active", active);
    });
    updateDocumentTitle(sectionId);
    closeNavMenu();
    if (sectionId === "health-input-section") syncHealthHeightInput(true);
    if (sectionId === "notification-section") markNotificationsAsRead();
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function navigateTo(sectionId) {
    if (!document.getElementById(sectionId)) { showToast("此功能不在目前頁面"); return; }
    showSection(sectionId);
}

function getSectionLabel(id) { return SECTION_LABELS[id] || "AI Health Platform"; }

function updateDocumentTitle(sectionId) {
    const label = getSectionLabel(sectionId);
    document.title = `${label} | AI Health Platform`;
}

// ─── Navbar ───────────────────────────────────────────────────────────

function updateNavbar() {
    const account = currentAccount();
    const role = getCurrentRole();
    const name = account ? account.name : (state.demoMode ? `${ROLES[role]} Demo` : "尚未登入");
    setText("nav-user-name", name.slice(0, 6));
    setText("nav-avatar", name.slice(0, 1).toUpperCase());
    setText("nav-role-label", ROLES[role] || "Guest");
    setText("nav-full-name", name);
    updateNotifBadge();
    document.querySelectorAll("[data-section]").forEach((btn) => {
        const active = btn.dataset.section === currentSection;
        btn.classList.toggle("active", active);
        btn.closest(".nav-dropdown-wrap")?.classList.toggle("has-active", active);
    });
}

function toggleNavMenu() {
    document.getElementById("nav-menu")?.classList.toggle("open");
}

function toggleDarkMode() {
    const isDark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = isDark ? "" : "dark";
    localStorage.setItem("ai_health_platform_theme", isDark ? "light" : "dark");
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const isDark = document.documentElement.dataset.theme === "dark";
    document.querySelectorAll(".dark-mode-toggle").forEach((btn) => {
        btn.textContent = isDark ? "☀️" : "🌙";
        btn.setAttribute("aria-pressed", String(isDark));
        btn.title = isDark ? "切換為亮色模式" : "切換為深色模式";
    });
}

function closeNavMenu() {
    document.getElementById("nav-menu")?.classList.remove("open");
    document.querySelectorAll(".nav-dropdown-wrap.open").forEach((w) => {
        w.classList.remove("open");
        w.querySelector(".nav-btn")?.setAttribute("aria-expanded", "false");
    });
}

function toggleDropdown(el) {
    const wrap = el.closest(".nav-dropdown-wrap");
    if (!wrap) return;
    const wasOpen = wrap.classList.contains("open");
    document.querySelectorAll(".nav-dropdown-wrap.open").forEach((w) => {
        w.classList.remove("open");
        w.querySelector(".nav-btn")?.setAttribute("aria-expanded", "false");
    });
    if (!wasOpen) {
        wrap.classList.add("open");
        positionNavDropdown(wrap);
        el.setAttribute("aria-expanded", "true");
    }
}

function initNavAccessibility() {
    document.querySelectorAll(".nav-dropdown-wrap > .nav-btn").forEach((btn) => {
        btn.setAttribute("aria-haspopup", "true");
        if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
    });
}

function positionNavDropdown(wrap) {
    const dropdown = wrap.querySelector(".nav-dropdown");
    if (!dropdown || window.innerWidth <= 768) return;
    const rect = wrap.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.left = `${rect.left}px`;
}

function toggleUserMenu() {
    const wrap = document.getElementById("nav-user-wrap");
    wrap?.classList.toggle("open");
}

function notificationsForCurrentAccount() {
    const account = currentAccount();
    return state.notifications.filter((item) => item.accountId === "all" || item.accountId === account?.id || getCurrentRole() === "admin");
}

function updateNotifBadge() {
    const count = notificationsForCurrentAccount().filter((item) => !item.isRead).length;
    ["nav-notif-count", "nav-notif-count-icon"].forEach((id) => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = count > 0 ? String(count) : "";
        badge.classList.toggle("hidden", count === 0);
    });
}

function markNotificationsAsRead() {
    let changed = false;
    notificationsForCurrentAccount().forEach((item) => {
        if (!item.isRead) { item.isRead = true; changed = true; }
    });
    if (changed) { saveState(); updateNotifBadge(); }
}

// ─── Render All ───────────────────────────────────────────────────────

function ensureProfileUI() {
    if (getCurrentRole() !== "user") return;
    const pageContent = document.querySelector(".page-content");
    if (pageContent && !document.getElementById("profile-section")) {
        const section = document.createElement("section");
        section.id = "profile-section";
        section.className = "content-section";
        section.innerHTML = `
            <h2 class="section-title">個人資料設定</h2>
            <div class="card form-card profile-card">
                <form onsubmit="submitProfileSettings(event)">
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="profile-name">姓名</label>
                            <input id="profile-name" type="text" required />
                        </div>
                        <div class="form-group">
                            <label for="profile-gender">性別</label>
                            <select id="profile-gender" required>
                                <option value="male">男</option>
                                <option value="female">女</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row-3">
                        <div class="form-group">
                            <label for="profile-birthday">生日</label>
                            <input id="profile-birthday" type="date" required />
                        </div>
                        <div class="form-group">
                            <label for="profile-height">身高 cm</label>
                            <input id="profile-height" type="number" min="80" max="230" step="0.1" required />
                        </div>
                        <div class="form-group">
                            <label for="profile-target-weight">目標體重 kg</label>
                            <input id="profile-target-weight" type="number" min="30" max="250" step="0.1" required />
                        </div>
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="profile-daily-step-goal">每日步數目標</label>
                            <input id="profile-daily-step-goal" type="number" min="0" max="100000" step="100" required />
                        </div>
                        <div class="form-group">
                            <label for="profile-weekly-exercise-goal">每週運動目標分鐘數</label>
                            <input id="profile-weekly-exercise-goal" type="number" min="0" max="2000" step="5" required />
                        </div>
                    </div>
                    <p class="profile-help">BMI 計算主要使用此處的身高設定；單筆健康資料若有身高，會優先使用該筆資料。</p>
                    <button type="submit" class="primary-button">儲存個人資料</button>
                </form>
            </div>
        `;
        const healthInput = document.getElementById("health-input-section");
        pageContent.insertBefore(section, healthInput || pageContent.firstChild);
    }
    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="profile-section"]')) {
        const button = document.createElement("button");
        button.className = "nav-btn";
        button.dataset.section = "profile-section";
        button.type = "button";
        button.textContent = "個人資料設定";
        button.onclick = () => showSection("profile-section");
        const dashboardButton = navMenu.querySelector('[data-section="user-dashboard-section"]');
        dashboardButton?.insertAdjacentElement("afterend", button);
    }
    const heightInput = document.getElementById("health-height");
    if (heightInput) {
        heightInput.min = "80";
        heightInput.max = "230";
        heightInput.placeholder = String(getUserHeight());
    }
}

function renderProfileSection() {
    if (!document.getElementById("profile-section")) return;
    const account = currentAccount();
    const patient = state.patient;
    setInputValue("profile-name", patient.name || account?.name || "");
    setInputValue("profile-gender", patient.gender || "male");
    setInputValue("profile-birthday", patient.birthday || "1990-01-01");
    setInputValue("profile-height", patient.height || 175);
    setInputValue("profile-target-weight", patient.targetWeight || 68);
    setInputValue("profile-daily-step-goal", patient.dailyStepGoal || 10000);
    setInputValue("profile-weekly-exercise-goal", patient.weeklyExerciseGoal || 150);
}

function submitProfileSettings(event) {
    event.preventDefault();
    const height = Number(valueOf("profile-height"));
    if (!isValidHeight(height)) {
        showToast("請輸入合理身高範圍 80～230 cm。");
        return;
    }
    const oldHeight = getUserHeight();
    state.patient = {
        ...state.patient,
        name: valueOf("profile-name"),
        gender: valueOf("profile-gender"),
        birthday: valueOf("profile-birthday"),
        height,
        targetWeight: Number(valueOf("profile-target-weight")),
        dailyStepGoal: Number(valueOf("profile-daily-step-goal")),
        weeklyExerciseGoal: Number(valueOf("profile-weekly-exercise-goal")),
        heightUpdatedAt: height !== oldHeight ? nowText() : (state.patient.heightUpdatedAt || nowText())
    };
    const account = currentAccount();
    if (account?.role === "user") {
        account.name = state.patient.name;
        state.currentAccount = { ...state.currentAccount, name: state.patient.name };
    }
    state.healthRecords = state.healthRecords.map((record) => record.height ? record : {
        ...record,
        bmi: calculateBMI(record.weight, state.patient.height)
    });
    syncHealthHeightInput(true);
    saveState();
    showToast("個人資料設定已儲存");
    renderAll();
}

function syncHealthHeightInput(force = false) {
    const input = document.getElementById("health-height");
    if (!input) return;
    if (force || !input.value) input.value = getUserHeight();
}

function initCustomSelects() {
    enhanceRegistrationCategorySelect();
    document.querySelectorAll(".custom-select").forEach((select) => {
        if (select.dataset.initialized === "true") return;
        const trigger = select.querySelector(".custom-select-trigger");
        const menu = select.querySelector(".custom-select-menu");
        const label = trigger?.querySelector("span");
        const hiddenInput = select.querySelector("input[type='hidden']");
        const options = menu?.querySelectorAll("button") || [];
        if (!trigger || !menu || !label || !hiddenInput) return;

        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");

        const current = hiddenInput.value || options[0]?.getAttribute("data-value") || "";
        if (current) {
            hiddenInput.value = current;
            label.textContent = current;
        }

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".custom-select").forEach((other) => {
                if (other !== select) {
                    other.classList.remove("open");
                    other.querySelector(".custom-select-trigger")?.setAttribute("aria-expanded", "false");
                }
            });
            const nowOpen = select.classList.toggle("open");
            trigger.setAttribute("aria-expanded", String(nowOpen));
        });

        options.forEach((option) => {
            option.addEventListener("click", () => {
                const value = option.getAttribute("data-value");
                hiddenInput.value = value;
                label.textContent = value;
                select.classList.remove("open");
                trigger.setAttribute("aria-expanded", "false");
            });
        });

        select.dataset.initialized = "true";
    });

    if (document.body.dataset.customSelectCloseReady === "true") return;
    document.addEventListener("click", () => {
        document.querySelectorAll(".custom-select").forEach((select) => {
            select.classList.remove("open");
            select.querySelector(".custom-select-trigger")?.setAttribute("aria-expanded", "false");
        });
    });
    document.body.dataset.customSelectCloseReady = "true";
}

function enhanceRegistrationCategorySelect() {
    const nativeSelect = document.querySelector('select#reg-category');
    if (!nativeSelect || nativeSelect.closest(".custom-select")) return;
    const allowed = ["醫療資訊", "運動健康", "長期照護", "教育科技", "問卷／資料收集應用"];
    const value = allowed.includes(nativeSelect.value) ? nativeSelect.value : "運動健康";
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    wrapper.dataset.target = "reg-category";
    wrapper.innerHTML = `
        <button type="button" class="custom-select-trigger">
            <span>${escapeHTML(value)}</span>
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="custom-select-menu">
            <button type="button" data-value="醫療資訊">醫療資訊</button>
            <button type="button" data-value="運動健康">運動健康</button>
            <button type="button" data-value="長期照護">長期照護</button>
            <button type="button" data-value="教育科技">教育科技</button>
            <button type="button" data-value="問卷／資料收集應用">問卷／資料收集應用</button>
        </div>
        <input type="hidden" id="reg-category" value="${escapeHTML(value)}" />
    `;
    nativeSelect.replaceWith(wrapper);
}

function setCustomSelectValue(inputId, value) {
    const hiddenInput = document.getElementById(inputId);
    if (!hiddenInput) return;
    hiddenInput.value = value;
    const customSelect = hiddenInput.closest(".custom-select");
    const label = customSelect?.querySelector(".custom-select-trigger span");
    if (label) label.textContent = value;
}

function renderHomeStats() {
    setText("hero-fhir-count", state.healthRecords.length * 7);
    setText("hero-auth-count", state.authorizations.length);
    setText("home-fhir-resources", state.healthRecords.length * 7);
    setText("home-auth-count", state.authorizations.length);
}

function renderUserDashboard() {
    const record = latestRecord(activeUserId());
    const analysis = runAIAnalysis(activeUserId());
    const height = record?.height || getUserHeight();
    const bmi = record ? calculateBMI(record.weight, height) : "--";
    setHTML("user-dashboard-cards", [
        kpi("今日血壓", record ? `${record.systolic}/${record.diastolic}` : "--", "mmHg"),
        kpi("今日心率", record?.heartRate ?? "--", "bpm"),
        kpi("今日體重", record?.weight ?? "--", "kg"),
        kpi("BMI", bmi, record ? bmiCategory(bmi) : ""),
        kpi("今日步數", record?.steps?.toLocaleString() ?? "--", "steps"),
        kpi("本週運動時間", `${analysis.weeklyExercise}`, "分鐘"),
        kpi("身高資料來源", `${height} cm`, `BMI 計算來源：${record?.height ? "該筆健康資料" : "個人身高設定"}；最近更新：${state.patient.heightUpdatedAt || "--"}`)
    ].join(""));
    setHTML("user-ai-summary", `<p>${escapeHTML(analysis.healthAdvice)}</p>`);
    setHTML("user-notification-summary", notificationList(3));
}

function renderCoachDashboard() { updateCoachDashboard(); }
function renderNutritionDashboard() { updateNutritionDashboard(); }

function renderAdminDashboard() {
    setHTML("admin-dashboard-cards", [
        kpi("使用者總數", state.accounts.length, "帳號"),
        kpi("FHIR Resources", state.healthRecords.length * 7, "筆"),
        kpi("Observation", state.healthRecords.length * 7, "筆"),
        kpi("授權紀錄", state.authorizations.length, "筆"),
        kpi("區塊鏈紀錄", state.blockchainLogs.length, "筆"),
        kpi("報名總數", state.registrations.length, "筆"),
        kpi("待審核報名", state.registrations.filter((i) => i.status === "待審核").length, "筆"),
        kpi("系統通知", state.notifications.length, "則")
    ].join(""));
    setHTML("admin-system-summary", `<p>系統保留 localStorage Demo 資料，包含 FHIR、授權、區塊鏈紀錄、通知與競賽報名審核。</p>`);
}

function renderFHIRViewer() {
    setText("fhir-json-output", JSON.stringify(generateFHIRBundle(activeUserId()), null, 2));
}

function renderTables() {
    const accountId = activeUserId();
    const registration = state.registrations.filter((i) => i.accountId === accountId).slice(-1)[0];
    setHTML("my-registration-body", renderMyRegistrationPage(registration));
}

function renderMyRegistrationPage(item) {
    if (!item) {
        return `
            <div class="registration-management">
                <div class="registration-page-heading">
                    <span>Registration</span>
                    <h2>我的競賽報名</h2>
                    <p>尚未建立報名資料，請先填寫隊伍資料、作品資訊與 FHIR 實作內容。</p>
                </div>
                <div class="registration-empty">
                    <strong>尚無報名紀錄</strong>
                    <p>送出報名後，這裡會顯示審核狀態、報名摘要與後續操作。</p>
                    <button type="button" class="primary-button" onclick="showSection('registration-section')">前往填寫報名</button>
                </div>
            </div>
        `;
    }
    return `
        <div class="registration-management">
            <div class="registration-page-heading">
                <span>Registration</span>
                <h2>我的競賽報名</h2>
                <p>追蹤報名進度、檢查作品連結狀態，並管理送審資料。</p>
            </div>
            <div class="registration-status-card">
                <div>
                    <span>報名狀態</span>
                    ${registrationBadge(item.status)}
                </div>
                <div><span>報名編號</span><strong>${escapeHTML(item.id)}</strong></div>
                <div><span>隊伍名稱</span><strong>${escapeHTML(item.teamName)}</strong></div>
                <div><span>作品名稱</span><strong>${escapeHTML(item.projectName)}</strong></div>
                <div><span>GitHub 狀態</span><strong>${item.githubUrl ? "已提供" : "未提供"}</strong></div>
                <div><span>Demo 連結狀態</span><strong>${item.demoUrl ? "已提供" : "未提供"}</strong></div>
            </div>
            ${registrationProgress(item)}
            <div class="card registration-summary-card">
                <h3>報名資料摘要</h3>
                <div class="registration-summary-grid">
                    ${registrationSummaryItem("主題領域", item.category)}
                    ${registrationSummaryItem("隊長姓名", item.leaderName)}
                    ${registrationSummaryItem("Email", item.email)}
                    ${registrationSummaryItem("學校／單位", item.organization)}
                    ${registrationSummaryItem("使用者角色", item.roles)}
                    ${registrationSummaryItem("FHIR Resources", item.fhirResources)}
                </div>
            </div>
            <div class="registration-action-grid">
                <button type="button" class="primary-button" onclick="showSection('registration-section')">前往填寫報名</button>
                <button type="button" class="secondary-button" onclick="showRegistrationDetail('${item.id}')">查看報名詳情</button>
                <button type="button" class="secondary-button" onclick="editRegistration('${item.id}')">修改報名資料</button>
                <button type="button" class="secondary-button" ${item.githubUrl ? "" : "disabled"} onclick="copyRegistrationGithub('${item.id}')">複製 GitHub 連結</button>
            </div>
        </div>
    `;
}

function registrationProgress(item) {
    const hasGithub = Boolean(item.githubUrl);
    const submitted = Boolean(item.createdAt);
    const reviewed = item.status && item.status !== "待審核";
    const steps = [
        ["填寫資料", true],
        ["上傳 GitHub", hasGithub],
        ["送出報名", submitted],
        ["大會審核", submitted],
        ["審核結果", reviewed]
    ];
    return `
        <div class="registration-progress">
            ${steps.map(([label, done], index) => `
                <div class="registration-step ${done ? "done" : ""} ${(!done && steps.slice(0, index).every(([, ok]) => ok)) ? "active" : ""}">
                    <span>${done ? "✓" : index + 1}</span>
                    <strong>${label}</strong>
                </div>
            `).join("")}
        </div>
    `;
}

function registrationSummaryItem(label, value) {
    return `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || "未填寫")}</strong></div>`;
}

function renderCoachViews() {
    renderAuthorizedStudents();
    renderStudentExerciseData();
    const validAuths = getAuthorizationsByRole("coach").filter(isAuthorizationValid).filter(hasCoachDataScope);
    setHTML("training-advice-panel", validAuths.map((auth) => {
        const analysis = runAIAnalysis(authPatientId(auth));
        return `<div class="card auth-data-card"><h3>${escapeHTML(auth.patientName || patientName(auth))}</h3><p>${escapeHTML(analysis.exerciseAdvice)}</p></div>`;
    }).join("") || `<div class="card empty">尚未取得學員授權資料。</div>`);
    setHTML("training-record-list", state.trainingRecords.map((i) => `<div class="record-card"><strong>${escapeHTML(i.studentName)}：${escapeHTML(i.title)}</strong><p>${escapeHTML(i.content)}</p><small class="muted">${i.createdAt}</small></div>`).join(""));
}

function renderNutritionViews() {
    renderAuthorizedCases();
    renderCaseNutritionData();
    setHTML("nutrition-record-list", state.nutritionRecords.map((i) => `<div class="record-card"><strong>${escapeHTML(i.caseName)}：${escapeHTML(i.title)}</strong><p>${escapeHTML(i.content)}</p><small class="muted">${i.createdAt}</small></div>`).join(""));
}

function renderAdminViews() {
    setHTML("account-management-body", state.accounts.map((a) => `
        <tr><td>${escapeHTML(a.name)}</td><td>${escapeHTML(a.username)}</td><td>${escapeHTML(a.email)}</td><td>${ROLES[a.role]}</td><td>${statusPill(a.status === "active" ? "啟用" : "停用", a.status === "active" ? "active" : "disabled")}</td>
        <td><button class="mini-button" onclick="toggleAccount('${a.id}')">${a.status === "active" ? "停用" : "啟用"}</button></td></tr>
    `).join(""));
    setHTML("user-management-body", state.accounts.map((a) => `<tr><td>${escapeHTML(a.name)}</td><td>${escapeHTML(a.email)}</td><td>${ROLES[a.role]}</td><td>${escapeHTML(a.organization)}</td><td>${escapeHTML(a.phone)}</td></tr>`).join(""));
    setHTML("fhir-record-list", state.accounts.filter((a) => a.role === "user").map((a) => `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${escapeHTML(a.name)}</h3><button class="secondary-button" onclick="downloadFHIRForAccount('${a.id}')">下載 .json</button></div><pre class="code-block">${escapeHTML(JSON.stringify(generateFHIRBundle(a.id), null, 2))}</pre></div>`).join(""));
    setHTML("observation-record-panel", `<div class="kpi-grid">${kpi("健康紀錄", state.healthRecords.length, "筆")}${kpi("Observation", state.healthRecords.length * 7, "筆")}${kpi("使用者", state.accounts.filter((a) => a.role === "user").length, "人")}</div>`);
    setHTML("authorization-record-body", state.authorizations.map((auth) => {
        const n = normalizeAuthorization(auth);
        return `<tr><td>${escapeHTML(n.patientName)}</td><td>${escapeHTML(n.targetName || ROLES[n.targetRole] || n.targetRole)}</td><td>${scopeBadges(n.dataScopes)}</td><td><code>${escapeHTML(n.hash)}</code><br>${authorizationStatusBadge(n)}</td><td>${n.createdAt}</td></tr>`;
    }).join("") || emptyRow(5));
    setHTML("blockchain-body", state.blockchainLogs.map((log) => `<tr><td><code>${escapeHTML(log.hash)}</code></td><td>${escapeHTML(log.source)}</td><td>${escapeHTML(log.event)}</td><td>${log.createdAt}</td></tr>`).join("") || emptyRow(4));
}

function renderRegistrations() {
    setHTML("registration-list-body", state.registrations.map((i) => `
        <tr>
            <td><code>${escapeHTML(i.id)}</code></td>
            <td>${escapeHTML(i.teamName)}</td>
            <td>${escapeHTML(i.projectName)}</td>
            <td>${escapeHTML(i.category)}</td>
            <td>${escapeHTML(i.leaderName)}</td>
            <td>${escapeHTML(i.email)}</td>
            <td>${registrationBadge(i.status)}</td>
            <td><button type="button" class="mini-button registration-mini-button" onclick="showRegistrationDetail('${i.id}')">詳情</button></td>
        </tr>
    `).join("") || `<tr><td colspan="8"><div class="registration-empty"><strong>尚無報名資料</strong><p>使用者送出競賽報名後，資料會顯示在這裡。</p></div></td></tr>`);
    setHTML("registration-review-panel", state.registrations.map((i) => `
        <div class="card registration-review-card">
            <div>
                <h3>${escapeHTML(i.projectName)}</h3>
                <p>團隊：${escapeHTML(i.teamName)} ｜ 負責人：${escapeHTML(i.leaderName)}</p>
            </div>
            ${registrationBadge(i.status)}
            <div class="dashboard-actions">
                <button class="primary-button" onclick="updateRegistrationStatus('${i.id}', '審核通過')">審核通過</button>
                <button class="secondary-button" onclick="updateRegistrationStatus('${i.id}', '需補件')">需補件</button>
                <button class="danger-button" onclick="updateRegistrationStatus('${i.id}', '退件')">退件</button>
            </div>
        </div>
    `).join("") || `<div class="card empty">目前沒有報名資料。</div>`);
}

function registrationBadge(status) {
    const label = status || "待審核";
    const cls = label === "審核通過" ? "approved" : label === "需補件" ? "revision" : label === "退件" ? "rejected" : "pending";
    return `<span class="registration-badge ${cls}">${escapeHTML(label)}</span>`;
}

function showRegistrationDetail(id) {
    const item = state.registrations.find((registration) => registration.id === id);
    if (!item) return;
    ensureRegistrationModal();
    setHTML("registration-modal-content", `
        <div class="registration-modal-header">
            <div>
                <span>報名詳情</span>
                <h3>${escapeHTML(item.projectName)}</h3>
            </div>
            ${registrationBadge(item.status)}
            <button type="button" class="modal-close-button" onclick="closeRegistrationModal()">×</button>
        </div>
        <div class="registration-modal-body">
            <div class="registration-summary-grid two-col">
                ${registrationSummaryItem("報名編號", item.id)}
                ${registrationSummaryItem("隊伍名稱", item.teamName)}
                ${registrationSummaryItem("主題領域", item.category)}
                ${registrationSummaryItem("隊長姓名", item.leaderName)}
                ${registrationSummaryItem("Email", item.email)}
                ${registrationSummaryItem("學校／單位", item.organization)}
                ${registrationSummaryItem("使用者角色", item.roles)}
                ${registrationSummaryItem("FHIR Resources", item.fhirResources)}
            </div>
            <div class="registration-link-row">
                ${item.githubUrl ? `<a class="secondary-button" href="${escapeHTML(item.githubUrl)}" target="_blank" rel="noreferrer">開啟 GitHub</a>` : `<button class="secondary-button" disabled>未提供 GitHub</button>`}
                ${item.demoUrl ? `<a class="secondary-button" href="${escapeHTML(item.demoUrl)}" target="_blank" rel="noreferrer">開啟 Demo</a>` : `<button class="secondary-button" disabled>未提供 Demo</button>`}
            </div>
            <div class="registration-review-note">
                <strong>審核意見</strong>
                <p>${escapeHTML(item.reviewComment || "尚無審核意見。")}</p>
            </div>
        </div>
    `);
    document.getElementById("registration-modal")?.classList.add("show");
}

function ensureRegistrationModal() {
    if (document.getElementById("registration-modal")) return;
    const modal = document.createElement("div");
    modal.id = "registration-modal";
    modal.className = "registration-modal";
    modal.innerHTML = `<div class="registration-modal-panel" id="registration-modal-content"></div>`;
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeRegistrationModal();
    });
    document.body.appendChild(modal);
}

function closeRegistrationModal() {
    document.getElementById("registration-modal")?.classList.remove("show");
}

function copyRegistrationGithub(id) {
    const item = state.registrations.find((registration) => registration.id === id);
    if (!item?.githubUrl) {
        showToast("尚未提供 GitHub 連結");
        return;
    }
    if (navigator.clipboard) navigator.clipboard.writeText(item.githubUrl);
    showToast("GitHub 連結已複製");
}

function editRegistration(id) {
    const item = state.registrations.find((registration) => registration.id === id);
    if (!item) return;
    state.editingRegistrationId = id;
    showSection("registration-section");
    setInputValue("reg-team-name", item.teamName);
    setInputValue("reg-project-name", item.projectName);
    setInputValue("reg-leader-name", item.leaderName);
    setInputValue("reg-email", item.email);
    setInputValue("reg-phone", item.phone);
    setInputValue("reg-organization", item.organization);
    setInputValue("reg-member-1", item.members?.[0] || "");
    setInputValue("reg-member-2", item.members?.[1] || "");
    setInputValue("reg-member-3", item.members?.[2] || "");
    setInputValue("reg-description", item.description);
    setInputValue("reg-roles", item.roles);
    setInputValue("reg-fhir-resources", item.fhirResources);
    setInputValue("reg-github-url", item.githubUrl);
    setInputValue("reg-demo-url", item.demoUrl);
    setInputValue("reg-note", item.note);
    setCustomSelectValue("reg-category", item.category || "運動健康");
}

function renderNotifications() {
    const notifications = notificationsForCurrentAccount();
    const html = notifications.map((i) => `<div class="timeline-item${i.isRead ? "" : " unread"}"><strong>${escapeHTML(i.title)}</strong>${i.isRead ? "" : `<span class="unread-dot" title="未讀"></span>`}<p>${escapeHTML(i.message)}</p><small class="muted">${i.createdAt}</small></div>`).join("") || `<div class="card empty">目前沒有通知。</div>`;
    setHTML("notification-list", html);
    setHTML("system-notification-list", html);
}

// ─── Chart.js helpers ─────────────────────────────────────────────────

function chartjsReady() { return typeof Chart !== "undefined"; }

function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function createDoughnutChart(canvasId, { labels, data, colors }) {
    if (!chartjsReady()) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);
    _charts[canvasId] = new Chart(canvas, {
        type: "doughnut",
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: { legend: { position: "bottom", labels: { padding: 12, font: { size: 12, weight: "600", family: "Inter, sans-serif" }, usePointStyle: true } } }
        }
    });
}

function createBarChartJS(canvasId, { labels, datasets, yLabel = "", horizontal = false }) {
    if (!chartjsReady()) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);
    _charts[canvasId] = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: datasets.map((d) => ({
                label: d.label,
                data: d.data,
                backgroundColor: Array.isArray(d.colors) ? d.colors : (d.color + "cc"),
                borderColor: Array.isArray(d.colors) ? d.colors : d.color,
                borderWidth: 1,
                borderRadius: 5,
                borderSkipped: false
            }))
        },
        options: {
            indexAxis: horizontal ? "y" : "x",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: datasets.length > 1 } },
            scales: {
                y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 } }, title: yLabel ? { display: true, text: yLabel, font: { size: 11 } } : undefined },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });
}

function createLineChartJS(canvasId, { labels, datasets }) {
    if (!chartjsReady()) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);
    _charts[canvasId] = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: datasets.map((d) => ({
                label: d.label,
                data: d.data,
                borderColor: d.color,
                backgroundColor: d.color + "18",
                tension: 0.35,
                fill: d.fill !== false,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top", labels: { font: { size: 11 }, usePointStyle: true } } },
            scales: {
                y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });
}

// ─── Chart.js render functions ────────────────────────────────────────

function renderAdminCharts() {
    if (!chartjsReady()) return;
    const roleCounts = ["user", "coach", "nutritionist", "admin"].map((r) => state.accounts.filter((a) => a.role === r).length);
    createDoughnutChart("chart-admin-roles", { labels: ["一般使用者", "健身教練", "營養師", "系統管理員"], data: roleCounts, colors: ["#0f766e", "#2563eb", "#db2777", "#f59e0b"] });

    const regBuckets = { "待審核": 0, "審核通過": 0, "需補件": 0, "退件": 0 };
    state.registrations.forEach((r) => { if (r.status in regBuckets) regBuckets[r.status]++; });
    createDoughnutChart("chart-admin-reg", { labels: Object.keys(regBuckets), data: Object.values(regBuckets), colors: ["#f59e0b", "#16a34a", "#2563eb", "#dc2626"] });

    const userCount = state.accounts.filter((a) => a.role === "user").length;
    createBarChartJS("chart-admin-fhir", {
        labels: ["Patient", "Observation", "Practitioner", "Bundle"],
        datasets: [{ label: "資源數量", data: [userCount, state.healthRecords.length * 7, 1, userCount], colors: ["#0f766e", "#2563eb", "#db2777", "#f59e0b"] }]
    });

    const validAuth = state.authorizations.filter(isAuthorizationValid).length;
    createDoughnutChart("chart-admin-auth", { labels: ["有效授權", "已過期"], data: [validAuth || 0, (state.authorizations.length - validAuth) || 0], colors: ["#16a34a", "#94a3b8"] });
}

function renderCoachCharts() {
    if (!chartjsReady()) return;
    const auths = getAuthorizationsByRole("coach").filter(isAuthorizationValid).filter(hasCoachDataScope);
    if (!auths.length) return;
    const labels = auths.map((a) => String(a.patientName || patientName(a)).replace(/[<>"&]/g, ""));
    const achievements = auths.map((a) => {
        const weekly = runAIAnalysis(authPatientId(a)).weeklyExercise;
        return Math.min(100, Math.round((weekly / 150) * 100));
    });
    createBarChartJS("chart-coach-achievement", {
        labels,
        datasets: [{ label: "運動達成率 (%)", data: achievements, color: "#0f766e", colors: achievements.map((v) => v >= 100 ? "#16a34a" : v >= 50 ? "#f59e0b" : "#dc2626") }],
        yLabel: "%"
    });
}

function renderNutritionCharts() {
    if (!chartjsReady()) return;
    const auths = getAuthorizationsByRole("nutritionist").filter(isAuthorizationValid).filter(hasNutritionDataScope);
    if (!auths.length) return;
    const records = unique(auths.map(authPatientId)).map((id) => latestRecord(id)).filter(Boolean);
    const bmiCats = { 過輕: 0, 正常: 0, 過重: 0, 肥胖: 0 };
    records.forEach((r) => { const cat = bmiCategory(r.bmi); if (cat in bmiCats) bmiCats[cat]++; });
    createDoughnutChart("chart-nutrition-bmi", { labels: Object.keys(bmiCats), data: Object.values(bmiCats), colors: ["#60a5fa", "#16a34a", "#f59e0b", "#dc2626"] });
    const normal = records.filter((r) => r.systolic < 130 && r.diastolic < 80).length;
    createDoughnutChart("chart-nutrition-bp", { labels: ["血壓正常", "血壓偏高"], data: [normal, records.length - normal], colors: ["#16a34a", "#dc2626"] });
}

function renderUserDashboardCharts() {
    if (!chartjsReady()) return;
    const records = recordsByAccount(activeUserId()).slice(-7);
    if (!records.length) return;
    const labels = records.map((r) => r.date.slice(5));
    createLineChartJS("chart-user-bp", {
        labels,
        datasets: [
            { label: "收縮壓", data: records.map((r) => r.systolic), color: "#dc2626", fill: false },
            { label: "舒張壓", data: records.map((r) => r.diastolic), color: "#2563eb", fill: false }
        ]
    });
    createBarChartJS("chart-user-steps", {
        labels,
        datasets: [{ label: "步數", data: records.map((r) => r.steps), color: "#0f766e", colors: records.map((r) => r.steps >= 10000 ? "#16a34a" : r.steps >= 6000 ? "#f59e0b" : "#dc2626") }]
    });
}

// ─── Health Data ──────────────────────────────────────────────────────

function submitRegistration(event) {
    event.preventDefault();
    const editingId = state.editingRegistrationId;
    const existing = editingId ? state.registrations.find((item) => item.id === editingId) : null;
    const registration = {
        id: existing?.id || nextRegistrationId(), accountId: existing?.accountId || activeUserId(),
        teamName: valueOf("reg-team-name"), projectName: valueOf("reg-project-name"),
        category: valueOf("reg-category"), leaderName: valueOf("reg-leader-name"),
        email: valueOf("reg-email"), phone: valueOf("reg-phone"),
        organization: valueOf("reg-organization"),
        members: [valueOf("reg-member-1"), valueOf("reg-member-2"), valueOf("reg-member-3")].filter(Boolean),
        description: valueOf("reg-description"), roles: valueOf("reg-roles"),
        fhirResources: valueOf("reg-fhir-resources"), githubUrl: valueOf("reg-github-url"),
        demoUrl: valueOf("reg-demo-url"), note: valueOf("reg-note"),
        status: existing?.status || "待審核", reviewComment: existing?.reviewComment || "", createdAt: existing?.createdAt || nowText()
    };
    if (existing) {
        Object.assign(existing, registration, { updatedAt: nowText() });
        state.editingRegistrationId = null;
        addNotification(activeUserId(), "報名資料已更新", `報名編號：${registration.id}`);
    } else {
        state.registrations.unshift(registration);
        addNotification(activeUserId(), "報名資料已送出", `報名編號：${registration.id}`);
    }
    saveState();
    event.target.reset();
    setCustomSelectValue("reg-category", "運動健康");
    showToast(existing ? "報名資料已更新" : "報名已送出");
    showSection("my-registration-section");
}

function generateQRCode(event) {
    event.preventDefault();
    const auth = createAuthorization();
    if (!auth) return;
    drawQRCode(`${auth.id}|${auth.hash}`);
    setText("qr-target", ROLES[auth.targetRole] || auth.targetRole);
    setText("qr-scope", auth.dataScopes.join("、"));
    setText("qr-expire", auth.expiredAt);
    setText("qr-token", auth.hash);
    showToast("授權 QR Code 已產生");
    renderAll();
}

function createAuthorization() {
    const targetRole = valueOf("share-target-role");
    const dataScopes = Array.from(document.querySelectorAll('input[name="share-data-scope"]:checked')).map((i) => i.value);
    const duration = valueOf("share-duration") || "7天";
    const patient = currentAccount()?.role === "user" ? currentAccount() : state.accounts.find((a) => a.id === activeUserId());
    const target = state.accounts.find((a) => a.role === targetRole);
    if (!targetRole) { showToast("請選擇授權對象"); return null; }
    if (!dataScopes.length) { showToast("請至少勾選一項授權資料範圍"); return null; }
    const createdAt = nowText();
    const expiredAt = authorizationExpiredAt(duration);
    const token = `${patient?.id || activeUserId()}-${targetRole}-${dataScopes.join(",")}-${createdAt}`;
    const hash = `0x${hashText(token).toUpperCase()}`;
    const auth = {
        id: nextAuthorizationId(), patientId: patient?.id || activeUserId(), patientName: patient?.name || "王小明",
        targetRole, targetName: target?.name || (targetRole === "coach" ? "李教練" : ROLES[targetRole] || targetRole),
        dataScopes, duration, status: "有效", hash, createdAt, expiredAt
    };
    state.authorizations.push(auth);
    addBlockchainLog(auth.patientName, `授權 ${auth.targetName} 查看 ${auth.dataScopes.join("、")}`, hash);
    addNotification(auth.patientId, "授權分享已建立", `已授權 ${auth.targetName} 查看 ${auth.dataScopes.join("、")}，期限：${auth.duration}。`);
    addNotification("all", "新增授權紀錄", `${auth.patientName} 已授權 ${auth.targetName} 查看 ${auth.dataScopes.join("、")}。`);
    saveState();
    return auth;
}

// ─── Authorized views ─────────────────────────────────────────────────

function renderAuthorizedStudents() {
    const auths = getAuthorizationsByRole("coach");
    setHTML("student-list-body", auths.map((auth) => {
        const valid = isAuthorizationValid(auth);
        return `
            <tr>
                <td>${escapeHTML(auth.patientName || patientName(auth))}</td>
                <td>${scopeBadges(auth.dataScopes)}</td>
                <td>${escapeHTML(auth.duration || "--")}<br><small class="muted">${escapeHTML(auth.expiredAt || "--")}</small></td>
                <td>${authorizationStatusBadge(auth)}</td>
                <td><button class="mini-button" ${valid && hasCoachDataScope(auth) ? "" : "disabled"} onclick="showSection('student-exercise-section')">查看運動資料</button></td>
            </tr>`;
    }).join("") || emptyRow(5));
}

function renderStudentExerciseData() {
    const auths = getAuthorizationsByRole("coach").filter(isAuthorizationValid).filter(hasCoachDataScope);
    setHTML("student-exercise-panel", auths.map((auth) => {
        const patientId = authPatientId(auth);
        const latest = latestRecord(patientId);
        const analysis = runAIAnalysis(patientId);
        if (!latest) return `<div class="card empty">尚未取得學員授權資料。</div>`;
        const achievement = Math.min(100, Math.round((analysis.weeklyExercise / 150) * 100));
        return `
            <div class="card auth-data-card">
                <h3>${escapeHTML(auth.patientName || patientName(auth))}</h3>
                <div class="auth-metric-grid">
                    ${authAllows(auth, "步數") ? authMetric("步數", latest.steps?.toLocaleString() || "--", "steps") : ""}
                    ${authAllows(auth, "運動紀錄") ? authMetric("運動時間", `${latest.exercise ?? "--"}`, "分鐘") : ""}
                    ${authAllows(auth, "運動紀錄") ? authMetric("消耗熱量", `${estimateCalories(latest)}`, "kcal") : ""}
                    ${authAllows(auth, "心率") ? authMetric("心率", `${latest.heartRate ?? "--"}`, "bpm") : ""}
                    ${authAllows(auth, "運動紀錄") ? authMetric("運動達成率", `${achievement}%`, "每週 150 分鐘") : ""}
                </div>
                <div class="advice-item"><strong>AI 訓練建議</strong><p>${escapeHTML(analysis.exerciseAdvice)}</p></div>
            </div>`;
    }).join("") || `<div class="card empty">尚未取得學員授權資料。</div>`);
}

function renderAuthorizedCases() {
    const auths = getAuthorizationsByRole("nutritionist");
    setHTML("case-list-body", auths.map((auth) => {
        const valid = isAuthorizationValid(auth);
        return `
            <tr>
                <td>${escapeHTML(auth.patientName || patientName(auth))}</td>
                <td>${scopeBadges(auth.dataScopes)}</td>
                <td>${escapeHTML(auth.duration || "--")}<br><small class="muted">${escapeHTML(auth.expiredAt || "--")}</small></td>
                <td>${authorizationStatusBadge(auth)}</td>
                <td><button class="mini-button" ${valid && hasNutritionDataScope(auth) ? "" : "disabled"} onclick="showSection('bmi-analysis-section')">查看營養資料</button></td>
            </tr>`;
    }).join("") || emptyRow(5));
}

function renderCaseNutritionData() {
    const auths = getAuthorizationsByRole("nutritionist").filter(isAuthorizationValid).filter(hasNutritionDataScope);
    const html = auths.map((auth) => {
        const latest = latestRecord(authPatientId(auth));
        const analysis = runAIAnalysis(authPatientId(auth));
        if (!latest) return `<div class="card empty">尚未取得個案授權資料。</div>`;
        const bpHigh = latest.systolic >= 130 || latest.diastolic >= 80;
        const bmiRisk = latest.bmi >= 27 || latest.bmi < 18.5 ? "高" : latest.bmi >= 24 || bpHigh ? "中" : "低";
        return `
            <div class="card auth-data-card">
                <h3>${escapeHTML(auth.patientName || patientName(auth))}</h3>
                <div class="auth-metric-grid">
                    ${authAllows(auth, "體重") ? authMetric("體重", `${latest.weight ?? "--"}`, "kg") : ""}
                    ${authAllows(auth, "BMI") ? authMetric("BMI", `${latest.bmi ?? "--"}`, bmiCategory(latest.bmi)) : ""}
                    ${authAllows(auth, "血壓") ? authMetric("血壓", `${latest.systolic}/${latest.diastolic}`, bpHigh ? "偏高" : "正常") : ""}
                    ${authMetric("營養風險", bmiRisk, "依 BMI 與血壓")}
                </div>
                <div class="advice-item"><strong>AI 飲食建議</strong><p>${escapeHTML(analysis.dietAdvice)}</p></div>
            </div>`;
    }).join("") || `<div class="card empty">尚未取得個案授權資料。</div>`;
    setHTML("bmi-analysis-panel", html);
    setHTML("diet-advice-panel", html);
    setHTML("blood-pressure-panel", html);
}

// ─── Auth helpers ─────────────────────────────────────────────────────

function isAuthorizationValid(auth) {
    if (!auth || auth.status !== "有效") return false;
    const exp = auth.expiredAt || auth.expiresAt;
    if (!exp || exp === "永久授權") return true;
    return new Date(exp.replace(" ", "T")).getTime() >= Date.now();
}

function getAuthorizationsByRole(role) {
    return state.authorizations
        .filter((a) => a.targetRole === role)
        .map(normalizeAuthorization)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function updateCoachDashboard() {
    const auths = getAuthorizationsByRole("coach");
    const valid = auths.filter(isAuthorizationValid).filter(hasCoachDataScope);
    const ids = unique(valid.map(authPatientId));
    const records = ids.map((id) => latestRecord(id)).filter(Boolean);
    const activeToday = records.filter((r) => Number(r.steps) >= 6000).length;
    const abnormal = records.filter((r) => Number(r.heartRate) > 100).length;
    const avg = ids.length ? Math.round(ids.reduce((s, id) => s + Math.min(100, (runAIAnalysis(id).weeklyExercise / 150) * 100), 0) / ids.length) : 0;
    setHTML("coach-dashboard-cards", [
        kpi("被授權學員數", unique(auths.map(authPatientId)).length, "人"),
        kpi("有效授權數", valid.length, "筆"),
        kpi("今日活躍學員", activeToday, "人"),
        kpi("心率異常提醒", abnormal, "筆"),
        kpi("平均運動達成率", `${avg}%`, "每週 150 分鐘")
    ].join(""));
    setHTML("coach-trend-summary", `<p>${valid.length ? `目前 ${valid.length} 筆有效授權，平均達成率 ${avg}%。` : "尚未取得學員授權資料。"}</p>`);
    setHTML("coach-ai-summary", `<p>${valid.length ? "建議優先追蹤心率偏高或運動達成率不足的學員。" : "取得運動紀錄、心率或步數授權後，將顯示 AI 訓練建議。"}</p>`);
}

function updateNutritionDashboard() {
    const auths = getAuthorizationsByRole("nutritionist");
    const valid = auths.filter(isAuthorizationValid).filter(hasNutritionDataScope);
    const ids = unique(valid.map(authPatientId));
    const records = ids.map((id) => latestRecord(id)).filter(Boolean);
    const bmiAbnormal = records.filter((r) => r.bmi >= 24 || r.bmi < 18.5).length;
    const bpHigh = records.filter((r) => r.systolic >= 130 || r.diastolic >= 80).length;
    setHTML("nutrition-dashboard-cards", [
        kpi("被授權個案數", unique(auths.map(authPatientId)).length, "人"),
        kpi("有效授權數", valid.length, "筆"),
        kpi("BMI 異常個案", bmiAbnormal, "人"),
        kpi("血壓偏高個案", bpHigh, "人"),
        kpi("AI 飲食建議數", valid.length, "則")
    ].join(""));
    setHTML("nutrition-risk-summary", `<p>${valid.length ? `${ids.length} 位有效個案中，${bmiAbnormal} 位 BMI 異常，${bpHigh} 位血壓偏高。` : "尚未取得個案授權資料。"}</p>`);
    setHTML("nutrition-ai-summary", `<p>${valid.length ? "建議針對 BMI 異常或血壓偏高個案，降低鈉攝取並追蹤體重與 BMI 變化。" : "取得 BMI、體重或血壓授權後，將顯示 AI 飲食建議。"}</p>`);
}

function addTrainingRecord(event) {
    event.preventDefault();
    state.trainingRecords.unshift({ id: uid("TR"), coachId: currentAccount()?.id || "DEMO-COACH", studentName: valueOf("training-student"), title: valueOf("training-title"), content: valueOf("training-content"), createdAt: nowText() });
    saveState(); event.target.reset(); showToast("訓練紀錄已新增"); renderAll();
}

function addNutritionRecord(event) {
    event.preventDefault();
    state.nutritionRecords.unshift({ id: uid("NR"), nutritionistId: currentAccount()?.id || "DEMO-NUTRITION", caseName: valueOf("nutrition-case"), title: valueOf("nutrition-title"), content: valueOf("nutrition-content"), createdAt: nowText() });
    saveState(); event.target.reset(); showToast("營養紀錄已新增"); renderAll();
}

function updateRegistrationStatus(id, status) {
    const item = state.registrations.find((r) => r.id === id);
    if (!item) return;
    item.status = status;
    item.reviewComment = status === "審核通過" ? "資料完整，審核通過。" : status === "需補件" ? "請補充作品 Demo 或 FHIR 說明。" : "未符合本次徵件條件。";
    addNotification(item.accountId, "報名審核狀態更新", `${item.id}：${status}`);
    saveState(); showToast("審核狀態已更新"); renderAll();
}

function toggleAccount(id) {
    const account = state.accounts.find((a) => a.id === id);
    if (!account) return;
    const nextStatus = account.status === "active" ? "disabled" : "active";
    const actionLabel = nextStatus === "disabled" ? "停用" : "啟用";
    if (!confirm(`確定要${actionLabel}帳號「${account.name}」？`)) return;
    account.status = nextStatus;
    saveState(); showToast("帳號狀態已更新"); renderAll();
}

async function resetDemoData() {
    if (!confirm("確定要重置 Demo 資料與登入狀態？")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    await initDefaultAccounts();
    saveState();
    showToast("Demo 資料已重置");
    window.location.href = "index.html";
}

// ─── FHIR ─────────────────────────────────────────────────────────────

function observation(display, code, value, unit, date, accountId) {
    return { resourceType: "Observation", status: "final", code: { coding: [{ system: "http://loinc.org", code, display }] }, subject: { reference: `Patient/${accountId}` }, effectiveDateTime: date, valueQuantity: { value, unit } };
}

function bloodPressureObservation(systolic, diastolic, date, accountId) {
    return {
        resourceType: "Observation",
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood Pressure" }] },
        subject: { reference: `Patient/${accountId}` },
        effectiveDateTime: date,
        component: [
            { code: { coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic Blood Pressure" }] }, valueQuantity: { value: systolic, unit: "mmHg" } },
            { code: { coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic Blood Pressure" }] }, valueQuantity: { value: diastolic, unit: "mmHg" } }
        ]
    };
}

// ─── AI Analysis ──────────────────────────────────────────────────────

// ─── Canvas Charts (health-trend) ─────────────────────────────────────

function setTrendRange(range) {
    trendRange = range;
    document.querySelectorAll(".range-button").forEach((btn) => btn.classList.toggle("active", String(btn.dataset.range) === String(range)));
    renderCharts();
}

function renderCharts() {
    const records = filteredTrendRecords();
    renderTrendSummary(records);
    drawLineChart("bp-chart", records, [
        { label: "收縮壓", value: (r) => r.systolic, unit: "mmHg", color: "#dc2626", status: bloodPressureStatus },
        { label: "舒張壓", value: (r) => r.diastolic, unit: "mmHg", color: "#2563eb", status: bloodPressureStatus }
    ]);
    drawLineChart("weight-chart", records, [
        { label: "體重", value: (r) => r.weight, unit: "kg", color: "#0f766e", status: () => "趨勢追蹤" },
        { label: "BMI", value: (r) => r.bmi, unit: "kg/m2", color: "#f59e0b", status: bmiCategory }
    ]);
    drawRangeChart("heart-chart", records);
    drawBarChart("steps-chart", records, { label: "步數", value: (r) => r.steps, unit: "steps", color: "#2563eb", status: stepsStatus });
    drawLineChart("exercise-chart", records, [
        { label: "運動時間", value: (r) => r.exercise, unit: "分鐘", color: "#16a34a", status: exerciseStatus },
        { label: "熱量消耗", value: (r) => estimateCalories(r), unit: "kcal", color: "#db2777", status: () => "估算" }
    ]);
    const allRecords = recordsByAccount(activeUserId());
    drawLineChart("student-heart-chart", allRecords, [{ label: "心率", value: (r) => r.heartRate, unit: "bpm", color: "#db2777", status: heartRateStatus }]);
    drawLineChart("nutrition-weight-chart", allRecords, [{ label: "體重", value: (r) => r.weight, unit: "kg", color: "#0f766e", status: () => "趨勢追蹤" }]);
}

function drawLineChart(canvasId, records, seriesConfig) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.clientWidth || 640;
    const height = canvas.height = Number(canvas.getAttribute("height")) || 220;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    if (!records.length) { ctx.fillStyle = "#64748b"; ctx.fillText("尚無資料", 24, 32); return; }
    const padding = 32;
    const values = seriesConfig.flatMap((s) => records.map(s.value));
    const min = Math.min(...values) * 0.95;
    const max = Math.max(...values) * 1.05;
    ctx.strokeStyle = "#dbe4ee";
    for (let i = 0; i < 4; i++) {
        const y = padding + ((height - padding * 2) / 3) * i;
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
    }
    chartPoints[canvasId] = [];
    seriesConfig.forEach((series) => {
        ctx.strokeStyle = series.color; ctx.lineWidth = 3; ctx.beginPath();
        records.forEach((r, i) => {
            const x = padding + ((width - padding * 2) / Math.max(1, records.length - 1)) * i;
            const value = series.value(r);
            const y = height - padding - ((value - min) / Math.max(1, max - min)) * (height - padding * 2);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            chartPoints[canvasId].push({ x, y, date: r.date, label: series.label, value, unit: series.unit, status: series.status(value, r) });
        });
        ctx.stroke();
        records.forEach((r, i) => {
            const x = padding + ((width - padding * 2) / Math.max(1, records.length - 1)) * i;
            const value = series.value(r);
            const y = height - padding - ((value - min) / Math.max(1, max - min)) * (height - padding * 2);
            ctx.fillStyle = series.color; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        });
    });
    attachChartTooltip(canvas);
}

function drawBarChart(canvasId, records, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.clientWidth || 640;
    const height = canvas.height = Number(canvas.getAttribute("height")) || 220;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
    if (!records.length) { ctx.fillStyle = "#64748b"; ctx.fillText("尚無資料", 24, 32); return; }
    const padding = 32;
    const max = Math.max(...records.map(config.value)) * 1.1;
    const barWidth = Math.max(12, (width - padding * 2) / records.length * 0.58);
    chartPoints[canvasId] = [];
    records.forEach((r, i) => {
        const value = config.value(r);
        const x = padding + ((width - padding * 2) / records.length) * i + barWidth * 0.35;
        const barHeight = ((height - padding * 2) * value) / Math.max(1, max);
        const y = height - padding - barHeight;
        ctx.fillStyle = config.color; ctx.fillRect(x, y, barWidth, barHeight);
        chartPoints[canvasId].push({ x: x + barWidth / 2, y, date: r.date, label: config.label, value, unit: config.unit, status: config.status(value, r) });
    });
    attachChartTooltip(canvas);
}

function drawRangeChart(canvasId, records) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    drawLineChart(canvasId, records, [{ label: "心率", value: (r) => r.heartRate, unit: "bpm", color: "#db2777", status: heartRateStatus }]);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(22,163,74,0.1)";
    ctx.fillRect(32, 72, canvas.width - 64, 78);
    ctx.fillStyle = "#166534"; ctx.fillText("建議區間 60–100 bpm", 42, 92);
}

function renderTrendSummary(records) {
    const avg = (getter) => records.length ? records.reduce((s, r) => s + Number(getter(r) || 0), 0) / records.length : 0;
    const total = records.reduce((s, r) => s + Number(r.exercise || 0), 0);
    setHTML("trend-summary-cards", [
        kpi("平均收縮壓", records.length ? avg((r) => r.systolic).toFixed(1) : "--", "mmHg"),
        kpi("平均舒張壓", records.length ? avg((r) => r.diastolic).toFixed(1) : "--", "mmHg"),
        kpi("平均心率", records.length ? avg((r) => r.heartRate).toFixed(1) : "--", "bpm"),
        kpi("平均 BMI", records.length ? avg((r) => r.bmi).toFixed(1) : "--", "kg/m2"),
        kpi("平均步數", records.length ? Math.round(avg((r) => r.steps)).toLocaleString() : "--", "steps"),
        kpi("總運動時間", total, "分鐘")
    ].join(""));
    const highBp = records.filter((r) => r.systolic >= 130 || r.diastolic >= 80).length;
    setText("trend-data-hint", records.length < 3 ? "目前資料較少，建議新增更多健康紀錄以獲得更準確趨勢。" : "");
    setHTML("trend-ai-summary", `<h3>AI 趨勢摘要</h3><p>近 ${records.length} 筆資料中，血壓有 ${highBp} 次偏高，平均 BMI 為 ${records.length ? avg((r) => r.bmi).toFixed(1) : "--"}，總運動 ${total} 分鐘，建議維持每週 150 分鐘。</p>`);
}

function filteredTrendRecords() {
    const records = recordsByAccount(activeUserId());
    if (trendRange === "all") return records;
    if (!records.length) return records;
    const anchor = new Date(records[records.length - 1].date);
    const cutoff = new Date(anchor);
    cutoff.setDate(anchor.getDate() - Number(trendRange) + 1);
    return records.filter((r) => new Date(r.date) >= cutoff);
}

function attachChartTooltip(canvas) {
    canvas.onmousemove = (e) => {
        const points = chartPoints[canvas.id] || [];
        if (!points.length) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const nearest = points.reduce((best, p) => { const d = Math.hypot(p.x - x, p.y - y); return !best || d < best.distance ? { ...p, distance: d } : best; }, null);
        if (!nearest || nearest.distance > 32) { hideChartTooltip(); return; }
        showChartTooltip(e.clientX, e.clientY, nearest);
    };
    canvas.onmouseleave = hideChartTooltip;
}

function showChartTooltip(cx, cy, point) {
    const tooltip = document.getElementById("chart-tooltip");
    if (!tooltip) return;
    tooltip.innerHTML = `<strong>${escapeHTML(point.label)}</strong><br>日期：${escapeHTML(point.date)}<br>數值：${escapeHTML(point.value)} ${escapeHTML(point.unit)}<br>狀態：${escapeHTML(point.status)}`;
    tooltip.style.left = `${cx + 12}px`; tooltip.style.top = `${cy + 12}px`;
    tooltip.classList.add("show");
}

function hideChartTooltip() { document.getElementById("chart-tooltip")?.classList.remove("show"); }

// ─── Status helpers ───────────────────────────────────────────────────

function bloodPressureStatus(value, record) {
    const s = record?.systolic ?? value, d = record?.diastolic ?? value;
    return s >= 130 || d >= 80 ? "偏高" : "正常";
}
function heartRateStatus(v) { return v < 60 ? "偏低" : v > 100 ? "偏高" : "正常"; }
function stepsStatus(v) { return v >= 10000 ? "達標" : v >= 6000 ? "普通" : "偏少"; }
function exerciseStatus(v) { return v >= 30 ? "達標" : "偏少"; }
function estimateCalories(r) { return Math.round(Number(r.exercise || 0) * 6.5); }

// ─── Data helpers ─────────────────────────────────────────────────────

function recordsByAccount(accountId) { return state.healthRecords.filter((r) => r.accountId === accountId).sort((a, b) => a.date.localeCompare(b.date)); }
function latestRecord(accountId = activeUserId()) { const r = recordsByAccount(accountId); return r[r.length - 1] || null; }
function activeUserId() { const a = currentAccount(); return a?.role === "user" ? a.id : "ACC-USER-DEMO"; }
function authorizedUsers(targetRole) { return state.accounts.filter((a) => unique(getAuthorizationsByRole(targetRole).filter(isAuthorizationValid).map(authPatientId)).includes(a.id)); }

function normalizeAuthorization(auth) {
    const patientId = auth.patientId || auth.userId || "ACC-USER-DEMO";
    return { ...auth, patientId, patientName: auth.patientName || patientName({ patientId }), dataScopes: Array.isArray(auth.dataScopes) ? auth.dataScopes : legacyScopes(auth.scope), duration: auth.duration || durationFromExpiredAt(auth.expiredAt || auth.expiresAt), status: auth.status || "有效", hash: auth.hash || auth.authHash || auth.token || "--", expiredAt: auth.expiredAt || auth.expiresAt || "永久授權" };
}

function legacyScopes(scope) {
    if (scope === "exercise") return ["運動紀錄", "心率", "步數"];
    if (scope === "nutrition") return ["BMI", "體重", "血壓"];
    if (scope === "summary") return ["血壓", "體重", "BMI", "心率", "步數"];
    return scope ? [scope] : [];
}

function durationFromExpiredAt(exp) { return (!exp || exp === "永久授權") ? "永久授權" : "自訂期限"; }
function authPatientId(auth) { return auth.patientId || auth.userId || "ACC-USER-DEMO"; }
function patientName(auth) { return state.accounts.find((a) => a.id === authPatientId(auth))?.name || auth.patientName || "王小明"; }
function authAllows(auth, scope) { return Array.isArray(auth.dataScopes) && auth.dataScopes.includes(scope); }
function hasCoachDataScope(auth) { return ["運動紀錄", "心率", "步數"].some((s) => authAllows(auth, s)); }
function hasNutritionDataScope(auth) { return ["體重", "BMI", "血壓"].some((s) => authAllows(auth, s)); }

// ─── Authorization ─────────────────────────────────────────────────────

function authorizationExpiredAt(duration) {
    if (duration === "永久授權") return "永久授權";
    const d = new Date();
    if (duration === "24小時") d.setHours(d.getHours() + 24);
    if (duration === "7天") d.setDate(d.getDate() + 7);
    if (duration === "30天") d.setDate(d.getDate() + 30);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function drawQRCode(token) {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const size = 180;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
    if (typeof qrcode !== "function") {
        ctx.fillStyle = "#64748b";
        ctx.font = "13px sans-serif";
        ctx.fillText("QR 產生器載入失敗", 10, size / 2);
        return;
    }
    const qr = qrcode(0, "M");
    qr.addData(token);
    qr.make();
    const count = qr.getModuleCount();
    const cell = size / count;
    for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
            ctx.fillStyle = qr.isDark(row, col) ? "#0f172a" : "#ffffff";
            ctx.fillRect(Math.floor(col * cell), Math.floor(row * cell), Math.ceil(cell), Math.ceil(cell));
        }
    }
}

// ─── Utility ──────────────────────────────────────────────────────────

function unique(items) { return Array.from(new Set(items.filter(Boolean))); }
function getUserHeight() {
    return state.patient.height || 175;
}
function calculateBMI(weight, heightCm = getUserHeight()) {
    const heightM = heightCm / 100;
    return Number((weight / (heightM * heightM)).toFixed(1));
}
function isValidHeight(height) {
    return Number.isFinite(Number(height)) && Number(height) >= 80 && Number(height) <= 230;
}
function bmiCategory(bmi) { return bmi < 18.5 ? "過輕" : bmi < 24 ? "正常" : bmi < 27 ? "過重" : "肥胖"; }
function copyFHIR() { const t = document.getElementById("fhir-json-output")?.textContent || ""; if (navigator.clipboard) navigator.clipboard.writeText(t); showToast("FHIR JSON 已複製"); }
function downloadFHIR() {
    const t = document.getElementById("fhir-json-output")?.textContent || "";
    downloadTextAsFile(t, `fhir-bundle-${nowText().replace(/[: ]/g, "-")}.json`);
    showToast("FHIR JSON 已下載");
}

function downloadFHIRForAccount(accountId) {
    const json = JSON.stringify(generateFHIRBundle(accountId), null, 2);
    downloadTextAsFile(json, `fhir-bundle-${accountId}-${nowText().replace(/[: ]/g, "-")}.json`);
    showToast("FHIR JSON 已下載");
}

function downloadTextAsFile(text, filename) {
    const blob = new Blob([text], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
function addBlockchainLog(source, event, token) { state.blockchainLogs.unshift({ id: uid("BC"), hash: `0x${hashText(`${source}-${event}-${token}`).toUpperCase()}`, source, event, createdAt: nowText() }); }
function addNotification(accountId, title, message) { state.notifications.unshift({ id: uid("NT"), accountId, title, message, createdAt: nowText(), isRead: false }); }
function nextAccountId() { const d = new Date(), ymd = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`; return `ACC-${ymd}-${String(state.accounts.filter((a) => a.id.includes(`ACC-${ymd}`)).length + 1).padStart(3, "0")}`; }
function nextRegistrationId() { const d = new Date(), ymd = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`; return `REG-${ymd}-${String(state.registrations.filter((r) => r.id.includes(`REG-${ymd}`)).length + 1).padStart(3, "0")}`; }
function nextAuthorizationId() { const d = new Date(), ymd = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`; return `AUTH-${ymd}-${String(state.authorizations.filter((a) => String(a.id).includes(`AUTH-${ymd}`)).length + 1).padStart(3, "0")}`; }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`; }

function showFieldError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("field-invalid");
    const group = el.closest(".form-group") || el.parentElement;
    let hint = group?.querySelector(".field-error");
    if (!hint && group) {
        hint = document.createElement("small");
        hint.className = "field-error";
        group.appendChild(hint);
    }
    if (hint) hint.textContent = message;
}

function clearFieldErrors(form) {
    if (!form) return;
    form.querySelectorAll(".field-invalid").forEach((el) => el.classList.remove("field-invalid"));
    form.querySelectorAll(".field-error").forEach((el) => el.remove());
}
function nowText() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function pad(v) { return String(v).padStart(2, "0"); }
function hashText(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); } return (h >>> 0).toString(16).padStart(8, "0") + Math.random().toString(16).slice(2, 8); }
function valueOf(id) { return document.getElementById(id)?.value.trim() || ""; }
function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = value ?? "";
}
function escapeHTML(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function kpi(title, value, caption) { return `<div class="kpi-card"><div class="kpi-card-icon">${escapeHTML(kpiIcon(title))}</div><span>${escapeHTML(title)}</span><strong>${escapeHTML(String(value))}</strong><small>${escapeHTML(caption || "")}</small></div>`; }
function kpiIcon(t) { if (t.includes("血壓")) return "BP"; if (t.includes("心率")) return "HR"; if (t.includes("體重")) return "KG"; if (t.includes("BMI")) return "BMI"; if (t.includes("步數")) return "步"; if (t.includes("運動")) return "動"; if (t.includes("學員")) return "員"; if (t.includes("個案")) return "案"; if (t.includes("FHIR")) return "{}"; if (t.includes("授權")) return "QR"; if (t.includes("區塊鏈")) return "BC"; if (t.includes("報名")) return "報"; if (t.includes("通知")) return "訊"; return t.slice(0, 1); }
function statusPill(label, className) { const cls = className || ({ "待審核": "pending", "審核通過": "approved", "需補件": "revision", "退件": "rejected" }[label] || "pending"); return `<span class="status ${cls}">${escapeHTML(label)}</span>`; }
function emptyRow(cols) { return `<tr><td colspan="${cols}" class="empty">目前沒有資料</td></tr>`; }
function notificationList(limit) { const a = currentAccount(); return state.notifications.filter((i) => i.accountId === "all" || i.accountId === a?.id).slice(0, limit).map((i) => `<p><strong>${escapeHTML(i.title)}</strong><br><span class="muted">${escapeHTML(i.message)}</span></p>`).join("") || `<p class="muted">目前沒有通知。</p>`; }
function scopeBadges(scopes) { return (scopes || []).map((s) => `<span class="scope-badge">${escapeHTML(s)}</span>`).join("") || `<span class="muted">未指定</span>`; }
function authorizationStatusBadge(auth) { const v = isAuthorizationValid(auth); return `<span class="auth-badge ${v ? "valid" : "expired"}">${v ? "有效" : "已過期"}</span>`; }
function authMetric(label, value, unit) { return `<div class="auth-metric"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><small>${escapeHTML(unit || "")}</small></div>`; }

let _toastTimer;
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function switchAuthTab(tab) {
    document.getElementById("login-panel")?.classList.toggle("hidden", tab !== "login");
    document.getElementById("register-panel")?.classList.toggle("hidden", tab !== "register");
    document.querySelectorAll(".auth-tabs button").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
}

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-user-wrap")) document.getElementById("nav-user-wrap")?.classList.remove("open");
    if (!e.target.closest(".nav-dropdown-wrap") && !e.target.closest("#nav-toggle")) {
        document.querySelectorAll(".nav-dropdown-wrap.open").forEach((w) => w.classList.remove("open"));
    }
});

window.addEventListener("resize", () => {
    document.querySelectorAll(".nav-dropdown-wrap.open").forEach((w) => positionNavDropdown(w));
});

window.addEventListener("load", initCustomSelects);

// Service workers require http(s); silently skip under file:// (the documented
// "open index.html directly" workflow) — this only activates once the app is
// actually served over a network.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => console.log("Service Worker registered"))
            .catch(err => console.error("Service Worker registration failed:", err));
    });
}

if (!window.__aiHealthNetworkStatusToast) {
    window.__aiHealthNetworkStatusToast = true;
    window.addEventListener("offline", () => {
        showToast("目前為離線模式，仍可查看已快取資料。");
    });
    window.addEventListener("online", () => {
        showToast("網路已恢復。");
    });
}

// Window exports
window.loginAccount = loginAccount;
window.registerAccount = registerAccount;
window.demoLogin = demoLogin;
window.logoutAccount = logoutAccount;
window.requireAuth = requireAuth;
window.showSection = showSection;
window.navigateTo = navigateTo;
window.setTrendRange = setTrendRange;
window.initCustomSelects = initCustomSelects;
window.submitProfileSettings = submitProfileSettings;
window.submitHealthData = submitHealthData;
window.submitRegistration = submitRegistration;
window.generateQRCode = generateQRCode;
window.createAuthorization = createAuthorization;
window.addTrainingRecord = addTrainingRecord;
window.addNutritionRecord = addNutritionRecord;
window.updateRegistrationStatus = updateRegistrationStatus;
window.showRegistrationDetail = showRegistrationDetail;
window.closeRegistrationModal = closeRegistrationModal;
window.copyRegistrationGithub = copyRegistrationGithub;
window.editRegistration = editRegistration;
window.toggleAccount = toggleAccount;
window.copyFHIR = copyFHIR;
window.resetDemoData = resetDemoData;
window.showToast = showToast;
window.toggleNavMenu = toggleNavMenu;
window.toggleDropdown = toggleDropdown;
window.toggleUserMenu = toggleUserMenu;
window.switchAuthTab = switchAuthTab;
window.initDefaultAccounts = initDefaultAccounts;
window.saveState = saveState;
window.loadState = loadState;

// Health data, record list, FHIR sync, and AI analysis enhancement.
// Kept at the end to override the older demo implementations without changing other modules.
function ensureHealthStore() {
    if (!Array.isArray(state.healthRecords)) state.healthRecords = [];
    if (!Array.isArray(state.history)) state.history = state.healthRecords;
    if (state.history !== state.healthRecords) {
        const merged = [...state.healthRecords, ...state.history];
        const byId = new Map();
        merged.forEach((record) => byId.set(record.id || `${record.accountId}-${record.date}-${record.createdAt || ""}`, record));
        state.healthRecords = Array.from(byId.values());
        state.history = state.healthRecords;
    }
    state.healthRecords.forEach(normalizeHealthRecord);
}

function normalizeHealthRecord(record) {
    if (!record) return record;
    record.exercise = Number(record.exercise ?? record.exerciseDuration ?? 0);
    record.exerciseDuration = record.exercise;
    record.exerciseType = record.exerciseType || "未紀錄";
    record.calories = Number(record.calories ?? estimateCalories(record) ?? 0);
    record.sleep = Number(record.sleep ?? record.sleepHours ?? 7);
    record.sleepHours = record.sleep;
    record.water = Number(record.water ?? record.waterMl ?? 2000);
    record.waterMl = record.water;
    record.stress = Number(record.stress ?? 3);
    record.diet = record.diet || "正常";
    record.height = Number(record.height || getUserHeight());
    record.weight = Number(record.weight || 0);
    record.bmi = Number(calculateBMI(record.weight, record.height));
    return record;
}

function ensureHealthFeatureUI() {
    const section = document.getElementById("health-input-section");
    if (!section || section.dataset.healthEnhanced === "true") return;
    section.dataset.healthEnhanced = "true";
    section.innerHTML = `
        <h2 class="section-title">健康資料</h2>
        <div class="card form-card health-form-section">
            <form id="health-data-form" onsubmit="submitHealthData(event)">
                <h3 class="health-section-title">基本量測</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-date">測量日期</label><input id="health-date" type="date" required /></div>
                    <div class="form-group"><label for="health-height">身高 cm</label><input id="health-height" type="number" min="80" max="230" step="0.1" required oninput="updateBMIPreview()" /></div>
                    <div class="form-group"><label for="health-weight">體重 kg</label><input id="health-weight" type="number" min="20" max="250" step="0.1" required oninput="updateBMIPreview()" /></div>
                    <div class="bmi-preview-card"><span>BMI 自動計算</span><strong id="health-bmi-preview">--</strong><small id="health-bmi-category">輸入身高與體重後顯示</small></div>
                </div>
                <h3 class="health-section-title">血壓與心率</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-systolic">收縮壓 systolic</label><input id="health-systolic" type="number" min="70" max="220" required /></div>
                    <div class="form-group"><label for="health-diastolic">舒張壓 diastolic</label><input id="health-diastolic" type="number" min="40" max="140" required /></div>
                    <div class="form-group"><label for="health-heart-rate">靜息心率 bpm</label><input id="health-heart-rate" type="number" min="40" max="180" required /></div>
                </div>
                <h3 class="health-section-title">運動資料</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-steps">今日步數</label><input id="health-steps" type="number" min="0" max="100000" required /></div>
                    <div class="form-group"><label for="health-exercise-type">運動類型</label><select id="health-exercise-type"><option>未紀錄</option><option>步行</option><option>跑步</option><option>重量訓練</option><option>游泳</option><option>瑜伽</option><option>自行車</option><option>其他</option></select></div>
                    <div class="form-group"><label for="health-exercise">運動時間 min</label><input id="health-exercise" type="number" min="0" max="600" required /></div>
                    <div class="form-group"><label for="health-calories">消耗熱量 kcal</label><input id="health-calories" type="number" min="0" max="5000" /></div>
                </div>
                <h3 class="health-section-title">生活習慣</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-sleep">睡眠時數</label><input id="health-sleep" type="number" min="0" max="24" step="0.5" required /></div>
                    <div class="form-group"><label for="health-water">飲水量 ml</label><input id="health-water" type="number" min="0" max="10000" step="50" /></div>
                    <div class="form-group"><label for="health-stress">壓力程度 1-5</label><input id="health-stress" type="number" min="1" max="5" required /></div>
                    <div class="form-group"><label for="health-diet">飲食狀態</label><select id="health-diet" required><option>正常</option><option>高油</option><option>高鹽</option><option>高糖</option><option>蔬果不足</option></select></div>
                </div>
                <div class="form-actions"><button type="submit" class="primary-button">儲存健康資料</button></div>
            </form>
        </div>
        <section id="health-record-list" class="card">
            <h3 class="health-section-title">最近健康資料</h3>
            <div class="health-record-table-wrapper">
                <table class="health-record-table">
                    <thead><tr><th>日期</th><th>血壓</th><th>體重</th><th>BMI</th><th>心率</th><th>步數</th><th>運動時間</th><th>睡眠</th><th>狀態</th><th>操作</th></tr></thead>
                    <tbody id="health-record-table-body"></tbody>
                </table>
            </div>
        </section>`;
    const today = new Date();
    setInputValue("health-date", `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    syncHealthHeightInput(true);
    updateBMIPreview();
}

function updateBMIPreview() {
    const bmi = calculateBMI(Number(valueOf("health-weight")), Number(valueOf("health-height")));
    setText("health-bmi-preview", Number.isFinite(Number(bmi)) ? bmi : "--");
    setText("health-bmi-category", Number.isFinite(Number(bmi)) ? bmiCategory(Number(bmi)) : "輸入身高與體重後顯示");
}

function validateHealthForm() {
    const checks = [
        ["health-height", 80, 230, "身高需介於 80-230 cm"],
        ["health-weight", 20, 250, "體重需介於 20-250 kg"],
        ["health-systolic", 70, 220, "收縮壓需介於 70-220"],
        ["health-diastolic", 40, 140, "舒張壓需介於 40-140"],
        ["health-heart-rate", 40, 180, "心率需介於 40-180"],
        ["health-sleep", 0, 24, "睡眠需介於 0-24 小時"],
        ["health-stress", 1, 5, "壓力程度需介於 1-5"]
    ];
    checks.forEach(([id]) => {
        const el = document.getElementById(id);
        el?.classList.remove("field-invalid");
        el?.closest(".form-group")?.querySelector(".field-error")?.remove();
    });
    let firstInvalidId = null;
    for (const [id, min, max, message] of checks) {
        const value = Number(valueOf(id));
        if (!Number.isFinite(value) || value < min || value > max) {
            showFieldError(id, message);
            if (!firstInvalidId) firstInvalidId = id;
        }
    }
    if (firstInvalidId) {
        showToast("請修正下方標示的欄位");
        document.getElementById(firstInvalidId)?.focus();
        return false;
    }
    return true;
}

function renderHealthRecords() {
    ensureHealthStore();
    const rows = recordsByAccount(activeUserId()).slice(-10).reverse().map((record) => {
        const analysis = analyzeRecord(record, recordsByAccount(activeUserId()));
        const statusClass = analysis.riskLevel === "高風險" ? "disabled" : analysis.riskLevel === "中風險" ? "pending" : "active";
        return `
            <tr>
                <td>${escapeHTML(record.date)}</td>
                <td>${escapeHTML(record.systolic)}/${escapeHTML(record.diastolic)}</td>
                <td>${escapeHTML(record.weight)} kg</td>
                <td>${escapeHTML(record.bmi)}</td>
                <td>${escapeHTML(record.heartRate)} bpm</td>
                <td>${Number(record.steps || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.exercise)} min</td>
                <td>${escapeHTML(record.sleep)} h</td>
                <td>${statusPill(analysis.riskLevel, statusClass)}</td>
                <td class="record-actions"><button type="button" class="mini-button" onclick="showHealthRecordDetail('${record.id}')">查看詳情</button><button type="button" class="mini-button danger-mini" onclick="deleteHealthRecord('${record.id}')">刪除紀錄</button></td>
            </tr>`;
    }).join("");
    setHTML("health-record-table-body", rows || `<tr><td colspan="10" class="empty">尚無健康資料</td></tr>`);
}

function showHealthRecordDetail(id) {
    ensureHealthStore();
    const record = state.healthRecords.find((item) => item.id === id);
    if (!record) return;
    let modal = document.getElementById("health-record-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "health-record-modal";
        modal.className = "registration-modal";
        modal.innerHTML = `<div class="registration-modal-panel health-detail-modal"><div class="registration-modal-header"><div><span>Health Record</span><h3>健康資料詳情</h3></div><button type="button" class="modal-close-button" onclick="closeHealthRecordModal()">x</button></div><div id="health-record-modal-body" class="registration-modal-body"></div></div>`;
        document.body.appendChild(modal);
    }
    setHTML("health-record-modal-body", `
        <div class="ai-trend-grid">
            ${healthDetailItem("日期", record.date)}
            ${healthDetailItem("身高", `${record.height} cm`)}
            ${healthDetailItem("體重", `${record.weight} kg`)}
            ${healthDetailItem("BMI", `${record.bmi} ${bmiCategory(record.bmi)}`)}
            ${healthDetailItem("血壓", `${record.systolic}/${record.diastolic} mmHg`)}
            ${healthDetailItem("心率", `${record.heartRate} bpm`)}
            ${healthDetailItem("步數", Number(record.steps || 0).toLocaleString())}
            ${healthDetailItem("運動", `${record.exerciseType} ${record.exercise} min`)}
            ${healthDetailItem("熱量", `${record.calories} kcal`)}
            ${healthDetailItem("睡眠", `${record.sleep} 小時`)}
            ${healthDetailItem("飲水", `${record.water} ml`)}
            ${healthDetailItem("壓力/飲食", `${record.stress} / ${record.diet}`)}
        </div>`);
    modal.classList.add("show");
}

function healthDetailItem(label, value) {
    return `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`;
}

function closeHealthRecordModal() {
    document.getElementById("health-record-modal")?.classList.remove("show");
}

function deleteHealthRecord(id) {
    if (!confirm("確定刪除此筆健康資料？")) return;
    ensureHealthStore();
    state.healthRecords = state.healthRecords.filter((record) => record.id !== id);
    state.history = state.healthRecords;
    saveState();
    showToast("健康資料已刪除");
    renderAll();
}

function adviceCard(title, content) {
    return `<article class="ai-advice-card"><h3>${escapeHTML(title)}</h3><p>${escapeHTML(content)}</p></article>`;
}

function refreshNavigationUI() {
    if (typeof updateSidebar === "function") updateSidebar();
    else if (typeof updateNavbar === "function") updateNavbar();
}

function analyzeRecord(record, records) {
    const recent = records.slice(-7);
    let score = 100;
    const riskTags = [];
    const bmi = Number(record.bmi);
    const weeklyExercise = recent.reduce((sum, item) => sum + Number(item.exercise || 0), 0);
    if (bmi < 18.5) { score -= 10; riskTags.push("體重過輕"); }
    else if (bmi >= 24 && bmi <= 27) { score -= 10; riskTags.push("BMI 過高"); }
    else if (bmi > 27) { score -= 10; riskTags.push("肥胖"); }
    if (record.systolic >= 140 || record.diastolic >= 90) { score -= 25; riskTags.push("高風險血壓"); }
    else if (record.systolic >= 130 || record.diastolic >= 80) { score -= 15; riskTags.push("血壓偏高"); }
    if (record.heartRate > 100) { score -= 10; riskTags.push("心率偏高"); }
    if (record.heartRate < 50) { score -= 10; riskTags.push("心率偏低"); }
    if (weeklyExercise < 150) { score -= 10; riskTags.push("運動不足"); }
    if (record.steps < 6000) { score -= 5; riskTags.push("活動量不足"); }
    if (record.sleep < 6) { score -= 10; riskTags.push("睡眠不足"); }
    if (record.sleep > 9) { score -= 10; riskTags.push("睡眠過長"); }
    if (record.stress >= 4) { score -= 10; riskTags.push("壓力偏高"); }
    if (record.diet && record.diet !== "正常") { score -= 5; riskTags.push(`飲食${record.diet}`); }
    score = Math.max(0, Math.min(100, score));
    return { score, riskLevel: score >= 80 ? "低風險" : score >= 60 ? "中風險" : "高風險", riskTags: Array.from(new Set(riskTags)) };
}

function buildDietAdvice(record, tags) {
    if (record.diet === "高鹽") return "目前飲食偏高鹽，會增加血壓風險，建議減少加工食品、醬料與重口味餐點。";
    if (record.diet === "高糖") return "目前飲食偏高糖，會增加代謝風險，建議減少含糖飲料與精緻甜點。";
    if (record.diet === "高油") return "目前飲食偏高油，會增加體重與心血管風險，建議改用蒸煮烤並控制油炸食物。";
    if (record.diet === "蔬果不足") return "蔬果攝取不足，建議增加膳食纖維，讓每餐至少有一份蔬菜。";
    if (tags.some((tag) => tag.includes("BMI") || tag === "肥胖")) return "BMI 偏高，建議控制總熱量並增加蛋白質與高纖食物比例。";
    return "飲食狀態正常，建議持續均衡攝取全穀、蛋白質、蔬果與足量水分。";
}

function calculateTrendStats(records) {
    if (!records.length) return emptyTrendStats();
    const avg = (getter) => records.reduce((sum, item) => sum + Number(getter(item) || 0), 0) / records.length;
    const abnormalCount = records.filter((record) => analyzeRecord(record, records).riskTags.length > 0).length;
    return {
        averageBloodPressure: `${avg((r) => r.systolic).toFixed(1)}/${avg((r) => r.diastolic).toFixed(1)} mmHg`,
        averageBMI: avg((r) => r.bmi).toFixed(1),
        averageHeartRate: avg((r) => r.heartRate).toFixed(1),
        averageSteps: Math.round(avg((r) => r.steps)).toLocaleString(),
        totalExerciseMinutes: records.reduce((sum, item) => sum + Number(item.exercise || 0), 0),
        averageSleep: avg((r) => r.sleep).toFixed(1),
        abnormalCount
    };
}

function emptyTrendStats() {
    return { averageBloodPressure: "--", averageBMI: "--", averageHeartRate: "--", averageSteps: "--", totalExerciseMinutes: 0, averageSleep: "--", abnormalCount: 0 };
}

function generateFHIRBundle(accountId = activeUserId()) {
    ensureHealthStore();
    const account = state.accounts.find((item) => item.id === accountId) || state.accounts.find((item) => item.role === "user");
    const latest = latestRecord(account?.id);
    if (!account || !latest) return { resourceType: "Bundle", type: "collection", entry: [] };
    const observations = [
        observation("Body Height", "8302-2", latest.height || getUserHeight(), "cm", latest.date, account.id),
        observation("Body Weight", "29463-7", latest.weight, "kg", latest.date, account.id),
        observation("BMI", "39156-5", latest.bmi, "kg/m2", latest.date, account.id),
        bloodPressureObservation(latest.systolic, latest.diastolic, latest.date, account.id),
        observation("Heart Rate", "8867-4", latest.heartRate, "beats/min", latest.date, account.id),
        observation("Steps", "41950-7", latest.steps, "steps", latest.date, account.id),
        observation("Exercise Duration", "55411-3", latest.exercise, "min", latest.date, account.id),
        observation("Sleep Duration", "93832-4", latest.sleep, "h", latest.date, account.id)
    ];
    return {
        resourceType: "Bundle",
        type: "collection",
        timestamp: new Date().toISOString(),
        entry: [
            { resource: { resourceType: "Patient", id: account.id, name: [{ text: account.name }], telecom: [{ system: "email", value: account.email }, { system: "phone", value: account.phone }], managingOrganization: { display: account.organization } } },
            { resource: { resourceType: "Practitioner", id: "practitioner-demo-001", name: [{ text: "AI Health Platform" }] } },
            ...observations.map((resource) => ({ resource }))
        ]
    };
}

function renderDashboard() {
    renderUserDashboard();
}

function saveState() {
    ensureHealthStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

window.calculateBMI = calculateBMI;
window.validateHealthForm = validateHealthForm;
window.submitHealthData = submitHealthData;
window.renderHealthRecords = renderHealthRecords;
window.deleteHealthRecord = deleteHealthRecord;
window.showHealthRecordDetail = showHealthRecordDetail;
window.closeHealthRecordModal = closeHealthRecordModal;
window.runAIAnalysis = runAIAnalysis;
window.renderAIAnalysis = renderAIAnalysis;
window.renderDashboard = renderDashboard;
window.generateFHIRBundle = generateFHIRBundle;
window.saveState = saveState;
window.renderAll = renderAll;
window.updateBMIPreview = updateBMIPreview;

// Stable AI analysis renderer. This fixes pages where the AI panel existed but
// the expected target ids were missing, leaving advice text invisible.
function ensureAIAnalysisMarkup() {
    const panel = document.getElementById("ai-health-panel");
    if (!panel) return false;
    if (document.getElementById("ai-score-value")) return true;
    panel.innerHTML = `
        <div class="ai-analysis-layout">
            <div class="ai-score-card">
                <span>AI 健康分數</span>
                <strong id="ai-score-value">--</strong>
                <small id="ai-risk-level">目前尚無資料</small>
            </div>
            <div class="ai-trend-summary">
                <h3>AI 趨勢摘要</h3>
                <p id="ai-summary">目前尚無健康資料，請先新增健康紀錄以產生 AI 分析。</p>
                <div id="ai-trend-summary" class="ai-trend-grid"></div>
            </div>
        </div>
        <div id="ai-risk-tags" class="ai-risk-chip-list"></div>
        <div class="ai-advice-grid">
            <article class="ai-advice-card"><h3>飲食建議</h3><p id="ai-diet-advice">--</p></article>
            <article class="ai-advice-card"><h3>運動建議</h3><p id="ai-exercise-advice">--</p></article>
            <article class="ai-advice-card"><h3>睡眠建議</h3><p id="ai-sleep-advice">--</p></article>
            <article class="ai-advice-card"><h3>就醫提醒</h3><p id="ai-medical-advice">--</p></article>
            <article class="ai-advice-card"><h3>生活習慣建議</h3><p id="ai-lifestyle-advice">--</p></article>
        </div>`;
    return true;
}

function runAIAnalysis(accountId = activeUserId()) {
    ensureHealthStore();
    const records = recordsByAccount(accountId).map(normalizeHealthRecord);
    const latest = records[records.length - 1];
    const recent = records.slice(-7);
    if (!latest) {
        const message = "目前尚無健康資料，請先新增健康紀錄以產生 AI 分析。";
        return {
            score: "--",
            riskLevel: "尚無資料",
            riskTags: [],
            summary: message,
            dietAdvice: message,
            exerciseAdvice: message,
            sleepAdvice: message,
            medicalAdvice: message,
            lifestyleAdvice: message,
            trendStats: {
                summary: message,
                averageBloodPressure: "--",
                averageBMI: "--",
                averageHeartRate: "--",
                averageSteps: "--",
                totalExerciseMinutes: 0,
                averageSleep: "--",
                abnormalCount: 0
            },
            healthAdvice: message,
            weeklyExercise: 0
        };
    }

    const weeklyExercise = recent.reduce((sum, item) => sum + Number(item.exercise || 0), 0);
    let score = 100;
    const riskTags = [];
    const bmi = Number(latest.bmi);
    const addRisk = (tag, points) => {
        score -= points;
        riskTags.push(tag);
    };

    if (bmi < 18.5) addRisk("體重過輕", 10);
    else if (bmi >= 24 && bmi <= 27) addRisk("BMI 過高", 10);
    else if (bmi > 27) addRisk("肥胖", 10);

    if (latest.systolic >= 140 || latest.diastolic >= 90) addRisk("高風險血壓", 25);
    else if (latest.systolic >= 130 || latest.diastolic >= 80) addRisk("血壓偏高", 15);

    if (latest.heartRate > 100) addRisk("心率偏高", 10);
    if (latest.heartRate < 50) addRisk("心率偏低", 10);
    if (weeklyExercise < 150) addRisk("運動不足", 10);
    if (latest.steps < 6000) addRisk("活動量不足", 5);
    if (latest.sleep < 6) addRisk("睡眠不足", 10);
    if (latest.sleep > 9) addRisk("睡眠過長", 10);
    if (latest.stress >= 4) addRisk("壓力偏高", 10);
    if (latest.diet && latest.diet !== "正常") addRisk(`飲食${latest.diet}`, 5);

    score = Math.max(0, Math.min(100, score));
    const riskLevel = score >= 80 ? "低風險" : score >= 60 ? "中風險" : "高風險";
    const avg = (getter) => recent.reduce((sum, item) => sum + Number(getter(item) || 0), 0) / recent.length;
    const abnormalCount = recent.filter((record) => {
        const rbmi = Number(record.bmi);
        return rbmi < 18.5 || rbmi >= 24 || record.systolic >= 130 || record.diastolic >= 80 || record.heartRate > 100 || record.heartRate < 50 || record.steps < 6000 || record.sleep < 6 || record.sleep > 9 || record.stress >= 4 || (record.diet && record.diet !== "正常");
    }).length;
    const trendStats = {
        averageBloodPressure: `${avg((r) => r.systolic).toFixed(1)}/${avg((r) => r.diastolic).toFixed(1)} mmHg`,
        averageBMI: avg((r) => r.bmi).toFixed(1),
        averageHeartRate: avg((r) => r.heartRate).toFixed(1),
        averageSteps: Math.round(avg((r) => r.steps)).toLocaleString(),
        totalExerciseMinutes: weeklyExercise,
        averageSleep: avg((r) => r.sleep).toFixed(1),
        abnormalCount,
        summary: ""
    };
    trendStats.summary = `最近 ${recent.length} 筆資料：平均血壓 ${trendStats.averageBloodPressure}、平均 BMI ${trendStats.averageBMI}、平均心率 ${trendStats.averageHeartRate} bpm、平均步數 ${trendStats.averageSteps}、總運動時間 ${trendStats.totalExerciseMinutes} 分鐘、睡眠平均 ${trendStats.averageSleep} 小時、異常次數 ${trendStats.abnormalCount} 次。`;

    const dietAdvice = (() => {
        if (latest.diet === "高鹽") return "飲食偏高鹽，建議減少加工食品、醬料與重口味餐點，以降低血壓風險。";
        if (latest.diet === "高糖") return "飲食偏高糖，建議減少含糖飲料與精緻甜點，降低代謝風險。";
        if (latest.diet === "高油") return "飲食偏高油，建議減少油炸食物並改用蒸、煮、烤等方式。";
        if (latest.diet === "蔬果不足") return "蔬果不足，建議每餐加入一份蔬菜並增加高纖食物。";
        if (bmi >= 24) return "BMI 偏高，建議控制總熱量並增加蛋白質與膳食纖維。";
        return "飲食狀態目前尚可，建議維持均衡飲食與足量飲水。";
    })();

    return {
        score,
        riskLevel,
        riskTags: Array.from(new Set(riskTags)),
        summary: trendStats.summary,
        dietAdvice,
        exerciseAdvice: weeklyExercise < 150 || latest.steps < 6000 ? "運動量不足，建議每週累積至少 150 分鐘中等強度運動，並逐步提高每日步數。" : "運動量達標，建議維持目前頻率並加入肌力訓練。",
        sleepAdvice: latest.sleep < 6 ? "睡眠不足，建議固定就寢時間並減少睡前螢幕刺激。" : latest.sleep > 9 ? "睡眠偏長，若仍感疲倦可觀察作息或諮詢專業人員。" : "睡眠時數在合理範圍，建議維持規律作息。",
        medicalAdvice: latest.systolic >= 140 || latest.diastolic >= 90 ? "血壓達高風險範圍，建議儘快諮詢醫療專業人員並持續量測。" : riskLevel === "高風險" ? "目前有多項異常指標，若不適或數值持續異常，建議就醫評估。" : "目前未達立即就醫警示，建議持續追蹤血壓、心率與體重。",
        lifestyleAdvice: latest.stress >= 4 ? "壓力偏高，建議安排放鬆練習、規律運動與短暫休息。" : "生活習慣整體尚可，建議維持飲水、活動量與規律睡眠。",
        trendStats,
        healthAdvice: trendStats.summary,
        weeklyExercise
    };
}

function renderAIAnalysis() {
    if (!ensureAIAnalysisMarkup()) return;
    const analysis = runAIAnalysis();
    document.getElementById("ai-score-value").textContent = analysis.score;
    document.getElementById("ai-risk-level").textContent = analysis.riskLevel;
    document.getElementById("ai-summary").textContent = analysis.summary;
    document.getElementById("ai-diet-advice").textContent = analysis.dietAdvice;
    document.getElementById("ai-exercise-advice").textContent = analysis.exerciseAdvice;
    document.getElementById("ai-sleep-advice").textContent = analysis.sleepAdvice;
    document.getElementById("ai-medical-advice").textContent = analysis.medicalAdvice;
    document.getElementById("ai-lifestyle-advice").textContent = analysis.lifestyleAdvice;
    document.getElementById("ai-risk-tags").innerHTML = analysis.riskTags.map((tag) => {
        return `<span class="ai-risk-chip">${escapeHTML(tag)}</span>`;
    }).join("") || `<span class="ai-risk-chip">${analysis.riskLevel === "尚無資料" ? "尚無資料" : "目前無明顯風險"}</span>`;
    document.getElementById("ai-trend-summary").textContent = analysis.trendStats.summary;
}

function renderAI() {
    renderAIAnalysis();
}

function renderAIHealth() {
    renderAIAnalysis();
}

function submitHealthData(event) {
    event.preventDefault();
    ensureHealthStore();
    if (!validateHealthForm()) return;
    const height = Number(valueOf("health-height"));
    const weight = Number(valueOf("health-weight"));
    const exercise = Number(valueOf("health-exercise") || 0);
    const record = normalizeHealthRecord({
        id: uid("HR"),
        accountId: activeUserId(),
        date: valueOf("health-date"),
        height,
        weight,
        bmi: calculateBMI(weight, height),
        systolic: Number(valueOf("health-systolic")),
        diastolic: Number(valueOf("health-diastolic")),
        heartRate: Number(valueOf("health-heart-rate")),
        steps: Number(valueOf("health-steps") || 0),
        exercise,
        exerciseDuration: exercise,
        exerciseType: valueOf("health-exercise-type") || "未紀錄",
        calories: Number(valueOf("health-calories") || Math.round(exercise * 6.5)),
        sleep: Number(valueOf("health-sleep")),
        water: Number(valueOf("health-water") || 0),
        stress: Number(valueOf("health-stress")),
        diet: valueOf("health-diet") || "正常",
        createdAt: nowText()
    });
    state.healthRecords.push(record);
    state.history = state.healthRecords;
    if (height !== getUserHeight()) {
        state.patient.height = height;
        state.patient.heightUpdatedAt = nowText();
    }
    addNotification(activeUserId(), "健康資料已新增", `BMI ${record.bmi}，AI 健康建議已更新。`);
    saveState();
    renderDashboard();
    renderAIAnalysis();
    renderHealthRecords();
    renderAll();
    showToast("健康資料已成功儲存，AI 分析已更新");
    event.target.reset();
    setInputValue("health-date", record.date);
    syncHealthHeightInput(true);
    updateBMIPreview();
}

function renderAll() {
    ensureHealthStore();
    ensureProfileUI();
    ensureHealthFeatureUI();
    initCustomSelects();
    initNavAccessibility();
    refreshNavigationUI();
    updateDarkModeButton();
    if (typeof updateUserDisplay === "function") updateUserDisplay();
    renderHomeStats();
    renderProfileSection();
    renderUserDashboard();
    renderCoachDashboard();
    renderNutritionDashboard();
    renderAdminDashboard();
    renderFHIRViewer();
    renderAIAnalysis();
    renderHealthRecords();
    renderTables();
    renderCoachViews();
    renderNutritionViews();
    renderAdminViews();
    renderRegistrations();
    renderNotifications();
    renderCharts();
    renderAdminCharts();
    renderCoachCharts();
    renderNutritionCharts();
    renderUserDashboardCharts();
    updateBMIPreview();
}

window.runAIAnalysis = runAIAnalysis;
window.renderAIAnalysis = renderAIAnalysis;
window.renderAI = renderAI;
window.renderAIHealth = renderAIHealth;
window.submitHealthData = submitHealthData;
window.renderAll = renderAll;

// Final scoped upgrade: health data summary modal, AI dashboard, and health report.
const HEALTH_UPGRADE_ICONS = { diet: "🍽", exercise: "🏃", sleep: "🌙", water: "💧", medical: "⚕", bmi: "BMI", bp: "BP", heart: "HR", steps: "👣" };

function normalizeHealthRecord(record) {
    if (!record) return record;
    record.exercise = Number(record.exercise ?? record.exerciseDuration ?? 0);
    record.exerciseDuration = record.exercise;
    record.exerciseType = record.exerciseType || "慢跑";
    record.calories = Number(record.calories ?? estimateCalories(record) ?? 0);
    record.sleep = Number(record.sleep ?? record.sleepHours ?? 7);
    record.sleepHours = record.sleep;
    record.water = Number(record.water ?? record.waterMl ?? 2000);
    record.waterMl = record.water;
    record.stress = Number(record.stress ?? 3);
    record.diet = record.diet || "正常";
    record.height = Number(record.height || getUserHeight());
    record.weight = Number(record.weight || 0);
    record.bmi = Number(calculateBMI(record.weight, record.height));
    return record;
}

function healthStatus(value, normal, warning) {
    const number = Number(value);
    if (!Number.isFinite(number)) return { label: "--", className: "muted" };
    if (normal(number)) return { label: "正常", className: "good" };
    if (warning && warning(number)) return { label: "注意", className: "warning" };
    return { label: "異常", className: "danger" };
}

function bloodPressureStatus(record) {
    if (!record) return { label: "--", className: "muted" };
    if (record.systolic < 120 && record.diastolic < 80) return { label: "正常", className: "good" };
    if (record.systolic < 140 && record.diastolic < 90) return { label: "注意", className: "warning" };
    return { label: "偏高", className: "danger" };
}

function aiLevelFromScore(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) return { label: "No Data", className: "muted" };
    if (value >= 85) return { label: "Excellent", className: "good" };
    if (value >= 70) return { label: "Good", className: "primary" };
    if (value >= 55) return { label: "Warning", className: "warning" };
    return { label: "Danger", className: "danger" };
}

function ensureHealthFeatureUI() {
    const section = document.getElementById("health-input-section");
    if (!section || section.dataset.healthUpgradeFinal === "true") return;
    section.dataset.healthUpgradeFinal = "true";
    section.innerHTML = `
        <div class="ai-gradient-header"><div><span>Health Data</span><h2>健康資料</h2><p>填寫今日量測、活動與生活習慣，送出後產生健康摘要、AI 分析、FHIR 與趨勢資料。</p></div></div>
        <div class="card form-card health-form-section">
            <form id="health-data-form" onsubmit="submitHealthData(event)">
                <h3 class="health-section-title">基本量測</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-date">日期</label><input id="health-date" type="date" required /></div>
                    <div class="form-group"><label for="health-height">身高 cm</label><input id="health-height" type="number" min="80" max="230" step="0.1" required oninput="updateBMIPreview()" /></div>
                    <div class="form-group"><label for="health-weight">體重 kg</label><input id="health-weight" type="number" min="20" max="250" step="0.1" required oninput="updateBMIPreview()" /></div>
                    <div class="bmi-preview-card"><span>BMI 自動計算</span><strong id="health-bmi-preview">--</strong><small id="health-bmi-category">輸入身高與體重後顯示</small></div>
                </div>
                <h3 class="health-section-title">血壓與心率</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-systolic">收縮壓 systolic</label><input id="health-systolic" type="number" min="70" max="220" required /></div>
                    <div class="form-group"><label for="health-diastolic">舒張壓 diastolic</label><input id="health-diastolic" type="number" min="40" max="140" required /></div>
                    <div class="form-group"><label for="health-heart-rate">心率 bpm</label><input id="health-heart-rate" type="number" min="40" max="180" required /></div>
                </div>
                <h3 class="health-section-title">運動資料</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-steps">今日步數</label><input id="health-steps" type="number" min="0" max="100000" required /></div>
                    <div class="form-group"><label for="health-exercise-type">運動類型</label><select id="health-exercise-type"><option>慢跑</option><option>快走</option><option>重訓</option><option>游泳</option><option>騎車</option><option>瑜珈</option><option>球類</option><option>休息</option></select></div>
                    <div class="form-group"><label for="health-exercise">運動時間 min</label><input id="health-exercise" type="number" min="0" max="600" required /></div>
                    <div class="form-group"><label for="health-calories">消耗熱量 kcal</label><input id="health-calories" type="number" min="0" max="5000" /></div>
                </div>
                <h3 class="health-section-title">生活習慣</h3>
                <div class="health-form-grid">
                    <div class="form-group"><label for="health-sleep">睡眠小時</label><input id="health-sleep" type="number" min="0" max="24" step="0.5" required /></div>
                    <div class="form-group"><label for="health-water">飲水 ml</label><input id="health-water" type="number" min="0" max="10000" step="50" /></div>
                    <div class="form-group"><label for="health-stress">壓力 1-5</label><input id="health-stress" type="number" min="1" max="5" required /></div>
                    <div class="form-group"><label for="health-diet">飲食狀態</label><select id="health-diet" required><option>正常</option><option>高鹽飲食</option><option>高糖飲食</option><option>高油飲食</option><option>蛋白質不足</option></select></div>
                </div>
                <div class="form-actions"><button type="submit" class="primary-button">儲存健康資料</button></div>
            </form>
        </div>
        <section id="health-record-list" class="card">
            <h3 class="health-section-title">最近健康資料</h3>
            <div class="health-record-table-wrapper"><table class="health-record-table"><thead><tr><th>日期</th><th>血壓</th><th>體重</th><th>BMI</th><th>心率</th><th>步數</th><th>運動</th><th>睡眠</th><th>狀態</th><th>操作</th></tr></thead><tbody id="health-record-table-body"></tbody></table></div>
        </section>`;
    const today = new Date();
    setInputValue("health-date", `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    syncHealthHeightInput(true);
    updateBMIPreview();
}

function ensureHealthReportSection() {
    const pageContent = document.querySelector(".page-content");
    if (!pageContent || document.getElementById("health-report-section")) return;
    SECTION_LABELS["health-report-section"] = "健康風險報告";
    const section = document.createElement("section");
    section.id = "health-report-section";
    section.className = "content-section";
    section.innerHTML = `<div class="ai-gradient-header"><div><span>Health Report</span><h2>健康風險報告</h2><p>整合個人資料、健康摘要、AI分析、FHIR摘要、最近健康紀錄、健康趨勢、風險分析與授權紀錄。</p></div><button type="button" class="secondary-button print-hide" onclick="downloadHealthReport()">下載健康報告</button></div><div id="health-report-panel"></div>`;
    pageContent.insertBefore(section, document.getElementById("fhir-viewer-section") || pageContent.lastElementChild);
}

function ensureHealthReportNav() {
    const navMenu = document.getElementById("nav-menu");
    if (!navMenu || navMenu.querySelector('[data-section="health-report-section"]')) return;
    const aiDropdown = Array.from(navMenu.querySelectorAll(".nav-dropdown")).find((node) => node.querySelector('[data-section="ai-health-section"]'));
    const button = document.createElement("button");
    button.className = "nav-dropdown-item";
    button.dataset.section = "health-report-section";
    button.type = "button";
    button.textContent = "健康風險報告";
    button.onclick = () => showSection("health-report-section");
    if (aiDropdown) aiDropdown.insertBefore(button, aiDropdown.querySelector('[data-section="fhir-viewer-section"]'));
    else navMenu.appendChild(button);
}

function ensureAIAnalysisMarkup() {
    const panel = document.getElementById("ai-health-panel");
    if (!panel) return false;
    panel.innerHTML = `
        <div class="ai-dashboard">
            <div class="ai-gradient-header"><div><span>AI Health Dashboard</span><h2>AI 健康分析</h2><p id="ai-summary">目前尚無健康資料，請先新增健康紀錄以產生 AI 分析。</p></div><span id="ai-risk-level" class="ai-status-badge muted">No Data</span></div>
            <div class="ai-dashboard-grid"><article class="ai-score-card"><div class="ai-gauge" style="--score:0"><div class="ai-gauge-inner"><strong id="ai-score-value">--</strong><span>/100</span></div></div><small>AI 健康分數</small></article><article class="ai-risk-card"><h3>風險標籤</h3><div id="ai-risk-tags" class="ai-risk-chip-list"></div></article></div>
            <div id="ai-kpi-grid" class="ai-kpi-grid"></div>
            <div class="ai-advice-grid">
                <article class="ai-advice-card"><span class="ai-card-icon">${HEALTH_UPGRADE_ICONS.diet}</span><h3>飲食</h3><p id="ai-diet-advice">--</p></article>
                <article class="ai-advice-card"><span class="ai-card-icon">${HEALTH_UPGRADE_ICONS.exercise}</span><h3>運動</h3><p id="ai-exercise-advice">--</p></article>
                <article class="ai-advice-card"><span class="ai-card-icon">${HEALTH_UPGRADE_ICONS.sleep}</span><h3>睡眠</h3><p id="ai-sleep-advice">--</p></article>
                <article class="ai-advice-card"><span class="ai-card-icon">${HEALTH_UPGRADE_ICONS.water}</span><h3>飲水</h3><p id="ai-water-advice">--</p></article>
                <article class="ai-advice-card"><span class="ai-card-icon">${HEALTH_UPGRADE_ICONS.medical}</span><h3>醫療提醒</h3><p id="ai-medical-advice">--</p></article>
            </div>
            <div class="ai-dashboard-grid bottom"><article class="ai-risk-card"><h3>健康風險分析</h3><div class="radar-wrap"><canvas id="ai-risk-radar" width="420" height="320"></canvas></div></article><article class="ai-trend-summary"><h3>AI 趨勢摘要</h3><div id="ai-trend-summary" class="ai-trend-grid"></div></article></div>
            <article class="ai-timeline-card"><h3>健康建議時間軸</h3><div id="ai-timeline" class="ai-timeline"></div></article>
        </div>`;
    return true;
}

function runAIAnalysis(accountId = activeUserId()) {
    ensureHealthStore();
    const records = recordsByAccount(accountId).map(normalizeHealthRecord);
    const latest = records[records.length - 1];
    const recent = records.slice(-7);
    if (!latest) {
        const message = "目前尚無健康資料，請先新增健康紀錄以產生 AI 分析。";
        return { score: "--", riskLevel: "No Data", riskTags: [], summary: message, dietAdvice: message, exerciseAdvice: message, sleepAdvice: message, waterAdvice: message, medicalAdvice: message, lifestyleAdvice: message, weeklyExercise: 0, trendStats: emptyTrendStats(), kpis: [], radar: [0, 0, 0, 0, 0, 0], timeline: [] };
    }
    const weeklyExercise = recent.reduce((sum, item) => sum + Number(item.exercise || 0), 0);
    let score = 100;
    const riskTags = [];
    const addRisk = (tag, points) => { score -= points; riskTags.push(tag); };
    const bmi = Number(latest.bmi);
    if (bmi < 18.5) addRisk("體重過輕", 10);
    else if (bmi >= 24 && bmi < 27) addRisk("BMI偏高", 10);
    else if (bmi >= 27) addRisk("肥胖風險", 15);
    if (latest.systolic >= 140 || latest.diastolic >= 90) addRisk("高血壓風險", 25);
    else if (latest.systolic >= 130 || latest.diastolic >= 80) addRisk("血壓偏高", 15);
    if (latest.heartRate > 100) addRisk("心率偏高", 10);
    if (latest.heartRate < 50) addRisk("心率偏低", 10);
    if (weeklyExercise < 150) addRisk("運動不足", 10);
    if (latest.steps < 6000) addRisk("活動量不足", 5);
    if (latest.sleep < 6) addRisk("睡眠不足", 10);
    if (latest.sleep > 9) addRisk("睡眠過長", 5);
    if (latest.stress >= 4) addRisk("壓力偏高", 10);
    if (latest.diet && latest.diet !== "正常") addRisk(latest.diet, 5);
    score = Math.max(0, Math.min(100, score));
    const trendStats = calculateTrendStats(recent);
    const extraExercise = Math.max(0, 150 - weeklyExercise);
    const summary = `近7天平均BMI為${trendStats.averageBMI}。血壓${latest.systolic < 120 && latest.diastolic < 80 ? "維持正常" : "需要持續觀察"}。本週運動時間${weeklyExercise}分鐘，${extraExercise ? `建議再增加${Math.min(30, extraExercise)}分鐘有氧運動。` : "已達每週150分鐘建議量。"}`;
    const bmiStatus = healthStatus(bmi, (v) => v >= 18.5 && v < 24, (v) => v >= 24 && v < 27);
    const bpStatus = bloodPressureStatus(latest);
    const heartStatus = healthStatus(latest.heartRate, (v) => v >= 60 && v <= 100, (v) => v >= 50 && v <= 110);
    const stepsStatus = healthStatus(latest.steps, (v) => v >= 8000, (v) => v >= 6000);
    const sleepStatus = healthStatus(latest.sleep, (v) => v >= 7 && v <= 9, (v) => v >= 6 && v <= 10);
    const exerciseStatus = healthStatus(weeklyExercise, (v) => v >= 150, (v) => v >= 90);
    return {
        score,
        riskLevel: aiLevelFromScore(score).label,
        riskTags: Array.from(new Set(riskTags)),
        summary,
        dietAdvice: bmi >= 24 || latest.diet !== "正常" ? "建議提高蔬菜、蛋白質與全穀比例，減少高鹽、高糖與高油食物。" : "飲食狀態良好，維持均衡餐盤與足量蛋白質。",
        exerciseAdvice: weeklyExercise < 150 || latest.steps < 8000 ? "本週運動量仍可提升，建議安排快走、慢跑或阻力訓練，逐步累積到每週150分鐘。" : "運動量表現良好，建議保留有氧與肌力訓練的組合。",
        sleepAdvice: latest.sleep < 7 ? "睡眠略不足，建議固定上床時間，晚上23點前準備入睡。" : "睡眠時數穩定，建議維持規律作息與睡前減少螢幕使用。",
        waterAdvice: latest.water < 2000 ? "今日飲水量偏低，建議再補充500ml水並分次飲用。" : "飲水量足夠，維持分段補水即可。",
        medicalAdvice: latest.systolic >= 140 || latest.diastolic >= 90 ? "血壓已達高風險門檻，建議諮詢醫療專業人員並持續量測。" : "目前未達立即就醫警示，仍建議定期追蹤血壓、心率與體重。",
        lifestyleAdvice: latest.stress >= 4 ? "壓力偏高，建議加入呼吸練習、伸展或短時間散步。" : "生活習慣整體穩定，持續追蹤可提升 AI 趨勢判讀準確度。",
        weeklyExercise,
        trendStats,
        kpis: [
            { icon: HEALTH_UPGRADE_ICONS.bmi, label: "BMI", value: latest.bmi, status: bmiStatus },
            { icon: HEALTH_UPGRADE_ICONS.bp, label: "血壓", value: `${latest.systolic}/${latest.diastolic}`, status: bpStatus },
            { icon: HEALTH_UPGRADE_ICONS.heart, label: "心率", value: `${latest.heartRate} bpm`, status: heartStatus },
            { icon: HEALTH_UPGRADE_ICONS.steps, label: "步數", value: Number(latest.steps || 0).toLocaleString(), status: stepsStatus },
            { icon: HEALTH_UPGRADE_ICONS.sleep, label: "睡眠", value: `${latest.sleep} 小時`, status: sleepStatus },
            { icon: HEALTH_UPGRADE_ICONS.exercise, label: "運動", value: `${weeklyExercise} 分鐘`, status: exerciseStatus }
        ],
        radar: buildRadarScores(latest, weeklyExercise),
        timeline: buildTimeline(latest, weeklyExercise)
    };
}

function calculateTrendStats(records) {
    if (!records.length) return emptyTrendStats();
    const avg = (getter) => records.reduce((sum, item) => sum + Number(getter(item) || 0), 0) / records.length;
    const abnormalCount = records.filter((record) => {
        const rbmi = Number(record.bmi);
        return rbmi < 18.5 || rbmi >= 24 || record.systolic >= 130 || record.diastolic >= 80 || record.heartRate > 100 || record.heartRate < 50 || record.steps < 6000 || record.sleep < 6 || record.sleep > 9 || record.stress >= 4 || (record.diet && record.diet !== "正常");
    }).length;
    const totalExerciseMinutes = records.reduce((sum, item) => sum + Number(item.exercise || 0), 0);
    return {
        averageBloodPressure: `${avg((r) => r.systolic).toFixed(1)}/${avg((r) => r.diastolic).toFixed(1)} mmHg`,
        averageBMI: avg((r) => r.bmi).toFixed(1),
        averageHeartRate: avg((r) => r.heartRate).toFixed(1),
        averageSteps: Math.round(avg((r) => r.steps)).toLocaleString(),
        totalExerciseMinutes,
        averageSleep: avg((r) => r.sleep).toFixed(1),
        abnormalCount,
        summary: `最近${records.length}筆資料：平均BMI ${avg((r) => r.bmi).toFixed(1)}、平均血壓 ${avg((r) => r.systolic).toFixed(1)}/${avg((r) => r.diastolic).toFixed(1)} mmHg、平均心率 ${avg((r) => r.heartRate).toFixed(1)} bpm、平均步數 ${Math.round(avg((r) => r.steps)).toLocaleString()}、平均睡眠 ${avg((r) => r.sleep).toFixed(1)} 小時、運動總時間 ${totalExerciseMinutes} 分鐘、異常次數 ${abnormalCount} 次。`
    };
}

function emptyTrendStats() {
    return { averageBloodPressure: "--", averageBMI: "--", averageHeartRate: "--", averageSteps: "--", totalExerciseMinutes: 0, averageSleep: "--", abnormalCount: 0, summary: "目前尚無健康資料。" };
}

function buildRadarScores(record, weeklyExercise) {
    return [
        Math.max(0, 100 - Math.abs(Number(record.bmi) - 22) * 12),
        Math.max(0, 100 - Math.max(0, record.systolic - 120) * 1.6 - Math.max(0, record.diastolic - 80) * 2),
        Math.max(0, 100 - Math.abs(record.heartRate - 72) * 1.5),
        Math.min(100, (weeklyExercise / 150) * 100),
        Math.max(0, 100 - Math.abs(record.sleep - 7.5) * 18),
        Math.max(0, 120 - Number(record.stress || 3) * 20)
    ].map((v) => Math.round(Math.max(0, Math.min(100, v))));
}

function buildTimeline(record, weeklyExercise) {
    return [
        { time: "今天", text: record.water < 2000 ? "多喝500ml水" : "維持分段補水" },
        { time: "今天", text: record.sleep < 7 ? "晚上23點前睡覺" : "維持固定睡眠時間" },
        { time: "明天", text: record.steps < 8000 ? "快走30分鐘" : "安排伸展與核心訓練" },
        { time: "本週", text: weeklyExercise < 150 ? "每週至少150分鐘運動" : "保留每週150分鐘運動習慣" }
    ];
}

function renderAIAnalysis() {
    if (!ensureAIAnalysisMarkup()) return;
    const analysis = runAIAnalysis();
    const level = aiLevelFromScore(analysis.score);
    const score = Number(analysis.score) || 0;
    document.querySelector(".ai-gauge")?.style.setProperty("--score", score);
    setText("ai-score-value", analysis.score);
    const levelNode = document.getElementById("ai-risk-level");
    if (levelNode) {
        levelNode.textContent = level.label;
        levelNode.className = `ai-status-badge ${level.className}`;
    }
    setText("ai-summary", analysis.summary);
    setText("ai-diet-advice", analysis.dietAdvice);
    setText("ai-exercise-advice", analysis.exerciseAdvice);
    setText("ai-sleep-advice", analysis.sleepAdvice);
    setText("ai-water-advice", analysis.waterAdvice);
    setText("ai-medical-advice", analysis.medicalAdvice);
    setHTML("ai-risk-tags", analysis.riskTags.map((tag) => `<span class="ai-chip">${escapeHTML(tag)}</span>`).join("") || `<span class="ai-chip good">目前無明顯風險</span>`);
    setHTML("ai-kpi-grid", analysis.kpis.map((item) => aiKpiCard(item)).join(""));
    setHTML("ai-trend-summary", [
        healthDetailItem("平均BMI", analysis.trendStats.averageBMI),
        healthDetailItem("平均血壓", analysis.trendStats.averageBloodPressure),
        healthDetailItem("平均心率", `${analysis.trendStats.averageHeartRate} bpm`),
        healthDetailItem("平均步數", analysis.trendStats.averageSteps),
        healthDetailItem("平均睡眠", `${analysis.trendStats.averageSleep} 小時`),
        healthDetailItem("運動總時間", `${analysis.trendStats.totalExerciseMinutes} 分鐘`),
        healthDetailItem("異常次數", `${analysis.trendStats.abnormalCount} 次`)
    ].join(""));
    setHTML("ai-timeline", analysis.timeline.map((item) => `<div class="ai-timeline-item"><span>${escapeHTML(item.time)}</span><p>✔ ${escapeHTML(item.text)}</p></div>`).join(""));
    drawRadarChart("ai-risk-radar", ["BMI", "Blood Pressure", "Heart Rate", "Exercise", "Sleep", "Stress"], analysis.radar);
    renderHealthReport();
}

function aiKpiCard(item) {
    return `<article class="ai-kpi-card"><span class="ai-card-icon">${escapeHTML(item.icon)}</span><div><small>${escapeHTML(item.label)}</small><strong>${escapeHTML(item.value)}</strong></div><em class="ai-status-badge ${item.status.className}">${escapeHTML(item.status.label)}</em></article>`;
}

function drawRadarChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width || canvas.width);
    const height = Math.max(280, rect.height || canvas.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2, cy = height / 2, radius = Math.min(width, height) * 0.34, points = labels.length;
    for (let ring = 1; ring <= 5; ring += 1) {
        ctx.beginPath();
        for (let i = 0; i < points; i += 1) {
            const a = -Math.PI / 2 + (Math.PI * 2 * i) / points;
            const r = radius * ring / 5;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(37,99,235,.16)";
        ctx.stroke();
    }
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    labels.forEach((label, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / points;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius); ctx.strokeStyle = "rgba(15,118,110,.14)"; ctx.stroke();
        ctx.fillStyle = "#475569"; ctx.fillText(label, cx + Math.cos(a) * (radius + 42), cy + Math.sin(a) * (radius + 28));
    });
    ctx.beginPath();
    values.forEach((value, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / points;
        const r = radius * (Number(value) / 100);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(37,99,235,.18)";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
}

function submitHealthData(event) {
    event.preventDefault();
    ensureHealthStore();
    if (!validateHealthForm()) return;
    const height = Number(valueOf("health-height"));
    const weight = Number(valueOf("health-weight"));
    const exercise = Number(valueOf("health-exercise") || 0);
    const record = normalizeHealthRecord({
        id: uid("HR"),
        accountId: activeUserId(),
        date: valueOf("health-date"),
        height,
        weight,
        bmi: calculateBMI(weight, height),
        systolic: Number(valueOf("health-systolic")),
        diastolic: Number(valueOf("health-diastolic")),
        heartRate: Number(valueOf("health-heart-rate")),
        steps: Number(valueOf("health-steps") || 0),
        exercise,
        exerciseDuration: exercise,
        exerciseType: valueOf("health-exercise-type") || "慢跑",
        calories: Number(valueOf("health-calories") || Math.round(exercise * 6.5)),
        sleep: Number(valueOf("health-sleep")),
        water: Number(valueOf("health-water") || 0),
        stress: Number(valueOf("health-stress")),
        diet: valueOf("health-diet") || "正常",
        createdAt: nowText()
    });
    state.healthRecords.push(record);
    state.history = state.healthRecords;
    if (height !== getUserHeight()) {
        state.patient.height = height;
        state.patient.heightUpdatedAt = nowText();
    }
    addNotification(activeUserId(), "健康資料已新增", `BMI ${record.bmi}，FHIR JSON、AI 分析與健康報告已更新。`);
    saveState();
    renderAll();
    showHealthSummaryModal(record);
    event.target.reset();
    setInputValue("health-date", record.date);
    syncHealthHeightInput(true);
    updateBMIPreview();
}

function showHealthSummaryModal(record) {
    const analysis = runAIAnalysis(activeUserId());
    let modal = document.getElementById("health-summary-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "health-summary-modal";
        modal.className = "registration-modal health-summary-modal";
        document.body.appendChild(modal);
    }
    const bp = bloodPressureStatus(record);
    const bmi = healthStatus(record.bmi, (v) => v >= 18.5 && v < 24, (v) => v >= 24 && v < 27);
    const heart = healthStatus(record.heartRate, (v) => v >= 60 && v <= 100, (v) => v >= 50 && v <= 110);
    const stepsPercent = Math.min(100, Math.round((Number(record.steps || 0) / 10000) * 100));
    modal.innerHTML = `<div class="registration-modal-panel health-summary-card"><button type="button" class="modal-close-button" onclick="closeHealthSummaryModal()">x</button><div class="summary-success">✅ 健康資料已成功儲存</div><h3>本次健康摘要</h3><div class="summary-list">${summaryRow("BMI", record.bmi, bmi.label, bmi.className)}${summaryRow("血壓", `${record.systolic} / ${record.diastolic}`, bp.label, bp.className)}${summaryRow("心率", `${record.heartRate} bpm`, heart.label, heart.className)}${summaryRow("今日步數", Number(record.steps || 0).toLocaleString(), `達成${stepsPercent}%`, stepsPercent >= 80 ? "good" : "warning")}${summaryRow("運動", record.exerciseType, `${record.exercise}分鐘`, "primary")}${summaryRow("睡眠", `${record.sleep} 小時`, "", "primary")}</div><p class="summary-ai-done">AI 已完成分析：${escapeHTML(analysis.riskLevel)}</p><div class="summary-actions"><button type="button" class="primary-button" onclick="closeHealthSummaryModal(); showSection('ai-health-section')">查看 AI 報告</button><button type="button" class="secondary-button" onclick="closeHealthSummaryModal(); showSection('fhir-viewer-section')">查看 FHIR</button></div></div>`;
    modal.classList.add("show");
}

function summaryRow(label, value, status, className) {
    return `<div class="summary-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong>${status ? `<em class="ai-status-badge ${className}">${escapeHTML(status)}</em>` : ""}</div>`;
}

function closeHealthSummaryModal() {
    document.getElementById("health-summary-modal")?.classList.remove("show");
}

function renderHealthRecords() {
    ensureHealthStore();
    const rows = recordsByAccount(activeUserId()).slice(-10).reverse().map((record) => {
        normalizeHealthRecord(record);
        const analysis = runAIAnalysis(activeUserId());
        const level = aiLevelFromScore(analysis.score);
        return `
            <tr>
                <td>${escapeHTML(record.date)}</td>
                <td>${escapeHTML(`${record.systolic}/${record.diastolic}`)}</td>
                <td>${escapeHTML(record.weight)} kg</td>
                <td>${escapeHTML(record.bmi)}</td>
                <td>${escapeHTML(record.heartRate)} bpm</td>
                <td>${Number(record.steps || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.exercise)} min</td>
                <td>${escapeHTML(record.sleep)} h</td>
                <td><span class="ai-status-badge ${level.className}">${escapeHTML(level.label)}</span></td>
                <td class="record-actions"><button type="button" class="mini-button" onclick="showHealthRecordDetail('${record.id}')">查看</button><button type="button" class="mini-button danger-mini" onclick="deleteHealthRecord('${record.id}')">刪除</button></td>
            </tr>`;
    }).join("");
    setHTML("health-record-table-body", rows || `<tr><td colspan="10" class="empty">尚無健康資料</td></tr>`);
}

function renderHealthReport() {
    ensureHealthReportSection();
    const panel = document.getElementById("health-report-panel");
    if (!panel) return;
    ensureHealthStore();
    const account = state.accounts.find((item) => item.id === activeUserId()) || {};
    const records = recordsByAccount(activeUserId()).map(normalizeHealthRecord);
    const latest = records[records.length - 1];
    const analysis = runAIAnalysis(activeUserId());
    const fhir = generateFHIRBundle(activeUserId());
    const auths = (state.authorizations || []).filter((item) => authPatientId(item) === activeUserId()).slice(-5).reverse();
    panel.innerHTML = `<div class="health-report-section">
        <article class="health-report-card">${reportTitle("個人資料")}${healthDetailItem("姓名", account.name || "--")}${healthDetailItem("Email", account.email || "--")}${healthDetailItem("身高", `${getUserHeight()} cm`)}</article>
        <article class="health-report-card">${reportTitle("健康摘要")}${latest ? `${healthDetailItem("BMI", `${latest.bmi} ${bmiCategory(latest.bmi)}`)}${healthDetailItem("血壓", `${latest.systolic}/${latest.diastolic} mmHg`)}${healthDetailItem("心率", `${latest.heartRate} bpm`)}` : "<p>尚無健康資料。</p>"}</article>
        <article class="health-report-card wide">${reportTitle("AI分析")}<p>${escapeHTML(analysis.summary)}</p><div class="ai-risk-chip-list">${analysis.riskTags.map((tag) => `<span class="ai-chip">${escapeHTML(tag)}</span>`).join("") || "<span class=\"ai-chip good\">目前無明顯風險</span>"}</div></article>
        <article class="health-report-card">${reportTitle("FHIR摘要")}${healthDetailItem("Resource Type", fhir.resourceType)}${healthDetailItem("Entries", String(fhir.entry?.length || 0))}${healthDetailItem("Timestamp", fhir.timestamp || "--")}</article>
        <article class="health-report-card wide">${reportTitle("最近健康紀錄")}<div class="health-record-table-wrapper"><table class="health-record-table"><thead><tr><th>日期</th><th>BMI</th><th>血壓</th><th>心率</th><th>步數</th><th>睡眠</th></tr></thead><tbody>${records.slice(-5).reverse().map((r) => `<tr><td>${escapeHTML(r.date)}</td><td>${escapeHTML(r.bmi)}</td><td>${escapeHTML(`${r.systolic}/${r.diastolic}`)}</td><td>${escapeHTML(r.heartRate)}</td><td>${Number(r.steps || 0).toLocaleString()}</td><td>${escapeHTML(r.sleep)}</td></tr>`).join("") || "<tr><td colspan=\"6\">尚無資料</td></tr>"}</tbody></table></div></article>
        <article class="health-report-card">${reportTitle("健康趨勢")}${healthDetailItem("平均BMI", analysis.trendStats.averageBMI)}${healthDetailItem("平均血壓", analysis.trendStats.averageBloodPressure)}${healthDetailItem("運動總時間", `${analysis.trendStats.totalExerciseMinutes} 分鐘`)}</article>
        <article class="health-report-card">${reportTitle("風險分析")}${healthDetailItem("健康等級", analysis.riskLevel)}${healthDetailItem("異常次數", `${analysis.trendStats.abnormalCount} 次`)}${healthDetailItem("AI分數", `${analysis.score}/100`)}</article>
        <article class="health-report-card wide">${reportTitle("授權紀錄")}${auths.map((a) => `<div class="report-auth-row"><strong>${escapeHTML(a.targetName || a.targetRole || "--")}</strong><span>${escapeHTML(a.status || "--")} · ${escapeHTML(a.createdAt || "--")}</span></div>`).join("") || "<p>尚無授權紀錄。</p>"}</article>
    </div>`;
}

function reportTitle(title) {
    return `<h3>${escapeHTML(title)}</h3>`;
}

function downloadHealthReport() {
    renderHealthReport();
    window.print();
}

function renderAll() {
    ensureHealthStore();
    ensureProfileUI();
    ensureHealthFeatureUI();
    ensureHealthReportSection();
    ensureHealthReportNav();
    initCustomSelects();
    initNavAccessibility();
    refreshNavigationUI();
    updateDarkModeButton();
    if (typeof updateUserDisplay === "function") updateUserDisplay();
    renderHomeStats();
    renderProfileSection();
    renderUserDashboard();
    renderCoachDashboard();
    renderNutritionDashboard();
    renderAdminDashboard();
    renderFHIRViewer();
    renderAIAnalysis();
    renderHealthRecords();
    renderHealthReport();
    renderTables();
    renderCoachViews();
    renderNutritionViews();
    renderAdminViews();
    renderRegistrations();
    renderNotifications();
    renderCharts();
    renderAdminCharts();
    renderCoachCharts();
    renderNutritionCharts();
    renderUserDashboardCharts();
    updateBMIPreview();
}

window.runAIAnalysis = runAIAnalysis;
window.renderAIAnalysis = renderAIAnalysis;
window.renderAI = renderAIAnalysis;
window.renderAIHealth = renderAIAnalysis;
window.submitHealthData = submitHealthData;
window.showHealthSummaryModal = showHealthSummaryModal;
window.closeHealthSummaryModal = closeHealthSummaryModal;
window.renderHealthRecords = renderHealthRecords;
window.renderHealthReport = renderHealthReport;
window.downloadHealthReport = downloadHealthReport;
window.renderAll = renderAll;

// Wearable device import simulation. Appended as an override block so existing
// role pages and health features keep their current behavior.
window.rolePermissions = {
    ...(window.rolePermissions || {}),
    user: Array.from(new Set([...(window.rolePermissions?.user || []), "wearable-import-section"])),
    coach: (window.rolePermissions?.coach || []).filter((item) => item !== "wearable-import-section"),
    nutritionist: (window.rolePermissions?.nutritionist || []).filter((item) => item !== "wearable-import-section"),
    admin: (window.rolePermissions?.admin || []).filter((item) => item !== "wearable-import-section")
};

var wearableSourceSupport = {
    "Apple Health": { icon: "AH", className: "apple", data: "步數、心率、睡眠、消耗熱量" },
    Garmin: { icon: "GM", className: "garmin", data: "運動時間、心率、熱量、運動類型" },
    Fitbit: { icon: "FB", className: "fitbit", data: "步數、睡眠、心率、活動量" }
};

function ensureWearableImportUI() {
    if (getCurrentRole() !== "user") return;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return;

    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="wearable-import-section"]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-btn";
        button.dataset.section = "wearable-import-section";
        button.textContent = "穿戴裝置匯入";
        button.onclick = () => showSection("wearable-import-section");
        const notificationButton = navMenu.querySelector('[data-section="notification-section"]');
        navMenu.insertBefore(button, notificationButton || null);
    }

    if (!document.getElementById("wearable-import-section")) {
        const section = document.createElement("section");
        section.id = "wearable-import-section";
        section.className = "content-section";
        section.innerHTML = wearableImportSectionHTML();
        const registrationSection = document.getElementById("registration-section");
        pageContent.insertBefore(section, registrationSection || pageContent.lastElementChild);
    }
}

function wearableImportSectionHTML() {
    return `
        <div class="section-heading">
            <h2>穿戴裝置資料匯入</h2>
            <p>模擬 Apple Health、Garmin、Fitbit 等穿戴裝置資料轉換為 FHIR Observation。</p>
        </div>
        <div class="wearable-grid">
            ${Object.keys(wearableSourceSupport).map((source) => wearableCardHTML(source)).join("")}
        </div>
        <div class="card wearable-import-history" id="wearable-import-history">
            <h3>匯入紀錄</h3>
            <div class="health-record-table-wrapper">
                <table class="wearable-history-table">
                    <thead><tr><th>匯入時間</th><th>裝置來源</th><th>步數</th><th>心率</th><th>睡眠</th><th>運動時間</th><th>狀態</th></tr></thead>
                    <tbody id="wearable-import-history-body"></tbody>
                </table>
            </div>
        </div>`;
}

function wearableCardHTML(source) {
    const item = wearableSourceSupport[source];
    return `
        <article class="wearable-card">
            <div class="wearable-card-head">
                <span class="wearable-icon ${item.className}">${item.icon}</span>
                <div><span class="wearable-source-badge">${escapeHTML(source)}</span><h3>${escapeHTML(source)}</h3></div>
            </div>
            <p>支援資料：${escapeHTML(item.data)}</p>
            <button type="button" class="primary-button" onclick="importWearableData('${escapeHTML(source)}')">模擬匯入</button>
        </article>`;
}

function generateWearableMockData(source) {
    const today = new Date();
    const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const samples = {
        "Apple Health": { source: "Apple Health", date, steps: 9200, hr: 74, sleep: 7.2, calories: 310, exercise: 35, exerciseType: "Walking" },
        Garmin: { source: "Garmin", date, steps: 10800, hr: 82, sleep: 6.8, calories: 520, exercise: 55, exerciseType: "Running" },
        Fitbit: { source: "Fitbit", date, steps: 7600, hr: 70, sleep: 7.8, calories: 280, exercise: 30, exerciseType: "Cycling" }
    };
    return { ...(samples[source] || samples["Apple Health"]) };
}

function importWearableData(source) {
    if (getCurrentRole() !== "user") {
        showToast("此頁僅開放一般使用者操作。");
        return;
    }

    ensureHealthStore();
    const mock = generateWearableMockData(source);
    const latest = latestRecord(activeUserId()) || {};
    const height = Number(latest.height || state.patient?.height || 175);
    const weight = Number(latest.weight || 70);
    const record = normalizeHealthRecord({
        id: uid("WR"),
        accountId: activeUserId(),
        source: mock.source,
        dataSource: mock.source,
        importedAt: nowText(),
        date: mock.date,
        steps: mock.steps,
        heartRate: mock.hr,
        hr: mock.hr,
        sleep: mock.sleep,
        calories: mock.calories,
        exercise: mock.exercise,
        exerciseDuration: mock.exercise,
        exerciseType: mock.exerciseType,
        height,
        weight,
        systolic: Number(latest.systolic || 120),
        diastolic: Number(latest.diastolic || 80),
        bmi: calculateBMI(weight, height),
        stress: Number(latest.stress || 3),
        water: Number(latest.water || 2000),
        diet: latest.diet || "正常",
        status: "已轉換為 FHIR Observation",
        createdAt: nowText()
    });

    state.healthRecords.push(record);
    state.history = state.healthRecords;
    addWearableNotification(source);
    updateAfterWearableImport();
    showImportSuccessModal(source);
}

function addWearableNotification(source) {
    addNotification(activeUserId(), "穿戴裝置資料已匯入", `已成功從 ${source} 匯入資料，並轉換為 FHIR Observation。`);
}

function updateAfterWearableImport() {
    saveState();
    renderAll();
}

function renderWearableHistory() {
    const body = document.getElementById("wearable-import-history-body");
    if (!body) return;
    ensureHealthStore();
    const rows = recordsByAccount(activeUserId())
        .filter((record) => record.source || record.dataSource)
        .slice(-20)
        .reverse()
        .map((record) => `
            <tr>
                <td>${escapeHTML(record.importedAt || record.createdAt || "--")}</td>
                <td>${escapeHTML(record.source || record.dataSource || "--")}</td>
                <td>${Number(record.steps || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.heartRate || record.hr || "--")} bpm</td>
                <td>${escapeHTML(record.sleep || "--")} h</td>
                <td>${escapeHTML(record.exercise || record.exerciseDuration || 0)} min</td>
                <td><span class="status-success">${escapeHTML(record.status || "已匯入")}</span></td>
            </tr>`)
        .join("");
    body.innerHTML = rows || `<tr><td colspan="7" class="empty">尚無穿戴裝置匯入紀錄</td></tr>`;
}

function showImportSuccessModal(source) {
    let modal = document.getElementById("import-success-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "import-success-modal";
        modal.className = "import-success-modal";
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="import-success-panel" role="dialog" aria-modal="true" aria-labelledby="import-success-title">
            <h3 id="import-success-title">匯入成功</h3>
            <p>已成功從 ${escapeHTML(source)} 匯入資料，並轉換為 FHIR Observation。</p>
            <button type="button" class="primary-button" onclick="closeImportSuccessModal()">知道了</button>
        </div>`;
    modal.classList.add("show");
    showToast(`已成功從 ${source} 匯入資料，並轉換為 FHIR Observation。`);
}

function closeImportSuccessModal() {
    document.getElementById("import-success-modal")?.classList.remove("show");
}

var baseRunAIAnalysisBeforeWearable = runAIAnalysis;
runAIAnalysis = function wearableRunAIAnalysis(accountId = activeUserId()) {
    const analysis = baseRunAIAnalysisBeforeWearable(accountId);
    const latest = latestRecord(accountId);
    const source = latest?.source || latest?.dataSource;
    if (source && analysis?.summary) {
        analysis.summary = `${analysis.summary} 本次資料來源：${source}`;
        analysis.healthAdvice = analysis.summary;
    }
    return analysis;
};

function wearableObservation(display, code, value, unit, date, accountId, source) {
    const resource = observation(display, code, value, unit, date, accountId);
    if (source) {
        resource.device = { display: source };
        resource.extension = [
            {
                url: "https://example.org/fhir/StructureDefinition/dataSource",
                valueString: source
            }
        ];
    }
    return resource;
}

function attachWearableSource(resource, source) {
    if (!resource || !source) return resource;
    resource.device = { display: source };
    resource.extension = [
        ...(resource.extension || []),
        {
            url: "https://example.org/fhir/StructureDefinition/dataSource",
            valueString: source
        }
    ];
    return resource;
}

generateFHIRBundle = function wearableFHIRBundle(accountId = activeUserId()) {
    ensureHealthStore();
    const account = state.accounts.find((item) => item.id === accountId) || state.accounts.find((item) => item.role === "user");
    const latest = latestRecord(account?.id);
    if (!account || !latest) return { resourceType: "Bundle", type: "collection", entry: [] };
    const source = latest.source || latest.dataSource || "Manual Entry";
    const observations = [
        wearableObservation("Body Height", "8302-2", latest.height || getUserHeight(), "cm", latest.date, account.id, source),
        wearableObservation("Body Weight", "29463-7", latest.weight, "kg", latest.date, account.id, source),
        wearableObservation("BMI", "39156-5", latest.bmi, "kg/m2", latest.date, account.id, source),
        attachWearableSource(bloodPressureObservation(latest.systolic, latest.diastolic, latest.date, account.id), source),
        wearableObservation("Heart Rate", "8867-4", latest.heartRate || latest.hr, "beats/min", latest.date, account.id, source),
        wearableObservation("Steps", "41950-7", latest.steps, "steps", latest.date, account.id, source),
        wearableObservation("Sleep Duration", "93832-4", latest.sleep, "h", latest.date, account.id, source),
        wearableObservation("Calories Burned", "41981-2", latest.calories || 0, "kcal", latest.date, account.id, source),
        wearableObservation("Exercise Duration", "55411-3", latest.exercise || latest.exerciseDuration || 0, "min", latest.date, account.id, source)
    ];
    return {
        resourceType: "Bundle",
        type: "collection",
        timestamp: new Date().toISOString(),
        dataSource: source,
        entry: [
            { resource: { resourceType: "Patient", id: account.id, name: [{ text: account.name }], telecom: [{ system: "email", value: account.email }, { system: "phone", value: account.phone }], managingOrganization: { display: account.organization } } },
            { resource: { resourceType: "Practitioner", id: "practitioner-demo-001", name: [{ text: "AI Health Platform" }] } },
            ...observations.map((resource) => ({ resource }))
        ]
    };
};

var baseRenderAllBeforeWearable = renderAll;
renderAll = function wearableRenderAll() {
    ensureWearableImportUI();
    baseRenderAllBeforeWearable();
    renderWearableHistory();
};

window.importWearableData = importWearableData;
window.generateWearableMockData = generateWearableMockData;
window.renderWearableHistory = renderWearableHistory;
window.addWearableNotification = addWearableNotification;
window.updateAfterWearableImport = updateAfterWearableImport;
window.closeImportSuccessModal = closeImportSuccessModal;
window.generateFHIRBundle = generateFHIRBundle;
window.runAIAnalysis = runAIAnalysis;
window.renderAll = renderAll;

// Data security and privacy protection center.
window.rolePermissions = {
    ...(window.rolePermissions || {}),
    user: Array.from(new Set([...(window.rolePermissions?.user || []), "security-center-section"])),
    admin: Array.from(new Set([...(window.rolePermissions?.admin || []), "security-center-section"])),
    coach: (window.rolePermissions?.coach || []).filter((item) => item !== "security-center-section"),
    nutritionist: (window.rolePermissions?.nutritionist || []).filter((item) => item !== "security-center-section")
};

if (typeof SECTION_LABELS === "object") SECTION_LABELS["security-center-section"] = "資料安全與隱私保護中心";

function maskEmail(email) {
    const value = String(email || "");
    const [name, domain] = value.split("@");
    if (!name || !domain) return value ? "***" : "--";
    return `${name.slice(0, 1)}***@${domain}`;
}

function maskPhone(phone) {
    const value = String(phone || "");
    if (value.length < 7) return value ? "***" : "--";
    return `${value.slice(0, 4)}***${value.slice(-3)}`;
}

function maskName(name) {
    const value = String(name || "");
    if (!value) return "--";
    if (value.length <= 2) return `${value.slice(0, 1)}○`;
    return `${value.slice(0, 1)}○${value.slice(-1)}`;
}

function ensureAuditLogs() {
    if (!Array.isArray(state.auditLogs)) state.auditLogs = [];
    if (!state.auditLogs.length) {
        state.auditLogs.push({
            id: "LOG-20260628-001",
            actor: "王小明",
            role: "user",
            action: "新增健康資料",
            target: "Observation",
            time: "2026-06-28 10:30",
            status: "Success"
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
}

function addAuditLog(action, target, status = "Success") {
    ensureAuditLogs();
    const account = currentAccount();
    const role = getCurrentRole();
    state.auditLogs.unshift({
        id: uid("LOG"),
        actor: account?.name || (state.demoMode ? `${ROLES[role] || role} Demo` : "Guest"),
        role,
        action,
        target,
        time: nowText(),
        status
    });
}

function getSecurityStats() {
    ensureAuditLogs();
    const role = getCurrentRole();
    const account = currentAccount() || {};
    const validAuths = (state.authorizations || []).filter(isAuthorizationValid);
    const expiredAuths = (state.authorizations || []).filter((item) => !isAuthorizationValid(item));
    const navSections = Array.from(document.querySelectorAll("[data-section]")).map((item) => item.dataset.section);
    const allowedCount = new Set(navSections).size;
    const allCount = Object.keys(SECTION_LABELS || {}).length || allowedCount;
    const latestHash = (state.blockchainLogs || [])[0]?.hash || "--";
    return {
        role,
        account,
        allowedCount,
        deniedCount: Math.max(0, allCount - allowedCount),
        validAuthCount: validAuths.length,
        expiredAuthCount: expiredAuths.length,
        authTargets: validAuths.map((item) => item.targetName || item.targetRole).filter(Boolean).slice(0, 3).join("、") || "--",
        hashCount: (state.blockchainLogs || []).length,
        latestHash
    };
}

function ensureSecurityCenterUI() {
    const role = getCurrentRole();
    if (!["user", "admin"].includes(role)) return;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return;

    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="security-center-section"]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-btn";
        button.dataset.section = "security-center-section";
        button.textContent = "資料安全";
        button.onclick = () => showSection("security-center-section");
        const before = navMenu.querySelector('[data-section="system-setting-section"]') || navMenu.querySelector('[data-section="notification-section"]');
        navMenu.insertBefore(button, before || null);
    }

    if (!document.getElementById("security-center-section")) {
        const section = document.createElement("section");
        section.id = "security-center-section";
        section.className = "content-section";
        const before = document.getElementById("system-setting-section") || document.getElementById("notification-section");
        pageContent.insertBefore(section, before || null);
    }
}

function securitySamplePayload() {
    const latest = latestRecord(activeUserId()) || {};
    return {
        patient: maskName(currentAccount()?.name || state.patient?.name || "王小明"),
        date: latest.date || "2026-06-28",
        steps: latest.steps || 9200,
        heartRate: latest.heartRate || latest.hr || 74,
        sleep: latest.sleep || 7.2,
        source: latest.source || latest.dataSource || "localStorage"
    };
}

function renderSecurityCenter() {
    ensureSecurityCenterUI();
    const section = document.getElementById("security-center-section");
    if (!section) return;
    ensureAuditLogs();
    const stats = getSecurityStats();
    const account = stats.account;
    const encrypted = state.securityEncryptedData || "";
    const decrypted = state.securityDecryptedData || "";
    section.innerHTML = `
        <div class="section-heading">
            <h2>資料安全與隱私保護中心</h2>
            <p>展示本平台如何透過登入驗證、角色權限、資料授權、敏感資料遮罩、Hash 驗證與區塊鏈授權紀錄保護健康資料。</p>
        </div>
        <div class="security-grid">
            <article class="security-card"><span class="security-badge">LOCK 登入驗證</span><h3>登入驗證</h3><p>帳號登入：${state.currentAccount ? "已登入" : "未登入"}</p><p>Demo 模式：${state.demoMode ? "啟用" : "未啟用"}</p><p>目前登入狀態：${isLoggedIn() ? "Active" : "Guest"}</p></article>
            <article class="security-card"><span class="security-badge">SHIELD 角色權限</span><h3>角色權限</h3><p>目前角色：${escapeHTML(ROLES[stats.role] || stats.role)}</p><p>可使用頁面數：${stats.allowedCount}</p><p>禁止使用頁面數：${stats.deniedCount}</p></article>
            <article class="security-card"><span class="security-badge">CONSENT 授權資料</span><h3>授權資料</h3><p>有效授權數：${stats.validAuthCount}</p><p>過期授權數：${stats.expiredAuthCount}</p><p>授權對象：${escapeHTML(stats.authTargets)}</p></article>
            <article class="security-card"><span class="security-badge">HASH 區塊鏈紀錄</span><h3>區塊鏈紀錄</h3><p>Hash 紀錄數：${stats.hashCount}</p><p>最近一筆 Hash：${escapeHTML(stats.latestHash)}</p><p>狀態：已存證</p></article>
            <article class="security-card"><span class="security-badge">MASK 敏感資料保護</span><h3>敏感資料保護</h3><p>Email 遮罩：${escapeHTML(maskEmail(account.email || "test@example.com"))}</p><p>手機遮罩：${escapeHTML(maskPhone(account.phone || "0912345678"))}</p><p>姓名遮罩：${escapeHTML(maskName(account.name || "王小明"))}</p><p>健康資料不直接上鏈</p></article>
            <article class="security-card"><span class="security-badge">LOCAL 模擬加密</span><h3>localStorage 資料加密模擬</h3><p>此為前端展示用模擬加密，正式系統應使用後端與 HTTPS 加密儲存。</p><pre class="encrypted-box" id="security-plain-data">${escapeHTML(JSON.stringify(securitySamplePayload(), null, 2))}</pre><div class="security-actions"><button type="button" class="primary-button" onclick="simulateEncrypt()">模擬加密</button><button type="button" class="secondary-button" onclick="simulateDecrypt()">模擬解密</button></div><p>encryptedData</p><pre class="encrypted-box" id="security-encrypted-data">${escapeHTML(encrypted || "尚未加密")}</pre><p>decryptedData</p><pre class="encrypted-box" id="security-decrypted-data">${escapeHTML(decrypted || "尚未解密")}</pre></article>
        </div>
        <article class="hash-tool-card">
            <h3>Hash 驗證工具</h3>
            <div class="form-group"><label for="security-hash-input">輸入驗證文字</label><textarea id="security-hash-input" placeholder="輸入要產生 Hash 的文字"></textarea></div>
            <button type="button" class="primary-button" onclick="generateHashFromInput()">產生 Hash</button>
            <pre class="encrypted-box" id="security-hash-output">尚未產生 Hash</pre>
        </article>
        <article class="privacy-note">
            <h3>健康資料不上鏈，只將授權紀錄 Hash 上鏈</h3>
            <p>平台僅保存授權紀錄 Hash 作為不可竄改存證，不把原始健康資料寫入鏈上。</p>
            <ul><li>避免個資外洩</li><li>保持資料可撤回</li><li>區塊鏈只做不可竄改存證</li></ul>
        </article>
        <div class="card" style="margin-top:18px">
            <h3>操作紀錄 Audit Log</h3>
            <div class="health-record-table-wrapper">
                <table class="audit-log-table"><thead><tr><th>時間</th><th>操作者</th><th>角色</th><th>動作</th><th>目標</th><th>狀態</th></tr></thead><tbody>${renderAuditRows()}</tbody></table>
            </div>
        </div>`;
}

function renderAuditRows() {
    ensureAuditLogs();
    return state.auditLogs.slice(0, 30).map((log) => `
        <tr><td>${escapeHTML(log.time)}</td><td>${escapeHTML(log.actor)}</td><td>${escapeHTML(log.role)}</td><td>${escapeHTML(log.action)}</td><td>${escapeHTML(log.target)}</td><td>${escapeHTML(log.status)}</td></tr>
    `).join("") || `<tr><td colspan="6" class="empty">尚無操作紀錄</td></tr>`;
}

function encodeSecurityPayload(text) {
    return btoa(unescape(encodeURIComponent(text.split("").reverse().join(""))));
}

function decodeSecurityPayload(text) {
    return decodeURIComponent(escape(atob(text))).split("").reverse().join("");
}

function simulateEncrypt() {
    const plain = document.getElementById("security-plain-data")?.textContent || JSON.stringify(securitySamplePayload());
    const encrypted = `SIM-AES-LIKE:${encodeSecurityPayload(plain)}`;
    state.securityEncryptedData = encrypted;
    state.securityDecryptedData = "";
    addAuditLog("模擬加密 localStorage 資料", "localStorage", "Success");
    saveState();
    renderSecurityCenter();
}

function simulateDecrypt() {
    const encrypted = String(state.securityEncryptedData || "").replace(/^SIM-AES-LIKE:/, "");
    if (!encrypted) {
        showToast("尚無可解密資料");
        return;
    }
    try {
        state.securityDecryptedData = decodeSecurityPayload(encrypted);
        addAuditLog("模擬解密 localStorage 資料", "localStorage", "Success");
        saveState();
        renderSecurityCenter();
    } catch (error) {
        showToast("解密失敗");
    }
}

async function generateHashFromInput() {
    const input = document.getElementById("security-hash-input")?.value || "";
    const output = document.getElementById("security-hash-output");
    if (!input.trim()) {
        showToast("請輸入要產生 Hash 的文字");
        return;
    }
    let result;
    if (globalThis.crypto?.subtle) {
        const bytes = new TextEncoder().encode(input);
        const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
        result = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    } else {
        result = hashText(input);
    }
    if (output) output.textContent = result;
    addAuditLog("產生 Hash", "Hash 驗證工具", "Success");
    saveState();
}

var baseLoginAccountBeforeSecurity = loginAccount;
loginAccount = async function securityLoginAccount(event) {
    await baseLoginAccountBeforeSecurity(event);
    if (isLoggedIn()) {
        addAuditLog("登入成功", "Auth", "Success");
        saveState();
    }
};

var baseLogoutAccountBeforeSecurity = logoutAccount;
logoutAccount = function securityLogoutAccount() {
    addAuditLog("登出", "Auth", "Success");
    baseLogoutAccountBeforeSecurity();
};

var baseDemoLoginBeforeSecurity = demoLogin;
demoLogin = function securityDemoLogin(role) {
    baseDemoLoginBeforeSecurity(role);
    if (state.demoMode) {
        addAuditLog("登入成功", "Demo Auth", "Success");
        saveState();
    }
};

var baseSubmitHealthDataBeforeSecurity = submitHealthData;
submitHealthData = function securitySubmitHealthData(event) {
    const before = state.healthRecords?.length || 0;
    baseSubmitHealthDataBeforeSecurity(event);
    if ((state.healthRecords?.length || 0) > before) {
        addAuditLog("新增健康資料", "Observation", "Success");
        saveState();
    }
};

var baseGenerateQRCodeBeforeSecurity = generateQRCode;
generateQRCode = function securityGenerateQRCode(event) {
    const before = state.authorizations?.length || 0;
    baseGenerateQRCodeBeforeSecurity(event);
    if ((state.authorizations?.length || 0) > before) {
        addAuditLog("產生授權 QR Code", "Authorization", "Success");
        saveState();
    }
};

var baseUpdateRegistrationStatusBeforeSecurity = updateRegistrationStatus;
updateRegistrationStatus = function securityUpdateRegistrationStatus(id, status) {
    baseUpdateRegistrationStatusBeforeSecurity(id, status);
    addAuditLog("管理員審核報名", `Registration ${id}`, "Success");
    saveState();
};

var baseDeleteHealthRecordBeforeSecurity = deleteHealthRecord;
deleteHealthRecord = function securityDeleteHealthRecord(id) {
    const before = state.healthRecords?.length || 0;
    baseDeleteHealthRecordBeforeSecurity(id);
    if ((state.healthRecords?.length || 0) < before) {
        addAuditLog("刪除健康資料", `Observation ${id}`, "Success");
        saveState();
    }
};

resetDemoData = async function securityResetDemoData() {
    if (!confirm("確認要重置 Demo 資料？此操作會清除目前 localStorage 模擬資料。")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    await initDefaultAccounts();
    ensureAuditLogs();
    addAuditLog("重置 Demo 資料", "Demo Data", "Success");
    saveState();
    showToast("Demo 資料已重置");
    window.location.href = "index.html";
};

if (typeof importWearableData === "function") {
    var baseImportWearableDataBeforeSecurity = importWearableData;
    importWearableData = function securityImportWearableData(source) {
        const before = state.healthRecords?.length || 0;
        baseImportWearableDataBeforeSecurity(source);
        if ((state.healthRecords?.length || 0) > before) {
            addAuditLog("匯入穿戴裝置資料", source, "Success");
            saveState();
        }
    };
}

var baseRenderAllBeforeSecurity = renderAll;
renderAll = function securityRenderAll() {
    ensureAuditLogs();
    ensureSecurityCenterUI();
    baseRenderAllBeforeSecurity();
    renderSecurityCenter();
};

window.maskEmail = maskEmail;
window.maskPhone = maskPhone;
window.maskName = maskName;
window.addAuditLog = addAuditLog;
window.renderSecurityCenter = renderSecurityCenter;
window.simulateEncrypt = simulateEncrypt;
window.simulateDecrypt = simulateDecrypt;
window.generateHashFromInput = generateHashFromInput;
window.getSecurityStats = getSecurityStats;
window.loginAccount = loginAccount;
window.demoLogin = demoLogin;
window.logoutAccount = logoutAccount;
window.submitHealthData = submitHealthData;
window.generateQRCode = generateQRCode;
window.updateRegistrationStatus = updateRegistrationStatus;
window.deleteHealthRecord = deleteHealthRecord;
window.resetDemoData = resetDemoData;
if (typeof importWearableData === "function") window.importWearableData = importWearableData;
window.renderAll = renderAll;
