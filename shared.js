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

// FHIR Validator and HAPI FHIR Server demo.
window.rolePermissions = {
    ...(window.rolePermissions || {}),
    user: Array.from(new Set([...(window.rolePermissions?.user || []), "fhir-validator-section"])),
    admin: Array.from(new Set([...(window.rolePermissions?.admin || []), "fhir-validator-section"])),
    coach: (window.rolePermissions?.coach || []).filter((item) => item !== "fhir-validator-section"),
    nutritionist: (window.rolePermissions?.nutritionist || []).filter((item) => item !== "fhir-validator-section")
};

if (typeof SECTION_LABELS === "object") SECTION_LABELS["fhir-validator-section"] = "FHIR 驗證";

var baseGenerateFHIRBundleBeforeValidator = generateFHIRBundle;
generateFHIRBundle = function validatorFHIRBundle(accountId = activeUserId()) {
    let bundle = baseGenerateFHIRBundleBeforeValidator(accountId);
    const fallbackUser = state.accounts.find((item) => item.role === "user");
    if ((!bundle?.entry || bundle.entry.length === 0) && fallbackUser) {
        bundle = baseGenerateFHIRBundleBeforeValidator(fallbackUser.id);
    }
    const account = state.accounts.find((item) => item.id === accountId && item.role === "user") || fallbackUser || {};
    if (bundle && bundle.resourceType === "Bundle") {
        bundle.id = bundle.id || "bundle-demo-001";
        (bundle.entry || []).forEach((entry) => {
            const resource = entry?.resource;
            if (!resource) return;
            if (resource.resourceType === "Patient") {
                resource.gender = resource.gender || state.patient?.gender || "male";
                resource.birthDate = resource.birthDate || state.patient?.birthday || "1990-01-01";
            }
            if (resource.resourceType === "Observation") {
                resource.subject = resource.subject || { reference: `Patient/${account.id || activeUserId()}` };
                resource.effectiveDateTime = resource.effectiveDateTime || new Date().toISOString();
            }
        });
    }
    return bundle;
};

function ensureFhirSyncLogs() {
    if (!Array.isArray(state.fhirSyncLogs)) {
        state.fhirSyncLogs = [{
            id: "SYNC-20260628-001",
            server: "https://hapi.fhir.org/baseR4",
            bundleId: "bundle-demo-001",
            patientId: "patient-demo-001",
            observationCount: 6,
            mode: "mock",
            status: "Success",
            time: "2026-06-28 10:30"
        }];
        saveState();
    }
}

function fhirBundleForValidation() {
    return generateFHIRBundle(activeUserId());
}

function addFhirCheck(results, label, severity, message) {
    results.items.push({ label, severity, message });
    if (severity === "pass") results.passed += 1;
    if (severity === "warning") results.warnings += 1;
    if (severity === "error") results.errors += 1;
}

function validateFHIRBundle() {
    const bundle = fhirBundleForValidation();
    const results = { passed: 0, warnings: 0, errors: 0, status: "Valid", items: [], bundle };
    const entries = Array.isArray(bundle?.entry) ? bundle.entry : [];
    const bundleErrors = [];
    if (bundle?.resourceType !== "Bundle") bundleErrors.push("resourceType must be Bundle");
    if (!bundle?.type) bundleErrors.push("type is required");
    if (!Array.isArray(bundle?.entry)) bundleErrors.push("entry must be an array");
    if (!entries.length) bundleErrors.push("entry.length must be greater than 0");
    addFhirCheck(results, "Bundle", bundleErrors.length ? "error" : "pass", bundleErrors.join(", ") || "Bundle structure is valid");

    const patient = entries.map((entry) => entry.resource).find((resource) => resource?.resourceType === "Patient");
    const patientErrors = [];
    if (!patient) patientErrors.push("Patient resource is required");
    else {
        if (patient.resourceType !== "Patient") patientErrors.push("resourceType must be Patient");
        if (!patient.id) patientErrors.push("id is required");
        if (!patient.name || !patient.name.length) patientErrors.push("name is required");
        if (!patient.gender) patientErrors.push("gender is required");
        if (!patient.birthDate) patientErrors.push("birthDate is required");
    }
    addFhirCheck(results, "Patient", patientErrors.length ? "error" : "pass", patientErrors.join(", ") || "Patient fields are valid");

    const observationLabels = [
        { match: "85354-9", label: "Blood Pressure Observation" },
        { match: "29463-7", label: "Body Weight Observation" },
        { match: "8867-4", label: "Heart Rate Observation" },
        { match: "39156-5", label: "BMI Observation" },
        { match: "41950-7", label: "Steps Observation" },
        { match: "93832-4", label: "Sleep Observation" }
    ];
    const observations = entries.map((entry) => entry.resource).filter((resource) => resource?.resourceType === "Observation");
    observationLabels.forEach((target) => {
        const observation = observations.find((resource) => {
            const codings = resource?.code?.coding || [];
            return codings.some((coding) => coding.code === target.match || String(coding.display || "").includes(target.label.replace(" Observation", "")));
        });
        const errors = [];
        if (!observation) errors.push("Observation is required");
        else {
            if (observation.resourceType !== "Observation") errors.push("resourceType must be Observation");
            if (observation.status !== "final") errors.push("status must be final");
            if (!observation.code) errors.push("code is required");
            if (!observation.subject?.reference) errors.push("subject.reference is required");
            if (!observation.effectiveDateTime) errors.push("effectiveDateTime is required");
            if (!observation.valueQuantity && !observation.component) errors.push("valueQuantity or component is required");
        }
        addFhirCheck(results, target.label, errors.length ? "error" : "pass", errors.join(", ") || `${target.label} is valid`);
    });
    if (results.errors > 0) results.status = "Error";
    else if (results.warnings > 0) results.status = "Warning";
    return results;
}

function fhirStatusIcon(severity) {
    if (severity === "pass") return '<span class="fhir-result-icon pass">✓</span>';
    if (severity === "warning") return '<span class="fhir-result-icon warning">!</span>';
    return '<span class="fhir-result-icon error">×</span>';
}

function renderFHIRValidation() {
    ensureFHIRValidatorUI();
    ensureFhirSyncLogs();
    const section = document.getElementById("fhir-validator-section");
    if (!section) return;
    const results = validateFHIRBundle();
    const json = JSON.stringify(results.bundle, null, 2);
    const statusClass = results.status.toLowerCase();
    const displayItems = results.items.filter((item) => item.label !== "Bundle");
    section.innerHTML = `
        <div class="section-heading fhir-validator-heading">
            <div><h2>FHIR 驗證中心</h2><p>使用目前 generateFHIRBundle() 產生的 FHIR Bundle，展示前端驗證、JSON 預覽與 HAPI FHIR Server 串接流程。</p></div>
            <span class="fhir-status-badge ${statusClass}">${results.status}</span>
        </div>
        <div class="fhir-flow-card">
            <div class="fhir-flow-node">健康資料</div><div class="fhir-flow-arrow">→</div><div class="fhir-flow-node">FHIR Converter</div><div class="fhir-flow-arrow">→</div><div class="fhir-flow-node">Bundle</div><div class="fhir-flow-arrow">→</div><div class="fhir-flow-node">Validator</div><div class="fhir-flow-arrow">→</div><div class="fhir-flow-node">HAPI FHIR Server</div><div class="fhir-flow-arrow">→</div><div class="fhir-flow-node">Read Resource</div><div class="fhir-flow-arrow">→</div><div class="fhir-flow-node">顯示結果</div>
        </div>
        <div class="fhir-validator-grid">
            <article class="card fhir-validator-card">
                <div class="fhir-card-title-row"><h3>FHIR Validator</h3><span class="fhir-status-badge ${statusClass}">${results.status}</span></div>
                <div class="fhir-validation-kpis"><div><span>通過數</span><strong>${results.passed}</strong></div><div><span>警告數</span><strong>${results.warnings}</strong></div><div><span>錯誤數</span><strong>${results.errors}</strong></div></div>
                <ul class="fhir-validation-list">${displayItems.map((item) => `<li class="${item.severity}">${fhirStatusIcon(item.severity)}<span>${escapeHTML(item.label)}：${item.severity === "pass" ? "通過" : item.severity === "warning" ? "警告" : "錯誤"}</span><small>${escapeHTML(item.message)}</small></li>`).join("")}</ul>
            </article>
            <article class="card hapi-demo-card">
                <div class="fhir-card-title-row"><h3>HAPI FHIR Server 同步展示</h3><span class="hapi-mode-badge" id="hapi-mode-badge">${escapeHTML(state.hapiMode || "mock")}</span></div>
                <div class="form-group"><label for="hapi-server-url">Server URL</label><input id="hapi-server-url" type="url" value="${escapeHTML(state.hapiServerUrl || "https://hapi.fhir.org/baseR4")}" /></div>
                <div class="fhir-actions"><button type="button" class="secondary-button" onclick="testHapiConnection()">測試連線</button><button type="button" class="primary-button" onclick="uploadBundleToHapi()">模擬上傳 Bundle</button><button type="button" class="secondary-button" onclick="readHapiPatient()">讀取 Patient</button><button type="button" class="secondary-button" onclick="clearFhirSyncLogs()">清除同步紀錄</button></div>
                <p class="hapi-status-text" id="hapi-status-text">${escapeHTML(state.hapiStatusText || "尚未測試連線。若 CORS 或網路限制失敗，系統會自動切換為模擬模式。")}</p>
                <div id="hapi-sync-steps" class="hapi-sync-steps"></div>
            </article>
        </div>
        <article class="card fhir-json-card"><div class="fhir-card-title-row"><h3>FHIR JSON 預覽</h3><div class="fhir-actions"><button type="button" class="secondary-button" onclick="copyFHIRJson()">複製 JSON</button><button type="button" class="secondary-button" onclick="renderFHIRValidation()">重新驗證</button><button type="button" class="primary-button" onclick="downloadFHIRJson()">下載 JSON</button></div></div><pre class="code-block fhir-json-preview" id="fhir-validator-json">${escapeHTML(json)}</pre></article>
        <article class="card fhir-log-card"><h3>同步紀錄</h3><div class="health-record-table-wrapper"><table class="fhir-sync-log-table"><thead><tr><th>同步編號</th><th>Server</th><th>Patient ID</th><th>Observation 數</th><th>模式</th><th>狀態</th><th>時間</th></tr></thead><tbody id="fhir-sync-log-body"></tbody></table></div></article>`;
    renderHapiSyncSteps();
    renderFhirSyncLogs();
}

function copyFHIRJson() {
    const text = document.getElementById("fhir-validator-json")?.textContent || JSON.stringify(fhirBundleForValidation(), null, 2);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => showToast("FHIR JSON 已複製")).catch(() => showToast("瀏覽器限制剪貼簿，請手動複製"));
    else showToast("瀏覽器不支援剪貼簿 API");
}

function downloadFHIRJson() {
    const blob = new Blob([JSON.stringify(fhirBundleForValidation(), null, 2)], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fhir-bundle-demo.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("FHIR JSON 已下載");
}

async function testHapiConnection() {
    const server = (document.getElementById("hapi-server-url")?.value || "https://hapi.fhir.org/baseR4").replace(/\/$/, "");
    state.hapiServerUrl = server;
    state.hapiStatusText = "Testing HAPI FHIR Server connection...";
    state.hapiMode = "live";
    renderFHIRValidation();
    try {
        const response = await fetch(`${server}/metadata`, { method: "GET", headers: { Accept: "application/fhir+json, application/json" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.hapiStatusText = "連線成功：已取得 CapabilityStatement。";
    } catch (error) {
        state.hapiMode = "mock";
        state.hapiStatusText = `連線失敗，已切換為模擬模式：${error.message || "CORS or network blocked"}`;
    }
    saveState();
    renderFHIRValidation();
}

async function uploadBundleToHapi() {
    await simulateHapiUpload();
}

async function simulateHapiUpload() {
    ensureFhirSyncLogs();
    const labels = ["驗證 FHIR Bundle", "建立 Patient", "建立 Observation", "上傳到 HAPI FHIR Server", "回傳 Resource ID", "同步完成"];
    state.hapiSyncSteps = labels.map((label) => ({ label, status: "pending" }));
    state.hapiStatusText = "FHIR Bundle 同步流程執行中...";
    saveState();
    renderFHIRValidation();
    for (let i = 0; i < labels.length; i += 1) {
        state.hapiSyncSteps = state.hapiSyncSteps.map((step, index) => ({ ...step, status: index < i ? "success" : index === i ? "processing" : "pending" }));
        saveState();
        renderHapiSyncSteps();
        await new Promise((resolve) => setTimeout(resolve, 350));
    }
    const validation = validateFHIRBundle();
    const success = validation.errors === 0;
    state.hapiSyncSteps = state.hapiSyncSteps.map((step) => ({ ...step, status: success ? "success" : "failed" }));
    const bundle = validation.bundle;
    const patient = (bundle.entry || []).map((entry) => entry.resource).find((resource) => resource?.resourceType === "Patient") || {};
    const observationCount = (bundle.entry || []).filter((entry) => entry.resource?.resourceType === "Observation").length;
    const mode = state.hapiMode === "live" ? "live" : "mock";
    state.fhirSyncLogs.unshift({ id: `SYNC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(state.fhirSyncLogs.length + 1).padStart(3, "0")}`, server: state.hapiServerUrl || "https://hapi.fhir.org/baseR4", bundleId: bundle.id || "bundle-demo-001", patientId: patient.id || "patient-demo-001", observationCount, mode, status: success ? "Success" : "Failed", time: nowText() });
    state.hapiStatusText = success ? `同步完成，模式：${mode}，Patient ID：${patient.id || "patient-demo-001"}` : "驗證失敗，已停止同步。";
    saveState();
    renderFHIRValidation();
}

function renderHapiSyncSteps() {
    const container = document.getElementById("hapi-sync-steps");
    if (!container) return;
    const steps = Array.isArray(state.hapiSyncSteps) && state.hapiSyncSteps.length ? state.hapiSyncSteps : ["驗證 FHIR Bundle", "建立 Patient", "建立 Observation", "上傳到 HAPI FHIR Server", "回傳 Resource ID", "同步完成"].map((label) => ({ label, status: "pending" }));
    container.innerHTML = steps.map((step, index) => `<div class="hapi-step ${escapeHTML(step.status)}"><span class="hapi-step-index">${index + 1}</span><span class="hapi-step-label">${escapeHTML(step.label)}</span><span class="hapi-step-status">${escapeHTML(step.status)}</span></div>`).join("");
}

function renderFhirSyncLogs() {
    ensureFhirSyncLogs();
    const body = document.getElementById("fhir-sync-log-body");
    if (!body) return;
    body.innerHTML = state.fhirSyncLogs.map((log) => `<tr><td>${escapeHTML(log.id)}</td><td>${escapeHTML(log.server)}</td><td>${escapeHTML(log.patientId)}</td><td>${escapeHTML(String(log.observationCount))}</td><td><span class="hapi-mode-badge">${escapeHTML(log.mode)}</span></td><td><span class="fhir-status-badge ${String(log.status).toLowerCase() === "success" ? "valid" : "error"}">${escapeHTML(log.status)}</span></td><td>${escapeHTML(log.time)}</td></tr>`).join("") || `<tr><td colspan="7" class="empty">尚無同步紀錄</td></tr>`;
}

function readHapiPatient() {
    const bundle = fhirBundleForValidation();
    const patient = (bundle.entry || []).map((entry) => entry.resource).find((resource) => resource?.resourceType === "Patient") || {};
    state.hapiStatusText = `Read Patient 模擬結果：${patient.id || "patient-demo-001"} / ${patient.name?.[0]?.text || "Demo Patient"}`;
    state.hapiMode = state.hapiMode || "mock";
    saveState();
    renderFHIRValidation();
}

function clearFhirSyncLogs() {
    state.fhirSyncLogs = [];
    state.hapiSyncSteps = [];
    state.hapiStatusText = "同步紀錄已清除。";
    saveState();
    renderFHIRValidation();
}

function ensureFHIRValidatorUI() {
    const role = getCurrentRole();
    if (!["user", "admin"].includes(role)) return;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return;
    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="fhir-validator-section"]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-btn";
        button.dataset.section = "fhir-validator-section";
        button.textContent = "FHIR 驗證";
        button.onclick = () => showSection("fhir-validator-section");
        const before = navMenu.querySelector('[data-section="security-center-section"]') || navMenu.querySelector('[data-section="notification-section"]') || navMenu.querySelector('[data-section="system-setting-section"]');
        navMenu.insertBefore(button, before || null);
    }
    if (!document.getElementById("fhir-validator-section")) {
        const section = document.createElement("section");
        section.id = "fhir-validator-section";
        section.className = "content-section";
        const before = document.getElementById("security-center-section") || document.getElementById("notification-section") || document.getElementById("system-setting-section");
        pageContent.insertBefore(section, before || null);
    }
}

var baseRenderAllBeforeFHIRValidator = renderAll;
renderAll = function fhirValidatorRenderAll() {
    ensureFHIRValidatorUI();
    baseRenderAllBeforeFHIRValidator();
    renderFHIRValidation();
};

window.generateFHIRBundle = generateFHIRBundle;
window.validateFHIRBundle = validateFHIRBundle;
window.renderFHIRValidation = renderFHIRValidation;
window.copyFHIRJson = copyFHIRJson;
window.downloadFHIRJson = downloadFHIRJson;
window.testHapiConnection = testHapiConnection;
window.uploadBundleToHapi = uploadBundleToHapi;
window.simulateHapiUpload = simulateHapiUpload;
window.renderHapiSyncSteps = renderHapiSyncSteps;
window.renderFhirSyncLogs = renderFhirSyncLogs;
window.readHapiPatient = readHapiPatient;
window.clearFhirSyncLogs = clearFhirSyncLogs;
window.renderAll = renderAll;

// Smart notification rule engine.
const SMART_NOTIFICATION_TYPES = ["all", "unread", "health", "ai", "fhir", "authorization", "registration", "system"];

function notificationAccountId() {
    return currentAccount()?.id || activeUserId?.() || "all";
}

function nextNotificationId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = (state.notifications || []).filter((item) => String(item.id || "").includes(date)).length + 1;
    return `NOTI-${date}-${String(count).padStart(3, "0")}`;
}

function normalizeNotification(item) {
    const typeMap = { "health-warning": "health" };
    return {
        id: item.id || nextNotificationId(),
        accountId: item.accountId || notificationAccountId(),
        title: item.title || "系統通知",
        message: item.message || "",
        type: typeMap[item.type] || item.type || "system",
        level: item.level || (item.type === "health-warning" ? "warning" : "info"),
        read: Boolean(item.read ?? item.isRead ?? false),
        relatedSection: item.relatedSection || "notification-section",
        sourceId: item.sourceId || item.relatedRecordId || "",
        createdAt: item.createdAt || item.time || nowText()
    };
}

function ensureSmartNotifications() {
    if (!Array.isArray(state.notifications)) state.notifications = [];
    state.notifications = state.notifications.map(normalizeNotification);
}

function notificationsForCurrentAccountSmart() {
    ensureSmartNotifications();
    const accountId = notificationAccountId();
    return state.notifications.filter((item) => item.accountId === "all" || item.accountId === accountId);
}

function addNotification(title, message, type = "system", level = "info", relatedSection = "notification-section", sourceId = "") {
    ensureSmartNotifications();
    let accountId = notificationAccountId();
    if ((String(title).startsWith("ACC-") || title === "all") && arguments.length <= 3) {
        accountId = title;
        title = message;
        message = type;
        type = "system";
        level = "info";
        relatedSection = "notification-section";
        sourceId = "";
    }
    const notification = normalizeNotification({ id: nextNotificationId(), accountId, title, message, type, level, relatedSection, sourceId, read: false, createdAt: nowText() });
    if (notification.sourceId && state.notifications.some((item) => item.accountId === notification.accountId && item.sourceId === notification.sourceId && item.type === notification.type && item.title === notification.title)) {
        return null;
    }
    state.notifications.unshift(notification);
    saveState();
    updateNotificationBadge();
    return notification;
}

function weeklyExerciseMinutesFor(record) {
    const accountId = record?.accountId || activeUserId();
    return (state.healthRecords || [])
        .filter((item) => item.accountId === accountId)
        .slice(-7)
        .reduce((sum, item) => sum + Number(item.exercise || item.exerciseDuration || 0), 0);
}

function evaluateHealthNotifications(latestData) {
    if (!latestData) return;
    const record = typeof normalizeHealthRecord === "function" ? normalizeHealthRecord(latestData) : latestData;
    const source = record.id || `${record.accountId || activeUserId()}-${record.date || nowText()}`;
    addNotification("健康資料已儲存", "健康資料已儲存，AI 分析已更新。", "health", "success", "ai-health-section", `${source}:health-saved`);
    if (Number(record.systolic) >= 130 || Number(record.diastolic) >= 80) {
        addNotification("血壓偏高提醒", "血壓偏高提醒：建議減少高鈉飲食並持續追蹤。", "health", "warning", "ai-health-section", `${source}:bp-warning`);
    }
    if (Number(record.systolic) >= 140 || Number(record.diastolic) >= 90) {
        addNotification("高風險血壓提醒", "高風險血壓提醒：建議儘速諮詢醫療人員。", "health", "danger", "ai-health-section", `${source}:bp-danger`);
    }
    if (Number(record.bmi) < 18.5 || Number(record.bmi) > 24) {
        addNotification("BMI 異常提醒", "BMI 異常提醒：請查看 AI 健康分析建議。", "health", "warning", "ai-health-section", `${source}:bmi`);
    }
    if (weeklyExerciseMinutesFor(record) < 150) {
        addNotification("運動不足提醒", "本週運動時間不足，建議增加有氧運動。", "health", "warning", "training-advice-section", `${source}:exercise`);
    }
    if (Number(record.sleep) < 6) {
        addNotification("睡眠不足提醒", "睡眠不足提醒：建議調整作息。", "health", "warning", "ai-health-section", `${source}:sleep`);
    }
}

function evaluateAuthorizationNotifications() {
    ensureSmartNotifications();
    const now = Date.now();
    (state.authorizations || []).forEach((auth) => {
        const id = auth.id || auth.hash || `${auth.patientId}-${auth.targetRole}`;
        if (auth.status && String(auth.status).includes("成功")) {
            addNotification("授權成功", "已成功授權資料給教練 / 營養師。", "authorization", "success", "share-section", `${id}:auth-success`);
        }
        const expiry = Date.parse(auth.expiredAt || auth.expiresAt || auth.expireAt || "");
        if (Number.isFinite(expiry) && expiry > now && expiry - now < 24 * 60 * 60 * 1000) {
            addNotification("授權即將到期", "授權即將到期，請確認是否延長授權。", "authorization", "warning", "share-section", `${id}:auth-expiring`);
        }
    });
}

function notificationTypeLabel(type) {
    return ({ health: "健康", ai: "AI", fhir: "FHIR", authorization: "授權", registration: "報名", system: "系統" })[type] || "系統";
}

function notificationIcon(item) {
    if (item.level === "danger") return "!";
    if (item.level === "warning") return "!";
    if (item.level === "success") return "✓";
    return "i";
}

function renderNotifications() {
    ensureSmartNotifications();
    evaluateAuthorizationNotifications();
    const section = document.getElementById("notification-section");
    const filter = state.notificationFilter || "all";
    const all = notificationsForCurrentAccountSmart();
    const filtered = all.filter((item) => {
        if (filter === "all") return true;
        if (filter === "unread") return !item.read;
        return item.type === filter;
    });
    const stats = {
        all: all.length,
        unread: all.filter((item) => !item.read).length,
        health: all.filter((item) => item.type === "health").length,
        system: all.filter((item) => item.type === "system").length
    };
    const body = `
        <h2 class="section-title">智慧通知中心</h2>
        <div class="notification-stat-grid">
            <article class="notification-stat-card"><span>全部通知</span><strong>${stats.all}</strong></article>
            <article class="notification-stat-card"><span>未讀通知</span><strong>${stats.unread}</strong></article>
            <article class="notification-stat-card"><span>健康警示</span><strong>${stats.health}</strong></article>
            <article class="notification-stat-card"><span>系統通知</span><strong>${stats.system}</strong></article>
        </div>
        <div class="notification-toolbar card">
            <div class="notification-filter-row">
                ${SMART_NOTIFICATION_TYPES.map((typeName) => `<button type="button" class="notification-filter-btn ${filter === typeName ? "active" : ""}" onclick="filterNotifications('${typeName}')">${({ all: "全部", unread: "未讀", health: "健康", ai: "AI", fhir: "FHIR", authorization: "授權", registration: "報名", system: "系統" })[typeName]}</button>`).join("")}
            </div>
            <div class="notification-actions">
                <button type="button" class="secondary-button" onclick="markAllNotificationsRead()">標記全部已讀</button>
                <button type="button" class="secondary-button" onclick="clearReadNotifications()">清除已讀通知</button>
                <button type="button" class="danger-button" onclick="clearAllNotifications()">清除全部通知</button>
            </div>
        </div>
        <div class="notification-card-list">
            ${filtered.map((item) => `
                <article class="notification-card ${item.level} ${item.read ? "read" : "unread"}" onclick="markNotificationRead('${escapeHTML(item.id)}')">
                    <span class="notification-card-icon ${item.level}">${notificationIcon(item)}</span>
                    <div class="notification-card-main">
                        <div class="notification-card-head">
                            <h3>${escapeHTML(item.title)}</h3>
                            <span class="notification-type-badge ${item.type}">${notificationTypeLabel(item.type)}</span>
                        </div>
                        <p>${escapeHTML(item.message)}</p>
                        <div class="notification-meta">
                            <span class="notification-level ${item.level}">${escapeHTML(item.level)}</span>
                            <span>${escapeHTML(item.createdAt)}</span>
                            <span>${item.read ? "已讀" : "未讀"}</span>
                        </div>
                    </div>
                    <button type="button" class="secondary-button notification-related-btn" onclick="event.stopPropagation(); openNotificationRelated('${escapeHTML(item.id)}')">查看相關頁面</button>
                </article>
            `).join("") || `<div class="card empty">目前沒有符合條件的通知</div>`}
        </div>`;
    if (section) section.innerHTML = body;
    setHTML("system-notification-list", filtered.map((item) => `<div class="timeline-item${item.read ? "" : " unread"}"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><small class="muted">${escapeHTML(item.createdAt)}</small></div>`).join("") || `<div class="card empty">目前沒有通知</div>`);
    updateNotificationBadge();
}

function filterNotifications(type) {
    state.notificationFilter = SMART_NOTIFICATION_TYPES.includes(type) ? type : "all";
    saveState();
    renderNotifications();
}

function markNotificationRead(id) {
    ensureSmartNotifications();
    const item = state.notifications.find((notification) => notification.id === id);
    if (item) item.read = true;
    saveState();
    renderNotifications();
}

function openNotificationRelated(id) {
    ensureSmartNotifications();
    const item = state.notifications.find((notification) => notification.id === id);
    if (!item) return;
    item.read = true;
    saveState();
    updateNotificationBadge();
    if (item.relatedSection && document.getElementById(item.relatedSection)) showSection(item.relatedSection);
    else renderNotifications();
}

function markAllNotificationsRead() {
    notificationsForCurrentAccountSmart().forEach((item) => { item.read = true; });
    saveState();
    renderNotifications();
}

function clearReadNotifications() {
    const accountId = notificationAccountId();
    state.notifications = state.notifications.filter((item) => !(item.read && (item.accountId === "all" || item.accountId === accountId)));
    saveState();
    renderNotifications();
}

function clearAllNotifications() {
    const accountId = notificationAccountId();
    state.notifications = state.notifications.filter((item) => !(item.accountId === "all" || item.accountId === accountId));
    saveState();
    renderNotifications();
}

function updateNotificationBadge() {
    const unread = notificationsForCurrentAccountSmart().filter((item) => !item.read).length;
    ["nav-notif-count", "nav-notif-count-icon"].forEach((id) => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = unread > 0 ? String(unread) : "";
        badge.classList.toggle("hidden", unread === 0);
    });
}

var updateNotifBadgeBeforeSmartNotifications = typeof updateNotifBadge === "function" ? updateNotifBadge : null;
updateNotifBadge = function smartUpdateNotifBadge() {
    if (updateNotifBadgeBeforeSmartNotifications) updateNotifBadgeBeforeSmartNotifications();
    updateNotificationBadge();
};

var baseSubmitHealthDataBeforeSmartNotifications = submitHealthData;
submitHealthData = function smartNotificationSubmitHealthData(event) {
    const before = state.healthRecords?.length || 0;
    baseSubmitHealthDataBeforeSmartNotifications(event);
    const latest = state.healthRecords?.[state.healthRecords.length - 1];
    if ((state.healthRecords?.length || 0) > before && latest) evaluateHealthNotifications(latest);
};

if (typeof generateQRCode === "function") {
    var baseGenerateQRCodeBeforeSmartNotifications = generateQRCode;
    generateQRCode = function smartNotificationGenerateQRCode(event) {
        const before = state.authorizations?.length || 0;
        baseGenerateQRCodeBeforeSmartNotifications(event);
        if ((state.authorizations?.length || 0) > before) {
            const latest = state.authorizations[state.authorizations.length - 1];
            addNotification("授權成功", "已成功授權資料給教練 / 營養師。", "authorization", "success", "share-section", `${latest?.id || latest?.hash || nowText()}:auth-success`);
        }
        evaluateAuthorizationNotifications();
    };
}

if (typeof createAuthorization === "function") {
    var baseCreateAuthorizationBeforeSmartNotifications = createAuthorization;
    createAuthorization = function smartNotificationCreateAuthorization() {
        const auth = baseCreateAuthorizationBeforeSmartNotifications();
        if (auth) addNotification("授權成功", "已成功授權資料給教練 / 營養師。", "authorization", "success", "share-section", `${auth.id || auth.hash || nowText()}:auth-success`);
        return auth;
    };
}

if (typeof validateFHIRBundle === "function") {
    var baseValidateFHIRBundleBeforeSmartNotifications = validateFHIRBundle;
    validateFHIRBundle = function smartNotificationValidateFHIRBundle() {
        const result = baseValidateFHIRBundleBeforeSmartNotifications();
        if (result?.errors === 0) addNotification("FHIR Bundle 驗證成功", "FHIR Bundle 驗證成功。", "fhir", "success", "fhir-validator-section", `${result.bundle?.id || "bundle-demo-001"}:fhir-valid`);
        return result;
    };
}

if (typeof uploadBundleToHapi === "function") {
    var baseUploadBundleToHapiBeforeSmartNotifications = uploadBundleToHapi;
    uploadBundleToHapi = async function smartNotificationUploadBundleToHapi() {
        await baseUploadBundleToHapiBeforeSmartNotifications();
        addNotification("FHIR 同步成功", "FHIR 資料已同步至 HAPI FHIR Server 模擬環境。", "fhir", "success", "fhir-validator-section", `hapi-sync:${state.fhirSyncLogs?.[0]?.id || nowText()}`);
    };
}

var baseUpdateRegistrationStatusBeforeSmartNotifications = updateRegistrationStatus;
updateRegistrationStatus = function smartNotificationUpdateRegistrationStatus(id, status) {
    baseUpdateRegistrationStatusBeforeSmartNotifications(id, status);
    addNotification("競賽報名狀態已更新", "競賽報名狀態已更新。", "registration", "info", "my-registration-section", `${id}:${status}:registration-status`);
};

if (typeof importWearableData === "function") {
    var baseImportWearableDataBeforeSmartNotifications = importWearableData;
    importWearableData = function smartNotificationImportWearableData(source) {
        const before = state.healthRecords?.length || 0;
        baseImportWearableDataBeforeSmartNotifications(source);
        const latest = state.healthRecords?.[state.healthRecords.length - 1];
        if ((state.healthRecords?.length || 0) > before && latest) evaluateHealthNotifications(latest);
    };
}

var baseLoginAccountBeforeSmartNotifications = loginAccount;
loginAccount = function smartNotificationLoginAccount(event) {
    const result = baseLoginAccountBeforeSmartNotifications(event);
    addNotification("登入成功", "系統登入成功。", "system", "success", "notification-section", `login:${notificationAccountId()}:${new Date().toISOString().slice(0, 10)}`);
    return result;
};

var baseLogoutAccountBeforeSmartNotifications = logoutAccount;
logoutAccount = function smartNotificationLogoutAccount() {
    addNotification("登出", "使用者已登出系統。", "system", "info", "notification-section", `logout:${notificationAccountId()}:${nowText()}`);
    baseLogoutAccountBeforeSmartNotifications();
};

var baseRenderAllBeforeSmartNotifications = renderAll;
renderAll = function smartNotificationRenderAll() {
    ensureSmartNotifications();
    baseRenderAllBeforeSmartNotifications();
    renderNotifications();
    updateNotificationBadge();
};

window.addNotification = addNotification;
window.evaluateHealthNotifications = evaluateHealthNotifications;
window.evaluateAuthorizationNotifications = evaluateAuthorizationNotifications;
window.renderNotifications = renderNotifications;
window.filterNotifications = filterNotifications;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.clearReadNotifications = clearReadNotifications;
window.clearAllNotifications = clearAllNotifications;
window.updateNotificationBadge = updateNotificationBadge;
window.openNotificationRelated = openNotificationRelated;
window.submitHealthData = submitHealthData;
window.generateQRCode = generateQRCode;
window.createAuthorization = createAuthorization;
window.validateFHIRBundle = validateFHIRBundle;
window.uploadBundleToHapi = uploadBundleToHapi;
window.updateRegistrationStatus = updateRegistrationStatus;
if (typeof importWearableData === "function") window.importWearableData = importWearableData;
window.loginAccount = loginAccount;
window.logoutAccount = logoutAccount;
window.renderAll = renderAll;

// AI health risk prediction.
window.rolePermissions = {
    ...(window.rolePermissions || {}),
    user: Array.from(new Set([...(window.rolePermissions?.user || []), "ai-prediction-section"])),
    coach: Array.from(new Set([...(window.rolePermissions?.coach || []), "ai-prediction-section"])),
    nutritionist: Array.from(new Set([...(window.rolePermissions?.nutritionist || []), "ai-prediction-section"])),
    admin: Array.from(new Set([...(window.rolePermissions?.admin || []), "ai-prediction-section"]))
};

if (typeof SECTION_LABELS === "object") SECTION_LABELS["ai-prediction-section"] = "AI 風險預測";

var PREDICTION_METRIC_META = {
    weight: { label: "體重", unit: "kg" },
    bmi: { label: "BMI", unit: "" },
    systolic: { label: "收縮壓", unit: "mmHg" },
    heartRate: { label: "心率", unit: "bpm" },
    exercise: { label: "運動時間", unit: "min/week" },
    sleep: { label: "睡眠", unit: "hr" },
    steps: { label: "步數", unit: "steps/day" },
    score: { label: "健康分數", unit: "" }
};

function ensurePredictionScenario() {
    state.predictionScenario = {
        exercise: Number(state.predictionScenario?.exercise ?? 150),
        sleep: Number(state.predictionScenario?.sleep ?? 7),
        diet: state.predictionScenario?.diet || "balanced",
        stress: Number(state.predictionScenario?.stress ?? 2)
    };
}

function predictionRecordsForRole(role = getCurrentRole()) {
    ensureHealthStore?.();
    const records = (state.healthRecords || []).map((item) => (typeof normalizeHealthRecord === "function" ? normalizeHealthRecord(item) : item));
    if (role === "user") return recordsByAccount(activeUserId()).map((item) => (typeof normalizeHealthRecord === "function" ? normalizeHealthRecord(item) : item));
    if (role === "admin") return records.slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const authIds = (state.authorizations || []).map((auth) => (typeof authPatientId === "function" ? authPatientId(auth) : auth.patientId)).filter(Boolean);
    const scoped = records.filter((item) => authIds.includes(item.accountId));
    if (scoped.length) return scoped.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const fallbackUser = state.accounts?.find((item) => item.role === "user");
    return records.filter((item) => item.accountId === fallbackUser?.id).sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function getPredictionDataByRole(role = getCurrentRole()) {
    const common = { role, records: predictionRecordsForRole(role), isAdmin: role === "admin" };
    if (role === "coach") return { ...common, title: "運動表現與訓練風險預測", visibleMetrics: ["heartRate", "exercise", "steps", "score"], focus: "coach" };
    if (role === "nutritionist") return { ...common, title: "營養與代謝風險預測", visibleMetrics: ["weight", "bmi", "systolic", "score"], focus: "nutritionist" };
    if (role === "admin") return { ...common, title: "匿名化健康風險統計摘要", visibleMetrics: ["bmi", "systolic", "exercise", "sleep", "score"], focus: "admin" };
    return { ...common, title: "AI 健康風險預測", visibleMetrics: ["weight", "bmi", "systolic", "heartRate", "exercise", "sleep", "score"], focus: "user" };
}

function averagePrediction(records, getter) {
    const values = records.map(getter).map(Number).filter(Number.isFinite);
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculatePredictionTrend(records, key) {
    const values = records.map((item) => Number(item[key])).filter(Number.isFinite);
    if (values.length < 2) return { delta: 0, trend: "stable" };
    const delta = values[values.length - 1] - values[0];
    return { delta, trend: Math.abs(delta) < 0.1 ? "stable" : delta > 0 ? "up" : "down" };
}

function predictionScore({ bmi, systolic, diastolic, exercise, sleep, stress, diet }) {
    let score = 100;
    if (bmi < 18.5 || bmi > 24) score -= bmi > 27 || bmi < 17 ? 18 : 10;
    if (systolic >= 140 || diastolic >= 90) score -= 22;
    else if (systolic >= 130 || diastolic >= 80) score -= 12;
    if (exercise < 150) score -= 12;
    if (sleep < 6) score -= 12;
    else if (sleep < 7) score -= 5;
    if (stress >= 4) score -= 10;
    if (diet === "poor") score -= 8;
    if (diet === "balanced") score += 3;
    return Math.max(0, Math.min(100, Math.round(score)));
}

function trendText(trend) {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
}

function runHealthPrediction() {
    ensurePredictionScenario();
    const roleData = getPredictionDataByRole(getCurrentRole());
    const records = roleData.records.slice(-7);
    if (records.length < 3) {
        return {
            insufficient: true,
            currentScore: 0,
            predictedScore: 0,
            riskDirection: "資料不足",
            summary: "目前資料不足，請至少新增 3 筆健康紀錄，系統才能產生較完整的 AI 預測。",
            predictions: {},
            risks: [],
            roleData
        };
    }

    const latest = records[records.length - 1];
    const first = records[0];
    const heightCm = Number(latest.height || state.patient?.height || 170);
    const heightM = heightCm / 100;
    const weightTrend = calculatePredictionTrend(records, "weight");
    const weightShiftBase = weightTrend.trend === "down" ? -1 : weightTrend.trend === "up" ? 1 : 0;
    const scenario = state.predictionScenario;
    const exerciseAvg = averagePrediction(records, (item) => item.exercise || item.exerciseDuration || 0);
    const exercisePredicted = Math.max(0, Number(scenario.exercise || exerciseAvg));
    const sleepAvg = averagePrediction(records, (item) => item.sleep || 0);
    const sleepPredicted = Math.max(0, Number(scenario.sleep || sleepAvg));
    const dietShift = scenario.diet === "poor" ? 0.8 : scenario.diet === "balanced" ? -0.3 : -0.6;
    const exerciseShift = exercisePredicted >= 150 ? -0.4 : 0.3;
    const predictedWeight = Math.max(30, Number(latest.weight || averagePrediction(records, (item) => item.weight)) + weightShiftBase + dietShift + exerciseShift);
    const currentBmi = Number(latest.bmi || (Number(latest.weight) / (heightM * heightM)));
    const predictedBmi = predictedWeight / (heightM * heightM);
    const highBpCount = records.filter((item) => Number(item.systolic) >= 130 || Number(item.diastolic) >= 80).length;
    const exerciseTrend = calculatePredictionTrend(records, "exercise");
    let predictedSystolic = Number(latest.systolic || averagePrediction(records, (item) => item.systolic));
    if (highBpCount >= 3) predictedSystolic += 4;
    if (exerciseTrend.trend === "up" || exercisePredicted >= 150) predictedSystolic -= 6;
    if (Number(scenario.stress) >= 4) predictedSystolic += 4;
    const predictedDiastolic = Number(latest.diastolic || averagePrediction(records, (item) => item.diastolic)) + (predictedSystolic - Number(latest.systolic || predictedSystolic)) * 0.45;
    const currentHeart = Number(latest.heartRate || latest.hr || averagePrediction(records, (item) => item.heartRate || item.hr));
    const predictedHeart = Math.max(45, currentHeart + (exercisePredicted >= 150 ? -3 : 2) + (Number(scenario.stress) >= 4 ? 3 : 0));
    const currentSteps = Number(latest.steps || averagePrediction(records, (item) => item.steps));
    const predictedSteps = Math.max(0, currentSteps + (exercisePredicted >= 150 ? 1200 : -300));
    const currentScore = predictionScore({
        bmi: currentBmi,
        systolic: Number(latest.systolic),
        diastolic: Number(latest.diastolic),
        exercise: exerciseAvg,
        sleep: sleepAvg,
        stress: Number(latest.stress || 2),
        diet: "balanced"
    });
    const predictedScore = predictionScore({
        bmi: predictedBmi,
        systolic: predictedSystolic,
        diastolic: predictedDiastolic,
        exercise: exercisePredicted,
        sleep: sleepPredicted,
        stress: Number(scenario.stress),
        diet: scenario.diet
    });
    const scoreDelta = predictedScore - currentScore;
    const riskDirection = scoreDelta >= 4 ? "改善中" : scoreDelta <= -4 ? "風險上升" : "穩定";
    const risks = [];
    if (exercisePredicted < 150) risks.push({ title: "運動不足風險", level: "medium", suggestion: "建議每週增加 30 分鐘有氧運動。", action: "安排 3 次 10 分鐘快走或飛輪訓練。" });
    if (sleepPredicted < 6) risks.push({ title: "睡眠不足風險", level: "medium", suggestion: "建議調整作息並固定睡眠時間。", action: "睡前 30 分鐘降低螢幕使用與咖啡因攝取。" });
    if (predictedSystolic >= 140 || predictedDiastolic >= 90) risks.push({ title: "高血壓風險", level: "high", suggestion: "建議儘速諮詢醫療人員並持續監測。", action: "每日固定量測血壓並記錄飲食鈉含量。" });
    else if (predictedSystolic >= 130 || predictedDiastolic >= 80) risks.push({ title: "血壓偏高風險", level: "medium", suggestion: "建議減少高鈉飲食並提升有氧運動。", action: "每週至少 150 分鐘中等強度活動。" });
    if (predictedBmi < 18.5 || predictedBmi > 24) risks.push({ title: "BMI 異常風險", level: predictedBmi > 27 || predictedBmi < 17 ? "high" : "medium", suggestion: "建議查看 AI 健康分析並調整飲食與運動。", action: "建立每週體重與飲食追蹤目標。" });
    if (!risks.length) risks.push({ title: "短期風險穩定", level: "low", suggestion: "維持目前生活型態並每週追蹤趨勢。", action: "持續記錄體重、血壓、睡眠與運動。" });

    return {
        currentScore,
        predictedScore,
        riskDirection,
        summary: `依照最近 ${records.length} 筆資料，若維持目前情境設定，預估 30 天後健康分數${riskDirection === "改善中" ? "提升" : riskDirection === "風險上升" ? "下降" : "大致穩定"}。`,
        predictions: {
            weight: { current: Number(latest.weight || 0), predicted: Number(predictedWeight.toFixed(1)), unit: "kg", trend: predictedWeight < Number(latest.weight) ? "down" : predictedWeight > Number(latest.weight) ? "up" : "stable" },
            bmi: { current: Number(currentBmi.toFixed(1)), predicted: Number(predictedBmi.toFixed(1)), unit: "", trend: predictedBmi < currentBmi ? "down" : predictedBmi > currentBmi ? "up" : "stable" },
            systolic: { current: Number(latest.systolic || 0), predicted: Math.round(predictedSystolic), unit: "mmHg", trend: predictedSystolic < Number(latest.systolic) ? "down" : predictedSystolic > Number(latest.systolic) ? "up" : "stable" },
            heartRate: { current: Math.round(currentHeart), predicted: Math.round(predictedHeart), unit: "bpm", trend: predictedHeart < currentHeart ? "down" : predictedHeart > currentHeart ? "up" : "stable" },
            exercise: { current: Math.round(exerciseAvg), predicted: Math.round(exercisePredicted), unit: "min/week", trend: exercisePredicted > exerciseAvg ? "up" : exercisePredicted < exerciseAvg ? "down" : "stable" },
            sleep: { current: Number(sleepAvg.toFixed(1)), predicted: Number(sleepPredicted.toFixed(1)), unit: "hr", trend: sleepPredicted > sleepAvg ? "up" : sleepPredicted < sleepAvg ? "down" : "stable" },
            steps: { current: Math.round(currentSteps), predicted: Math.round(predictedSteps), unit: "steps/day", trend: predictedSteps > currentSteps ? "up" : predictedSteps < currentSteps ? "down" : "stable" },
            score: { current: currentScore, predicted: predictedScore, unit: "", trend: predictedScore > currentScore ? "up" : predictedScore < currentScore ? "down" : "stable" }
        },
        risks,
        roleData,
        records,
        latest,
        first
    };
}

function predictionChangePercent(item) {
    const current = Number(item.current);
    const predicted = Number(item.predicted);
    if (!Number.isFinite(current) || current === 0) return "0%";
    return `${(((predicted - current) / Math.abs(current)) * 100).toFixed(1)}%`;
}

function ensureAIPredictionUI() {
    const role = getCurrentRole();
    if (!["user", "coach", "nutritionist", "admin"].includes(role)) return;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return;
    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="ai-prediction-section"]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-btn";
        button.dataset.section = "ai-prediction-section";
        button.textContent = "AI 風險預測";
        button.onclick = () => showSection("ai-prediction-section");
        const before = navMenu.querySelector('[data-section="ai-health-section"]') || navMenu.querySelector('[data-section="fhir-validator-section"]') || navMenu.querySelector('[data-section="notification-section"]');
        navMenu.insertBefore(button, before || null);
    }
    if (!document.getElementById("ai-prediction-section")) {
        const section = document.createElement("section");
        section.id = "ai-prediction-section";
        section.className = "content-section";
        const before = document.getElementById("ai-health-section") || document.getElementById("fhir-validator-section") || document.getElementById("notification-section");
        pageContent.insertBefore(section, before || null);
    }
}

function renderHealthPrediction() {
    ensureAIPredictionUI();
    const section = document.getElementById("ai-prediction-section");
    if (!section) return;
    const result = runHealthPrediction();
    const roleData = result.roleData || getPredictionDataByRole(getCurrentRole());
    if (result.insufficient) {
        section.innerHTML = `
            <div class="section-heading"><h2>${escapeHTML(roleData.title)}</h2><p>使用 localStorage 健康紀錄模擬未來 30 天健康趨勢。</p></div>
            <article class="card prediction-empty-state">
                <h3>目前資料不足</h3>
                <p>目前資料不足，請至少新增 3 筆健康紀錄，系統才能產生較完整的 AI 預測。</p>
                <button type="button" class="primary-button" onclick="showSection('health-input-section')">新增健康資料</button>
            </article>`;
        return;
    }
    const metrics = roleData.visibleMetrics.filter((key) => result.predictions[key]);
    const adminNote = roleData.isAdmin ? `<article class="card prediction-admin-note"><h3>匿名化統計摘要</h3><p>目前以 ${roleData.records.length} 筆健康紀錄進行匿名化彙整，僅顯示群體趨勢，不顯示個人明細。</p></article>` : "";
    section.innerHTML = `
        <div class="section-heading"><h2>${escapeHTML(roleData.title)}</h2><p>根據最近健康資料，以 JavaScript 規則引擎模擬未來 30 天健康風險與趨勢。</p></div>
        ${adminNote}
        <div class="prediction-overview">
            <article class="prediction-score-card"><span>目前健康分數</span><strong>${result.currentScore}</strong><small>Current Score</small></article>
            <article class="prediction-score-card predicted"><span>30 天後預測分數</span><strong>${result.predictedScore}</strong><small>Predicted Score</small></article>
            <article class="card prediction-direction-card"><span>趨勢方向</span><strong class="${result.riskDirection === "改善中" ? "prediction-trend-up" : result.riskDirection === "風險上升" ? "prediction-trend-down" : "prediction-trend-stable"}">${escapeHTML(result.riskDirection)}</strong><p>${escapeHTML(result.summary)}</p></article>
        </div>
        <div class="prediction-grid">
            ${metrics.map((key) => {
                const item = result.predictions[key];
                const meta = PREDICTION_METRIC_META[key] || { label: key, unit: item.unit || "" };
                return `<article class="prediction-card ${item.trend}">
                    <div class="prediction-card-head"><span>${escapeHTML(meta.label)}</span><strong class="prediction-trend-${item.trend}">${trendText(item.trend)}</strong></div>
                    <div class="prediction-values"><div><small>目前</small><b>${escapeHTML(String(item.current))}</b></div><div><small>30 天後</small><b>${escapeHTML(String(item.predicted))}</b></div></div>
                    <p>${escapeHTML(item.unit || meta.unit || "")}</p>
                    <small class="prediction-change">變化 ${predictionChangePercent(item)}</small>
                </article>`;
            }).join("")}
        </div>
        <article class="card prediction-chart-card">
            <div class="fhir-card-title-row"><h3>30 天預測圖表</h3><span class="hapi-mode-badge">Rule-based AI</span></div>
            <div class="prediction-chart-wrap"><canvas id="prediction-chart" height="280" role="img" aria-label="30 天健康風險預測圖表"></canvas></div>
        </article>
        <div class="prediction-bottom-grid">
            <article class="card prediction-risk-list">
                <h3>風險清單與 AI 建議</h3>
                ${result.risks.map((risk) => `<div class="prediction-risk-item ${escapeHTML(risk.level)}"><div><strong>${escapeHTML(risk.title)}</strong><span>${escapeHTML(risk.level)}</span></div><p>${escapeHTML(risk.suggestion)}</p><small>改善行動：${escapeHTML(risk.action || "持續追蹤並調整生活習慣。")}</small></div>`).join("")}
            </article>
            ${roleData.isAdmin ? "" : predictionScenarioHTML()}
        </div>
        <article class="card prediction-fhir-card">
            <h3>FHIR 整合說明</h3>
            <p>本預測基於 FHIR Observation 中的：</p>
            <ul><li>Body Weight</li><li>BMI</li><li>Blood Pressure</li><li>Heart Rate</li><li>Exercise Duration</li><li>Sleep Duration</li></ul>
        </article>`;
    renderPredictionChart(result);
}

function predictionScenarioHTML() {
    ensurePredictionScenario();
    const scenario = state.predictionScenario;
    return `<article class="card prediction-scenario-card">
        <h3>情境模擬器</h3>
        <div class="form-group"><label for="prediction-exercise">每週運動時間</label><input id="prediction-exercise" type="number" min="0" max="600" value="${escapeHTML(String(scenario.exercise))}" /></div>
        <div class="form-group"><label for="prediction-sleep">睡眠時數</label><input id="prediction-sleep" type="number" min="0" max="12" step="0.1" value="${escapeHTML(String(scenario.sleep))}" /></div>
        <div class="form-group"><label for="prediction-diet">飲食狀態</label><select id="prediction-diet"><option value="balanced" ${scenario.diet === "balanced" ? "selected" : ""}>均衡</option><option value="good" ${scenario.diet === "good" ? "selected" : ""}>改善中</option><option value="poor" ${scenario.diet === "poor" ? "selected" : ""}>高油高鈉</option></select></div>
        <div class="form-group"><label for="prediction-stress">壓力程度</label><input id="prediction-stress" type="range" min="1" max="5" value="${escapeHTML(String(scenario.stress))}" /></div>
        <button type="button" class="primary-button" onclick="updatePredictionScenario()">重新預測</button>
    </article>`;
}

function renderPredictionChart(prediction = runHealthPrediction()) {
    if (prediction.insufficient || typeof Chart === "undefined") return;
    const canvas = document.getElementById("prediction-chart");
    if (!canvas) return;
    const days = [0, 5, 10, 15, 20, 25, 30];
    const interpolate = (current, predicted) => days.map((day) => Number((Number(current) + (Number(predicted) - Number(current)) * (day / 30)).toFixed(1)));
    if (typeof destroyChart === "function") destroyChart("prediction-chart");
    _charts["prediction-chart"] = new Chart(canvas, {
        type: "line",
        data: {
            labels: days.map((day) => `${day}天`),
            datasets: [
                { label: "健康分數", data: interpolate(prediction.currentScore, prediction.predictedScore), borderColor: "#0f766e", backgroundColor: "rgba(15,118,110,0.12)", tension: 0.35 },
                { label: "BMI", data: interpolate(prediction.predictions.bmi?.current || 0, prediction.predictions.bmi?.predicted || 0), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.12)", tension: 0.35 },
                { label: "血壓", data: interpolate(prediction.predictions.systolic?.current || 0, prediction.predictions.systolic?.predicted || 0), borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,0.1)", tension: 0.35 },
                { label: "運動時間", data: interpolate(prediction.predictions.exercise?.current || 0, prediction.predictions.exercise?.predicted || 0), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.12)", tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { beginAtZero: false, grid: { color: "rgba(148,163,184,0.25)" } }, x: { grid: { display: false } } }
        }
    });
}

function updatePredictionScenario() {
    ensurePredictionScenario();
    state.predictionScenario = {
        exercise: Number(document.getElementById("prediction-exercise")?.value || state.predictionScenario.exercise),
        sleep: Number(document.getElementById("prediction-sleep")?.value || state.predictionScenario.sleep),
        diet: document.getElementById("prediction-diet")?.value || state.predictionScenario.diet,
        stress: Number(document.getElementById("prediction-stress")?.value || state.predictionScenario.stress)
    };
    saveState();
    renderHealthPrediction();
    if (typeof addNotification === "function") addNotification("AI 風險預測已更新", "情境模擬器已重新計算 30 天健康風險。", "ai", "info", "ai-prediction-section", `prediction:${nowText()}`);
}

var baseRenderAllBeforePrediction = renderAll;
renderAll = function predictionRenderAll() {
    ensureAIPredictionUI();
    baseRenderAllBeforePrediction();
    renderHealthPrediction();
};

window.runHealthPrediction = runHealthPrediction;
window.renderHealthPrediction = renderHealthPrediction;
window.renderPredictionChart = renderPredictionChart;
window.updatePredictionScenario = updatePredictionScenario;
window.calculatePredictionTrend = calculatePredictionTrend;
window.getPredictionDataByRole = getPredictionDataByRole;
window.renderAll = renderAll;

// Health report download and print.
if (typeof SECTION_LABELS === "object") SECTION_LABELS["health-report-section"] = "健康報告下載";

function reportValue(value, fallback = "--") {
    if (value === undefined || value === null || value === "") return fallback;
    return String(value);
}

function reportMetric(label, value, unit = "") {
    return `<article class="report-metric-card"><span>${escapeHTML(label)}</span><strong>${escapeHTML(reportValue(value))}</strong><small>${escapeHTML(unit)}</small></article>`;
}

function reportTableRow(label, value) {
    return `<tr><th>${escapeHTML(label)}</th><td>${escapeHTML(reportValue(value))}</td></tr>`;
}

function getReportData() {
    ensureHealthStore?.();
    const account = currentAccount?.() || state.accounts?.find((item) => item.id === activeUserId()) || {};
    const records = recordsByAccount(activeUserId()).map((item) => (typeof normalizeHealthRecord === "function" ? normalizeHealthRecord(item) : item));
    const latest = records[records.length - 1] || null;
    const analysis = typeof runAIAnalysis === "function" ? runAIAnalysis(activeUserId()) : {};
    const fhir = typeof generateFHIRBundle === "function" ? generateFHIRBundle(activeUserId()) : { resourceType: "Bundle", entry: [] };
    let fhirValidation = { status: "Not checked", passed: 0, warnings: 0, errors: 0 };
    try {
        if (typeof validateFHIRBundle === "function") {
            const result = validateFHIRBundle();
            fhirValidation = { status: result.status, passed: result.passed, warnings: result.warnings, errors: result.errors };
        }
    } catch (error) {
        fhirValidation = { status: "Unavailable", passed: 0, warnings: 0, errors: 0 };
    }
    const auths = (state.authorizations || []).filter((auth) => {
        const patientId = typeof authPatientId === "function" ? authPatientId(auth) : auth.patientId;
        return patientId === activeUserId() || auth.patientId === activeUserId();
    });
    const observationCount = (fhir.entry || []).filter((entry) => entry.resource?.resourceType === "Observation").length;
    return {
        account,
        records,
        latest,
        analysis,
        fhir,
        fhirValidation,
        auths,
        generatedAt: nowText(),
        score: analysis.score ?? "--",
        riskLevel: analysis.riskLevel || analysis.risk || "--",
        observationCount
    };
}

function generateHealthReport() {
    const data = getReportData();
    state.generatedHealthReport = {
        generatedAt: data.generatedAt,
        score: data.score,
        riskLevel: data.riskLevel,
        recordCount: data.records.length
    };
    saveState();
    renderHealthReport();
    showToast("健康報告已產生");
    return data;
}

function ensureHealthReportDownloadSection() {
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return null;
    let section = document.getElementById("health-report-section");
    if (!section) {
        section = document.createElement("section");
        section.id = "health-report-section";
        section.className = "content-section";
        const before = document.getElementById("fhir-viewer-section") || document.getElementById("ai-prediction-section") || document.getElementById("notification-section");
        pageContent.insertBefore(section, before || null);
    }
    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="health-report-section"]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-btn";
        button.dataset.section = "health-report-section";
        button.textContent = "健康報告下載";
        button.onclick = () => showSection("health-report-section");
        const before = navMenu.querySelector('[data-section="ai-prediction-section"]') || navMenu.querySelector('[data-section="fhir-validator-section"]') || navMenu.querySelector('[data-section="notification-section"]');
        navMenu.insertBefore(button, before || null);
    }
    return section;
}

function renderHealthReport() {
    const section = ensureHealthReportDownloadSection();
    if (!section) return;
    const data = getReportData();
    if (!data.latest) {
        section.innerHTML = `
            <div class="section-heading report-no-print"><h2>健康報告下載</h2><p>產生可列印與可另存 PDF 的個人健康報告。</p></div>
            <article class="card report-section report-empty-state">
                <h3>尚無健康資料</h3>
                <p>尚無健康資料，請先新增健康紀錄後再產生報告。</p>
                <button type="button" class="primary-button" onclick="showSection('health-input-section')">新增健康資料</button>
            </article>`;
        return;
    }
    const account = data.account;
    const patient = state.patient || {};
    const latest = data.latest;
    const analysis = data.analysis;
    const fhir = data.fhir;
    const patientResource = (fhir.entry || []).map((entry) => entry.resource).find((resource) => resource?.resourceType === "Patient");
    const authRows = data.auths.map((auth) => `
        <tr>
            <td>${escapeHTML(auth.targetName || auth.targetRole || "--")}</td>
            <td>${escapeHTML(Array.isArray(auth.dataScopes) ? auth.dataScopes.join("、") : auth.dataScopes || "--")}</td>
            <td>${escapeHTML(auth.expiredAt || auth.duration || "--")}</td>
            <td>${escapeHTML(auth.hash || "--")}</td>
        </tr>`).join("") || `<tr><td colspan="4">尚無授權紀錄。</td></tr>`;
    const riskTags = Array.isArray(analysis.riskTags) ? analysis.riskTags : [];
    section.innerHTML = `
        <div class="section-heading report-no-print"><h2>健康報告下載</h2><p>產生、列印、另存 PDF，或複製 AI 健康摘要。</p></div>
        <div class="report-toolbar report-no-print">
            <button type="button" class="primary-button" onclick="generateHealthReport()">產生健康報告</button>
            <button type="button" class="secondary-button" onclick="printHealthReport()">列印報告</button>
            <button type="button" class="secondary-button" onclick="downloadHealthReportPDF()">下載 PDF</button>
            <button type="button" class="secondary-button" onclick="copyHealthReportSummary()">複製報告摘要</button>
        </div>
        <div id="health-report-print-area" class="health-report-document">
            <header class="report-cover">
                <div>
                    <span>AI Health Report</span>
                    <h1>AI 健康追蹤與運動管理平台</h1>
                    <p>使用者姓名：${escapeHTML(account.name || patient.name || "--")}</p>
                    <p>報告產生時間：${escapeHTML(data.generatedAt)}</p>
                </div>
                <div class="report-cover-score">
                    <span>健康分數</span>
                    <strong>${escapeHTML(String(data.score))}</strong>
                    <small>風險等級：${escapeHTML(data.riskLevel)}</small>
                </div>
            </header>

            <section class="report-section">
                <h2>個人資料</h2>
                <div class="report-grid">
                    ${reportMetric("姓名", account.name || patient.name)}
                    ${reportMetric("性別", patient.gender || patientResource?.gender)}
                    ${reportMetric("生日", patient.birthday || patient.birthDate || patientResource?.birthDate)}
                    ${reportMetric("身高", latest.height || patient.height || getUserHeight?.(), "cm")}
                    ${reportMetric("目標體重", patient.targetWeight, "kg")}
                </div>
            </section>

            <section class="report-section">
                <h2>最新健康資料</h2>
                <div class="report-grid">
                    ${reportMetric("血壓", `${latest.systolic}/${latest.diastolic}`, "mmHg")}
                    ${reportMetric("體重", latest.weight, "kg")}
                    ${reportMetric("BMI", latest.bmi)}
                    ${reportMetric("心率", latest.heartRate || latest.hr, "bpm")}
                    ${reportMetric("步數", Number(latest.steps || 0).toLocaleString(), "steps")}
                    ${reportMetric("運動時間", latest.exercise || latest.exerciseDuration, "min")}
                    ${reportMetric("睡眠", latest.sleep, "hr")}
                    ${reportMetric("飲水量", latest.water, "ml")}
                    ${reportMetric("壓力程度", latest.stress, "/5")}
                </div>
            </section>

            <section class="report-section">
                <h2>AI 健康分析</h2>
                <table class="report-table"><tbody>
                    ${reportTableRow("健康分數", `${data.score}/100`)}
                    ${reportTableRow("風險標籤", riskTags.length ? riskTags.join("、") : "目前無明顯風險")}
                    ${reportTableRow("AI 摘要", analysis.summary)}
                    ${reportTableRow("飲食建議", analysis.dietAdvice)}
                    ${reportTableRow("運動建議", analysis.exerciseAdvice)}
                    ${reportTableRow("睡眠建議", analysis.sleepAdvice)}
                    ${reportTableRow("就醫提醒", analysis.medicalAdvice)}
                    ${reportTableRow("生活習慣建議", analysis.lifestyleAdvice)}
                </tbody></table>
            </section>

            <section class="report-section">
                <h2>FHIR 摘要</h2>
                <div class="report-grid">
                    ${reportMetric("Patient", patientResource?.id || account.id)}
                    ${reportMetric("Observation 數量", data.observationCount)}
                    ${reportMetric("Bundle 狀態", fhir.resourceType === "Bundle" ? "Bundle / " + (fhir.type || "--") : "Unavailable")}
                    ${reportMetric("FHIR 驗證結果", `${data.fhirValidation.status} (${data.fhirValidation.errors} errors)`)}
                </div>
            </section>

            <section class="report-section">
                <h2>授權紀錄</h2>
                <div class="health-record-table-wrapper">
                    <table class="report-table">
                        <thead><tr><th>授權對象</th><th>授權範圍</th><th>授權期限</th><th>Hash</th></tr></thead>
                        <tbody>${authRows}</tbody>
                    </table>
                </div>
            </section>

            <section class="report-disclaimer">
                <h2>報告聲明</h2>
                <p>本報告為健康管理與競賽展示用途，非正式醫療診斷。如有身體不適，請諮詢專業醫療人員。</p>
            </section>
        </div>`;
}

function printHealthReport() {
    renderHealthReport();
    setTimeout(() => window.print(), 100);
}

function downloadHealthReportPDF() {
    renderHealthReport();
    showToast("請在列印視窗選擇「另存為 PDF」。");
    setTimeout(() => window.print(), 120);
}

function copyHealthReportSummary() {
    const data = getReportData();
    if (!data.latest) {
        showToast("尚無健康資料可複製");
        return;
    }
    const latest = data.latest;
    const text = [
        `AI 健康報告摘要`,
        `使用者：${data.account.name || state.patient?.name || "--"}`,
        `產生時間：${data.generatedAt}`,
        `健康分數：${data.score}`,
        `風險等級：${data.riskLevel}`,
        `血壓：${latest.systolic}/${latest.diastolic} mmHg`,
        `體重：${latest.weight} kg`,
        `BMI：${latest.bmi}`,
        `心率：${latest.heartRate || latest.hr} bpm`,
        `步數：${latest.steps}`,
        `AI 摘要：${data.analysis.summary || "--"}`
    ].join("\n");
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast("報告摘要已複製")).catch(() => showToast("瀏覽器限制剪貼簿，請手動複製"));
    } else {
        showToast("瀏覽器不支援剪貼簿 API");
    }
}

var baseRenderAllBeforeReportDownload = renderAll;
renderAll = function healthReportDownloadRenderAll() {
    ensureHealthReportDownloadSection();
    baseRenderAllBeforeReportDownload();
    renderHealthReport();
};

window.getReportData = getReportData;
window.generateHealthReport = generateHealthReport;
window.renderHealthReport = renderHealthReport;
window.printHealthReport = printHealthReport;
window.downloadHealthReportPDF = downloadHealthReportPDF;
window.copyHealthReportSummary = copyHealthReportSummary;
window.renderAll = renderAll;

// AI Health Assistant.
const AI_ASSISTANT_QUICK_QUESTIONS = [
    "我的 BMI 正常嗎？",
    "今天血壓正常嗎？",
    "我運動量夠嗎？",
    "幫我解讀 AI 分析",
    "FHIR 是什麼？",
    "Observation 是什麼？",
    "教練可以看到什麼資料？",
    "營養師可以看到什麼資料？",
    "我可以怎麼改善健康？"
];

function ensureAssistantMessages() {
    if (!Array.isArray(state.assistantMessages)) state.assistantMessages = [];
}

function assistantTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getLatestHealthDataForAssistant() {
    const accountId = typeof activeUserId === "function" ? activeUserId() : currentAccount()?.id;
    let records = [];
    if (typeof recordsByAccount === "function" && accountId) records = recordsByAccount(accountId);
    if (!records.length) records = state.history || state.healthRecords || [];
    return records.map((item) => (typeof normalizeHealthRecord === "function" ? normalizeHealthRecord(item) : item)).filter(Boolean).slice(-1)[0] || null;
}

function getBMIStatus(bmiValue) {
    const bmi = Number(bmiValue ?? getLatestHealthDataForAssistant()?.bmi);
    if (!Number.isFinite(bmi)) return "無資料";
    if (bmi < 18.5) return "過輕";
    if (bmi < 24) return "正常";
    if (bmi < 27) return "過重";
    return "肥胖";
}

function getBloodPressureStatus(record = getLatestHealthDataForAssistant()) {
    if (!record) return "無資料";
    const systolic = Number(record.systolic);
    const diastolic = Number(record.diastolic);
    if (systolic >= 140 || diastolic >= 90) return "高風險";
    if (systolic >= 130 || diastolic >= 80) return "偏高";
    return "正常";
}

function getExerciseStatus() {
    const accountId = typeof activeUserId === "function" ? activeUserId() : currentAccount()?.id;
    let records = [];
    if (typeof recordsByAccount === "function" && accountId) records = recordsByAccount(accountId);
    if (!records.length) records = state.history || state.healthRecords || [];
    const weekly = records.slice(-7).reduce((sum, item) => sum + Number(item.exercise || item.exerciseDuration || 0), 0);
    return { weekly, status: weekly >= 150 ? "達標" : "未達標" };
}

function assistantNoHealthDataText() {
    return "目前尚無健康紀錄，請先新增健康資料後，我才能幫你分析。";
}

function generateAssistantReply(question) {
    const q = String(question || "").toLowerCase();
    const latest = getLatestHealthDataForAssistant();
    const hasHealthIntent = /bmi|血壓|運動|健康|分析|改善|睡眠|心率|體重/.test(q);
    if (!latest && hasHealthIntent) return assistantNoHealthDataText();

    if (q.includes("bmi")) {
        const bmi = Number(latest.bmi || 0).toFixed(1);
        return `你的最新 BMI 是 ${bmi}。\n狀態為：${getBMIStatus(bmi)}。\nBMI 來源為：體重 + 身高資料。`;
    }

    if (q.includes("血壓")) {
        const status = getBloodPressureStatus(latest);
        const advice = status === "正常"
            ? "建議維持目前飲食、運動與睡眠習慣。"
            : status === "偏高"
                ? "建議減少高鈉飲食、規律有氧運動並持續追蹤。"
                : "建議儘速諮詢醫療人員，並每日固定量測血壓。";
        return `你的最新血壓為 ${latest.systolic} / ${latest.diastolic} mmHg。\n狀態為：${status}。\n建議：${advice}`;
    }

    if (q.includes("運動") || q.includes("運動量")) {
        const exercise = getExerciseStatus();
        return `你最近一週運動時間為 ${exercise.weekly} 分鐘。\n建議目標為每週 150 分鐘。\n目前狀態為：${exercise.status}。`;
    }

    if (q.includes("ai") || q.includes("分析") || q.includes("解讀")) {
        const analysis = typeof runAIAnalysis === "function" ? runAIAnalysis(typeof activeUserId === "function" ? activeUserId() : undefined) : {};
        const risks = Array.isArray(analysis.riskTags) && analysis.riskTags.length ? analysis.riskTags.join("、") : "目前無明顯風險";
        return `目前健康分數：${analysis.score ?? "--"} / 100\n風險等級：${analysis.riskLevel || analysis.risk || "--"}\n主要風險：${risks}\n建議：${analysis.summary || analysis.healthAdvice || "請持續新增健康資料以取得更完整分析。"}`;
    }

    if (q.includes("fhir")) {
        const bundle = typeof generateFHIRBundle === "function" ? generateFHIRBundle(typeof activeUserId === "function" ? activeUserId() : undefined) : null;
        const count = bundle?.entry?.length || 0;
        return `FHIR 是一種醫療資料交換標準。\n本平台使用 Patient、Observation、Practitioner、Bundle 管理健康資料。\n目前你的 FHIR Bundle 約包含 ${count} 筆 entry。`;
    }

    if (q.includes("observation")) {
        return "Observation 代表量測資料，例如血壓、體重、BMI、心率、步數與睡眠。";
    }

    if (q.includes("教練")) {
        return "健身教練只能查看使用者授權的運動資料，例如步數、運動時間、心率與熱量消耗。\n教練不能查看 FHIR JSON、完整健康資料或管理資料。";
    }

    if (q.includes("營養師") || q.includes("營養")) {
        return "營養師只能查看使用者授權的營養與健康指標，例如 BMI、體重、血壓與飲食建議。\n營養師不能查看完整運動訓練紀錄、FHIR JSON 或管理資料。";
    }

    if (q.includes("改善") || q.includes("建議") || q.includes("怎麼")) {
        const analysis = typeof runAIAnalysis === "function" ? runAIAnalysis(typeof activeUserId === "function" ? activeUserId() : undefined) : {};
        return [
            `飲食建議：${analysis.dietAdvice || "維持均衡飲食，減少高油高鈉。"}`,
            `運動建議：${analysis.exerciseAdvice || "逐步增加每週有氧運動時間。"}`,
            `睡眠建議：${analysis.sleepAdvice || "維持規律作息與足夠睡眠。"}`,
            `就醫提醒：${analysis.medicalAdvice || "若有不適請諮詢專業醫療人員。"}`,
            `生活習慣建議：${analysis.lifestyleAdvice || "持續追蹤健康資料並調整生活習慣。"}`
        ].join("\n");
    }

    if (q.includes("授權") || q.includes("權限")) {
        const count = Array.isArray(state.authorizations) ? state.authorizations.length : 0;
        return `目前系統共有 ${count} 筆授權紀錄。\n你可以透過授權分享功能決定教練或營養師可查看的資料範圍。`;
    }

    return "我目前可以協助你解讀：\nBMI、血壓、運動量、AI 分析、FHIR、Observation、授權權限與健康改善建議。";
}

function assistantShellHTML() {
    return `
        <button type="button" class="ai-assistant-button" id="ai-assistant-button" onclick="toggleAssistantPanel()">AI 助理</button>
        <section class="ai-assistant-panel" id="ai-assistant-panel" aria-live="polite">
            <div class="ai-assistant-header">
                <div><h2>AI 健康助理</h2><p>可協助解讀健康資料、FHIR、AI 分析與授權權限。</p></div>
                <button type="button" onclick="toggleAssistantPanel(false)" aria-label="關閉 AI 健康助理">×</button>
            </div>
            <div class="ai-assistant-messages" id="ai-assistant-messages"></div>
            <div class="ai-assistant-quick-actions">
                ${AI_ASSISTANT_QUICK_QUESTIONS.map((item) => `<button type="button" onclick="sendAssistantMessage('${escapeHTML(item)}')">${escapeHTML(item)}</button>`).join("")}
            </div>
            <div class="ai-assistant-footer">
                <div class="ai-assistant-input">
                    <input id="ai-assistant-input" type="text" placeholder="輸入你的健康問題..." onkeydown="if(event.key==='Enter') sendAssistantMessage()" />
                    <button type="button" onclick="sendAssistantMessage()">送出</button>
                </div>
                <button type="button" class="ai-assistant-clear" onclick="clearAssistantMessages()">清除對話</button>
            </div>
        </section>`;
}

function initAIHealthAssistant() {
    ensureAssistantMessages();
    if (!document.getElementById("ai-assistant-root")) {
        const root = document.createElement("div");
        root.id = "ai-assistant-root";
        root.innerHTML = assistantShellHTML();
        document.body.appendChild(root);
    }
    renderAssistantMessages();
}

function toggleAssistantPanel(force) {
    initAIHealthAssistant();
    const panel = document.getElementById("ai-assistant-panel");
    const button = document.getElementById("ai-assistant-button");
    const open = typeof force === "boolean" ? force : !panel?.classList.contains("open");
    panel?.classList.toggle("open", open);
    button?.classList.toggle("active", open);
    if (open) {
        renderAssistantMessages();
        setTimeout(() => document.getElementById("ai-assistant-input")?.focus(), 80);
    }
}

function sendAssistantMessage(presetQuestion) {
    initAIHealthAssistant();
    const input = document.getElementById("ai-assistant-input");
    const question = String(presetQuestion || input?.value || "").trim();
    if (!question) return;
    ensureAssistantMessages();
    state.assistantMessages.push({ role: "user", text: question, time: assistantTime() });
    state.assistantMessages.push({ role: "assistant", text: generateAssistantReply(question), time: assistantTime() });
    if (input) input.value = "";
    saveState();
    renderAssistantMessages();
}

function renderAssistantMessages() {
    ensureAssistantMessages();
    const box = document.getElementById("ai-assistant-messages");
    if (!box) return;
    const messages = state.assistantMessages.length
        ? state.assistantMessages
        : [{ role: "assistant", text: "你好，我是 AI 健康助理。你可以問我 BMI、血壓、運動量、AI 分析、FHIR 或授權權限。", time: assistantTime() }];
    box.innerHTML = messages.map((item) => `
        <div class="ai-message ${escapeHTML(item.role)}">
            <p>${escapeHTML(item.text).replace(/\n/g, "<br>")}</p>
            <small>${escapeHTML(item.time || "")}</small>
        </div>
    `).join("");
    box.scrollTop = box.scrollHeight;
}

function clearAssistantMessages() {
    state.assistantMessages = [];
    saveState();
    renderAssistantMessages();
}

var baseRenderAllBeforeAssistant = renderAll;
renderAll = function assistantRenderAll() {
    baseRenderAllBeforeAssistant();
    initAIHealthAssistant();
};

window.initAIHealthAssistant = initAIHealthAssistant;
window.toggleAssistantPanel = toggleAssistantPanel;
window.sendAssistantMessage = sendAssistantMessage;
window.generateAssistantReply = generateAssistantReply;
window.renderAssistantMessages = renderAssistantMessages;
window.clearAssistantMessages = clearAssistantMessages;
window.getLatestHealthDataForAssistant = getLatestHealthDataForAssistant;
window.getBMIStatus = getBMIStatus;
window.getBloodPressureStatus = getBloodPressureStatus;
window.getExerciseStatus = getExerciseStatus;
window.renderAll = renderAll;

window.addEventListener("load", initAIHealthAssistant);
window.addEventListener("DOMContentLoaded", initAIHealthAssistant);

// Blockchain authorization ledger upgrade.
if (typeof SECTION_LABELS === "object") SECTION_LABELS["blockchain-section"] = "授權存證中心";

function shortHash(hash) {
    const value = String(hash || "--");
    if (value.length <= 18) return value;
    return `${value.slice(0, 8)}...${value.slice(-8)}`;
}

function blockchainCanonicalData(data) {
    return [
        data.authId || "",
        data.from || "",
        data.to || "",
        Array.isArray(data.dataScope) ? data.dataScope.join("|") : data.dataScope || "",
        data.timestamp || "",
        data.previousHash || ""
    ].join("::");
}

function generateBlockchainHash(data) {
    const raw = blockchainCanonicalData(data);
    let seed = typeof hashText === "function" ? hashText(raw) : 0;
    if (typeof seed === "string") seed = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const chunks = [];
    for (let i = 0; i < 8; i += 1) {
        const part = typeof hashText === "function" ? hashText(`${raw}:${seed}:${i}`) : Math.abs(Math.sin(seed + i) * 0xffffffff);
        chunks.push(Math.abs(Number(part)).toString(16).padStart(8, "0").slice(0, 8));
    }
    return `0x${chunks.join("").toUpperCase()}`;
}

function normalizeBlockchainLog(log, index = 0) {
    const previous = index < (state.blockchainLogs || []).length - 1 ? state.blockchainLogs[index + 1] : null;
    const legacyHash = log.txHash || log.hash || "0xGENESIS";
    return {
        id: log.id || `BC-${String(index + 1).padStart(3, "0")}`,
        txHash: legacyHash,
        blockHeight: Number(log.blockHeight || 102938 + ((state.blockchainLogs || []).length - index)),
        previousHash: log.previousHash || previous?.txHash || previous?.hash || "0xGENESIS",
        from: log.from || log.source || "System",
        to: log.to || "--",
        dataScope: Array.isArray(log.dataScope) ? log.dataScope : (log.dataScope ? [log.dataScope] : []),
        authId: log.authId || "",
        timestamp: log.timestamp || log.createdAt || nowText(),
        status: log.status || "Success",
        eventType: log.eventType || log.event || "授權建立",
        verifyStatus: log.verifyStatus || "未驗證"
    };
}

function ensureBlockchainLogs() {
    if (!Array.isArray(state.blockchainLogs)) state.blockchainLogs = [];
    state.blockchainLogs = state.blockchainLogs.map(normalizeBlockchainLog);
}

function addBlockchainEvent(eventData) {
    ensureBlockchainLogs();
    const previous = state.blockchainLogs[0];
    const timestamp = eventData.timestamp || nowText();
    const log = {
        id: eventData.id || (typeof uid === "function" ? uid("BC") : `BC-${Date.now()}`),
        blockHeight: Number(eventData.blockHeight || (previous?.blockHeight ? previous.blockHeight + 1 : 102938)),
        previousHash: eventData.previousHash || previous?.txHash || "0xGENESIS",
        from: eventData.from || "System",
        to: eventData.to || "--",
        dataScope: Array.isArray(eventData.dataScope) ? eventData.dataScope : (eventData.dataScope ? [eventData.dataScope] : []),
        authId: eventData.authId || "",
        timestamp,
        status: eventData.status || "Success",
        eventType: eventData.eventType || "授權建立",
        verifyStatus: eventData.verifyStatus || "未驗證"
    };
    log.txHash = eventData.txHash || generateBlockchainHash(log);
    state.blockchainLogs.unshift(log);
    saveState();
    return log;
}

function addBlockchainLog(source, event, token) {
    return addBlockchainEvent({
        from: source,
        to: event,
        dataScope: [],
        authId: token || "",
        eventType: event || "授權建立",
        status: "Success"
    });
}

function blockchainLogById(logId) {
    ensureBlockchainLogs();
    return state.blockchainLogs.find((log) => log.id === logId);
}

function renderBlockchainOverview() {
    ensureBlockchainLogs();
    const validAuths = (state.authorizations || []).filter((auth) => typeof isAuthorizationValid === "function" ? isAuthorizationValid(auth) : auth.status !== "已撤回");
    const latest = state.blockchainLogs[0];
    const verified = state.blockchainLogs.filter((log) => log.verifyStatus === "驗證通過").length;
    return `
        <div class="blockchain-overview-grid">
            <article class="blockchain-stat-card"><span>授權紀錄數</span><strong>${state.authorizations?.length || 0}</strong></article>
            <article class="blockchain-stat-card"><span>有效授權數</span><strong>${validAuths.length}</strong></article>
            <article class="blockchain-stat-card"><span>最近 Hash</span><strong class="blockchain-hash-box">${escapeHTML(shortHash(latest?.txHash))}</strong></article>
            <article class="blockchain-stat-card"><span>最近區塊高度</span><strong>${escapeHTML(String(latest?.blockHeight || "--"))}</strong></article>
            <article class="blockchain-stat-card"><span>驗證狀態</span><strong>${verified}/${state.blockchainLogs.length}</strong></article>
        </div>`;
}

function renderBlockchainTimeline() {
    ensureBlockchainLogs();
    return `
        <article class="card blockchain-timeline-card">
            <h3>區塊鏈事件時間軸</h3>
            <div class="blockchain-timeline">
                ${state.blockchainLogs.slice(0, 12).map((log) => `
                    <div class="blockchain-event ${escapeHTML(log.status.toLowerCase())}">
                        <span></span>
                        <div><strong>${escapeHTML(log.eventType)}</strong><p>${escapeHTML(log.from)} → ${escapeHTML(log.to)}</p><small>${escapeHTML(log.timestamp)} · Block ${escapeHTML(String(log.blockHeight))}</small></div>
                    </div>
                `).join("") || `<div class="empty">尚無區塊鏈事件。</div>`}
            </div>
        </article>`;
}

function blockchainVerifyBadge(status) {
    const cls = status === "驗證通過" ? "success" : status === "資料可能遭竄改" ? "danger" : "pending";
    return `<span class="blockchain-verify-badge ${cls}">${escapeHTML(status || "未驗證")}</span>`;
}

function renderBlockchainLogs() {
    ensureBlockchainLogs();
    return `
        <article class="card table-card blockchain-log-card">
            <h3>區塊鏈紀錄表格</h3>
            <div class="health-record-table-wrapper">
                <table class="blockchain-log-table">
                    <thead><tr><th>Transaction Hash</th><th>Block Height</th><th>授權者</th><th>被授權者</th><th>資料範圍</th><th>授權時間</th><th>狀態</th><th>操作</th></tr></thead>
                    <tbody>
                        ${state.blockchainLogs.map((log) => `
                            <tr>
                                <td><code class="blockchain-hash-box">${escapeHTML(shortHash(log.txHash))}</code></td>
                                <td>${escapeHTML(String(log.blockHeight))}</td>
                                <td>${escapeHTML(log.from)}</td>
                                <td>${escapeHTML(log.to)}</td>
                                <td>${escapeHTML((log.dataScope || []).join("、") || "--")}</td>
                                <td>${escapeHTML(log.timestamp)}</td>
                                <td>${blockchainVerifyBadge(log.verifyStatus)}</td>
                                <td class="blockchain-actions">
                                    <button type="button" class="mini-button" onclick="openBlockchainDetail('${escapeHTML(log.id)}')">查看詳情</button>
                                    <button type="button" class="mini-button" onclick="verifyBlockchainHash('${escapeHTML(log.id)}')">驗證 Hash</button>
                                    <button type="button" class="mini-button" onclick="copyBlockchainHash('${escapeHTML(log.id)}')">複製 Hash</button>
                                    ${log.authId ? `<button type="button" class="mini-button danger" onclick="revokeAuthorization('${escapeHTML(log.authId)}')">撤回授權</button>` : ""}
                                </td>
                            </tr>
                        `).join("") || `<tr><td colspan="8">尚無區塊鏈紀錄。</td></tr>`}
                    </tbody>
                </table>
            </div>
        </article>`;
}

function blockchainExplanationCard() {
    return `
        <article class="card blockchain-explain-card">
            <h3>為什麼健康資料不直接上鏈？</h3>
            <ul>
                <li>健康資料屬於敏感個資</li>
                <li>區塊鏈資料不可刪除</li>
                <li>因此只保存授權紀錄 Hash</li>
                <li>真實健康資料仍保留在 FHIR Server 或使用者端</li>
                <li>這樣能兼顧資料可追溯與隱私保護</li>
            </ul>
        </article>`;
}

function renderBlockchainCenter() {
    const section = document.getElementById("blockchain-section");
    if (!section) return;
    ensureBlockchainLogs();
    syncAuthorizationBlockchainEvents();
    section.innerHTML = `
        <div class="section-heading"><h2>區塊鏈授權存證中心</h2><p>以前端模擬區塊鏈保存授權 Hash，展示授權建立、QR Code、查看、到期與撤回的可追溯紀錄。</p></div>
        ${renderBlockchainOverview()}
        ${renderBlockchainTimeline()}
        ${renderBlockchainLogs()}
        ${blockchainExplanationCard()}
        <div id="blockchain-detail-modal" class="blockchain-detail-modal" aria-hidden="true"></div>`;
}

function hasBlockchainEvent(authId, eventType, datePrefix = "") {
    ensureBlockchainLogs();
    return state.blockchainLogs.some((log) => log.authId === authId && log.eventType === eventType && (!datePrefix || String(log.timestamp).startsWith(datePrefix)));
}

function syncAuthorizationBlockchainEvents() {
    ensureBlockchainLogs();
    const today = nowText().slice(0, 10);
    (state.authorizations || []).forEach((auth) => {
        if (!auth?.id) return;
        if (!hasBlockchainEvent(auth.id, "授權建立")) {
            addBlockchainEvent({
                from: auth.patientName || patientName?.(auth) || "User",
                to: auth.targetName || auth.targetRole || "--",
                dataScope: auth.dataScopes || [],
                authId: auth.id,
                eventType: "授權建立",
                status: String(auth.status || "").includes("撤回") ? "Revoked" : "Success",
                timestamp: auth.createdAt || nowText()
            });
        }
        const expiry = Date.parse(auth.expiredAt || auth.expiresAt || "");
        if (Number.isFinite(expiry) && expiry > Date.now() && expiry - Date.now() < 24 * 60 * 60 * 1000 && !hasBlockchainEvent(auth.id, "授權即將到期", today)) {
            addBlockchainEvent({
                from: auth.patientName || patientName?.(auth) || "User",
                to: auth.targetName || auth.targetRole || "--",
                dataScope: auth.dataScopes || [],
                authId: auth.id,
                eventType: "授權即將到期",
                status: "Warning"
            });
        }
    });
}

function recordAuthorizationViewEvent(role) {
    const today = nowText().slice(0, 10);
    const auths = typeof getAuthorizationsByRole === "function" ? getAuthorizationsByRole(role).filter(isAuthorizationValid) : [];
    auths.forEach((auth) => {
        if (hasBlockchainEvent(auth.id, "授權資料被查看", today)) return;
        addBlockchainEvent({
            from: auth.patientName || patientName?.(auth) || "User",
            to: auth.targetName || auth.targetRole || role,
            dataScope: auth.dataScopes || [],
            authId: auth.id,
            eventType: "授權資料被查看",
            status: "Success"
        });
    });
}

function verifyBlockchainHash(logId) {
    const log = blockchainLogById(logId);
    if (!log) return;
    const recalculated = generateBlockchainHash(log);
    log.verifyStatus = recalculated === log.txHash ? "驗證通過" : "資料可能遭竄改";
    saveState();
    renderBlockchainCenter();
    showToast(log.verifyStatus);
}

function copyBlockchainHash(logId) {
    const log = blockchainLogById(logId);
    if (!log) return;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(log.txHash).then(() => showToast("Hash 已複製"));
    else showToast("瀏覽器不支援剪貼簿 API");
}

function openBlockchainDetail(logId) {
    const log = blockchainLogById(logId);
    const modal = document.getElementById("blockchain-detail-modal");
    if (!log || !modal) return;
    modal.innerHTML = `
        <div class="blockchain-detail-backdrop" onclick="closeBlockchainDetail()"></div>
        <div class="blockchain-detail-card">
            <div class="fhir-card-title-row"><h3>區塊鏈存證詳情</h3><button type="button" class="secondary-button" onclick="closeBlockchainDetail()">關閉</button></div>
            <div class="blockchain-detail-grid">
                <span>Transaction Hash</span><code>${escapeHTML(log.txHash)}</code>
                <span>Block Height</span><strong>${escapeHTML(String(log.blockHeight))}</strong>
                <span>Previous Hash</span><code>${escapeHTML(log.previousHash)}</code>
                <span>授權者</span><strong>${escapeHTML(log.from)}</strong>
                <span>被授權者</span><strong>${escapeHTML(log.to)}</strong>
                <span>資料範圍</span><strong>${escapeHTML((log.dataScope || []).join("、") || "--")}</strong>
                <span>授權 ID</span><strong>${escapeHTML(log.authId || "--")}</strong>
                <span>事件類型</span><strong>${escapeHTML(log.eventType)}</strong>
                <span>時間戳記</span><strong>${escapeHTML(log.timestamp)}</strong>
                <span>驗證狀態</span><strong>${escapeHTML(log.verifyStatus)}</strong>
            </div>
            <p class="blockchain-detail-note">健康資料不上鏈，只上鏈授權 Hash。</p>
        </div>`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeBlockchainDetail() {
    const modal = document.getElementById("blockchain-detail-modal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = "";
}

function revokeAuthorization(authId) {
    const auth = (state.authorizations || []).find((item) => item.id === authId);
    if (!auth || String(auth.status).includes("撤回")) {
        showToast("授權不存在或已撤回");
        return;
    }
    auth.status = "已撤回";
    auth.revokedAt = nowText();
    addBlockchainEvent({
        from: auth.patientName || patientName?.(auth) || "User",
        to: auth.targetName || auth.targetRole || "--",
        dataScope: auth.dataScopes || [],
        authId: auth.id,
        eventType: "授權撤回",
        status: "Revoked"
    });
    if (typeof addNotification === "function") addNotification("授權已撤回", `已撤回 ${auth.targetName || auth.targetRole} 的資料授權。`, "authorization", "warning", "blockchain-section", `${auth.id}:revoked`);
    if (typeof addAuditLog === "function") addAuditLog("撤回授權", `Authorization ${auth.id}`, "Success");
    saveState();
    renderAll();
    showToast("授權已撤回");
}

var baseIsAuthorizationValidBeforeBlockchain = isAuthorizationValid;
isAuthorizationValid = function blockchainAuthorizationValid(auth) {
    if (!auth || String(auth.status || "").includes("撤回")) return false;
    return baseIsAuthorizationValidBeforeBlockchain(auth);
};

var baseGenerateQRCodeBeforeBlockchain = generateQRCode;
generateQRCode = function blockchainGenerateQRCode(event) {
    const before = state.authorizations?.length || 0;
    baseGenerateQRCodeBeforeBlockchain(event);
    if ((state.authorizations?.length || 0) > before) {
        const auth = state.authorizations[state.authorizations.length - 1];
        addBlockchainEvent({
            from: auth.patientName || "User",
            to: auth.targetName || auth.targetRole || "--",
            dataScope: auth.dataScopes || [],
            authId: auth.id,
            eventType: "QR Code 產生",
            status: "Success"
        });
        if (typeof addAuditLog === "function") addAuditLog("建立區塊鏈授權存證", `Authorization ${auth.id}`, "Success");
    }
};

var baseRenderAllBeforeBlockchainCenter = renderAll;
renderAll = function blockchainCenterRenderAll() {
    baseRenderAllBeforeBlockchainCenter();
    renderBlockchainCenter();
};

var baseShowSectionBeforeBlockchain = showSection;
showSection = function blockchainShowSection(sectionId) {
    baseShowSectionBeforeBlockchain(sectionId);
    if (["student-exercise-section", "student-heart-rate-section", "training-advice-section"].includes(sectionId)) recordAuthorizationViewEvent("coach");
    if (["bmi-analysis-section", "weight-trend-section", "blood-pressure-section", "diet-advice-section"].includes(sectionId)) recordAuthorizationViewEvent("nutritionist");
};

window.generateBlockchainHash = generateBlockchainHash;
window.addBlockchainEvent = addBlockchainEvent;
window.renderBlockchainOverview = renderBlockchainOverview;
window.renderBlockchainTimeline = renderBlockchainTimeline;
window.renderBlockchainLogs = renderBlockchainLogs;
window.verifyBlockchainHash = verifyBlockchainHash;
window.copyBlockchainHash = copyBlockchainHash;
window.openBlockchainDetail = openBlockchainDetail;
window.closeBlockchainDetail = closeBlockchainDetail;
window.revokeAuthorization = revokeAuthorization;
window.isAuthorizationValid = isAuthorizationValid;
window.generateQRCode = generateQRCode;
window.showSection = showSection;
window.renderAll = renderAll;

// Care Team collaboration center.
window.rolePermissions = {
    ...(window.rolePermissions || {}),
    user: Array.from(new Set([...(window.rolePermissions?.user || []), "care-team-section"])),
    coach: Array.from(new Set([...(window.rolePermissions?.coach || []), "care-team-section"])),
    nutritionist: Array.from(new Set([...(window.rolePermissions?.nutritionist || []), "care-team-section"])),
    admin: Array.from(new Set([...(window.rolePermissions?.admin || []), "care-team-section"]))
};

if (typeof SECTION_LABELS === "object") SECTION_LABELS["care-team-section"] = "Care Team 協作中心";

function ensureCareTeamStore() {
    if (!Array.isArray(state.careTeamMessages)) {
        state.careTeamMessages = [
            { id: "CTM-20260625-001", authId: "AUTH-20260628-001", fromRole: "coach", fromName: "李教練", patientId: "ACC-USER-DEMO", patientName: "王小明", text: "今天建議跑步30分鐘。", time: "2026-06-25 09:30" },
            { id: "CTM-20260626-001", authId: "AUTH-20260628-002", fromRole: "nutritionist", fromName: "陳營養師", patientId: "ACC-USER-DEMO", patientName: "王小明", text: "建議增加蛋白質。", time: "2026-06-26 10:00" },
            { id: "CTM-20260627-001", authId: "", fromRole: "ai", fromName: "AI 健康助理", patientId: "ACC-USER-DEMO", patientName: "王小明", text: "建議睡眠增加30分鐘。", time: "2026-06-27 08:00" }
        ];
        saveState();
    }
}

function careRoleLabel(role) {
    return ({ coach: "Coach", nutritionist: "Nutritionist", doctor: "Doctor", ai: "AI", user: "User", admin: "Admin" })[role] || role || "--";
}

function careDataScopes(role) {
    if (role === "coach") return ["運動紀錄", "心率", "步數", "熱量消耗"];
    if (role === "nutritionist") return ["BMI", "體重", "血壓", "飲食建議"];
    if (role === "doctor") return ["血壓", "BMI", "心率", "AI 分析摘要"];
    return [];
}

function careTeamAuthsForUser(patientId = activeUserId()) {
    return (state.authorizations || [])
        .map((auth) => (typeof normalizeAuthorization === "function" ? normalizeAuthorization(auth) : auth))
        .filter((auth) => (auth.patientId || (typeof authPatientId === "function" ? authPatientId(auth) : "")) === patientId)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function careTeamValidAuthsByRole(role) {
    return (typeof getAuthorizationsByRole === "function" ? getAuthorizationsByRole(role) : (state.authorizations || []).filter((auth) => auth.targetRole === role))
        .filter((auth) => (typeof isAuthorizationValid === "function" ? isAuthorizationValid(auth) : !String(auth.status || "").includes("撤回")));
}

function carePatientLatest(auth) {
    const patientId = typeof authPatientId === "function" ? authPatientId(auth) : auth.patientId;
    return typeof latestRecord === "function" ? latestRecord(patientId) : null;
}

function carePatientAnalysis(auth) {
    const patientId = typeof authPatientId === "function" ? authPatientId(auth) : auth.patientId;
    return typeof runAIAnalysis === "function" ? runAIAnalysis(patientId) : {};
}

function careMessageRows(patientId) {
    ensureCareTeamStore();
    return state.careTeamMessages
        .filter((message) => !patientId || message.patientId === patientId)
        .sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

function addCareTeamMessage(authId, text, roleOverride) {
    ensureCareTeamStore();
    const auth = (state.authorizations || []).find((item) => item.id === authId) || {};
    const role = roleOverride || getCurrentRole();
    const account = currentAccount?.() || {};
    const message = {
        id: typeof uid === "function" ? uid("CTM") : `CTM-${Date.now()}`,
        authId: authId || "",
        fromRole: role,
        fromName: role === "ai" ? "AI 健康助理" : account.name || careRoleLabel(role),
        patientId: auth.patientId || activeUserId(),
        patientName: auth.patientName || patientName?.(auth) || state.patient?.name || "--",
        text: String(text || "").trim(),
        time: nowText()
    };
    if (!message.text) return;
    state.careTeamMessages.push(message);
    if (typeof addNotification === "function") addNotification("Care Team 留言", `${message.fromName}：${message.text}`, "system", "info", "care-team-section", message.id);
    saveState();
    renderCareTeam();
}

function addCareTeamMember(event) {
    event?.preventDefault();
    const role = valueOf("care-member-role");
    const name = valueOf("care-member-name") || careRoleLabel(role);
    const duration = valueOf("care-member-duration") || "30天";
    if (!role) {
        showToast("請選擇照護角色");
        return;
    }
    const patient = currentAccount()?.role === "user" ? currentAccount() : state.accounts.find((item) => item.role === "user");
    const createdAt = nowText();
    const auth = {
        id: typeof nextAuthorizationId === "function" ? nextAuthorizationId() : `AUTH-${Date.now()}`,
        patientId: patient?.id || activeUserId(),
        patientName: patient?.name || state.patient?.name || "User",
        targetRole: role,
        targetName: name,
        dataScopes: careDataScopes(role),
        duration,
        status: "有效",
        hash: `0x${(typeof hashText === "function" ? hashText(`${role}-${name}-${createdAt}`) : Date.now()).toString().toUpperCase()}`,
        createdAt,
        expiredAt: typeof authorizationExpiredAt === "function" ? authorizationExpiredAt(duration) : duration
    };
    state.authorizations.push(auth);
    if (typeof addBlockchainEvent === "function") addBlockchainEvent({ from: auth.patientName, to: auth.targetName, dataScope: auth.dataScopes, authId: auth.id, eventType: "Care Team 成員新增", status: "Success" });
    if (typeof addNotification === "function") addNotification("已新增照護成員", `${auth.targetName} 已加入 Care Team。`, "authorization", "success", "care-team-section", `${auth.id}:care-add`);
    if (typeof addAuditLog === "function") addAuditLog("新增照護成員", `Care Team ${auth.id}`, "Success");
    saveState();
    renderCareTeam();
    showToast("照護成員已新增");
}

function removeCareTeamMember(authId) {
    if (typeof revokeAuthorization === "function") {
        revokeAuthorization(authId);
        return;
    }
    const auth = (state.authorizations || []).find((item) => item.id === authId);
    if (!auth) return;
    auth.status = "已撤回";
    auth.revokedAt = nowText();
    saveState();
    renderCareTeam();
}

function careTeamTimeline(patientId = activeUserId()) {
    const messages = careMessageRows(patientId).map((message) => ({ date: message.time, label: `${careRoleLabel(message.fromRole)}留言`, text: message.text }));
    const ai = typeof runAIAnalysis === "function" ? runAIAnalysis(patientId) : {};
    if (ai.summary) messages.push({ date: nowText(), label: "AI分析", text: ai.summary });
    const latest = typeof latestRecord === "function" ? latestRecord(patientId) : null;
    if (latest?.exercise) messages.push({ date: latest.date || nowText(), label: "User完成運動", text: `完成運動 ${latest.exercise} 分鐘` });
    return messages.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function renderCareTimeline(patientId = activeUserId()) {
    return `<article class="card care-timeline-card"><h3>Care Timeline</h3><div class="care-timeline">${careTeamTimeline(patientId).map((item) => `<div class="care-timeline-item"><time>${escapeHTML(String(item.date).slice(5, 10).replace("-", "/"))}</time><div><strong>${escapeHTML(item.label)}</strong><p>${escapeHTML(item.text)}</p></div></div>`).join("") || `<p class="empty">尚無 Timeline。</p>`}</div></article>`;
}

function renderCareMessages(patientId = activeUserId(), authId = "") {
    const messages = careMessageRows(patientId).filter((message) => !authId || message.authId === authId);
    return `<div class="care-message-list">${messages.map((message) => `<div class="care-message-bubble ${escapeHTML(message.fromRole)}"><strong>${escapeHTML(message.fromName)}</strong><p>${escapeHTML(message.text)}</p><small>${escapeHTML(message.time)}</small></div>`).join("") || `<p class="empty">尚無留言。</p>`}</div>`;
}

function renderUserCareTeam() {
    const auths = careTeamAuthsForUser(activeUserId());
    return `
        <div class="care-team-layout">
            <article class="card care-team-panel">
                <h3>目前授權照護成員</h3>
                <div class="care-member-grid">
                    ${["coach", "nutritionist", "doctor"].map((role) => {
                        const list = auths.filter((auth) => auth.targetRole === role);
                        return `<div class="care-role-card"><span>${careRoleLabel(role)}</span>${list.map((auth) => `<div class="care-member-row"><strong>${escapeHTML(auth.targetName || careRoleLabel(role))}</strong><small>期限：${escapeHTML(auth.expiredAt || auth.duration || "--")}</small><p>${escapeHTML((auth.dataScopes || []).join("、") || "--")}</p><button type="button" class="mini-button danger" onclick="removeCareTeamMember('${escapeHTML(auth.id)}')">移除照護成員</button></div>`).join("") || `<p class="empty">尚未授權 ${careRoleLabel(role)}</p>`}</div>`;
                    }).join("")}
                </div>
            </article>
            <article class="card care-team-panel">
                <h3>新增照護成員</h3>
                <form class="care-member-form" onsubmit="addCareTeamMember(event)">
                    <div class="form-group"><label for="care-member-role">角色</label><select id="care-member-role"><option value="coach">Coach</option><option value="nutritionist">Nutritionist</option><option value="doctor">Doctor</option></select></div>
                    <div class="form-group"><label for="care-member-name">姓名</label><input id="care-member-name" type="text" placeholder="輸入照護成員姓名" /></div>
                    <div class="form-group"><label for="care-member-duration">授權期限</label><select id="care-member-duration"><option>7天</option><option selected>30天</option><option>永久授權</option></select></div>
                    <button type="submit" class="primary-button">新增照護成員</button>
                </form>
            </article>
        </div>
        <div class="care-team-layout">
            <article class="card care-message-panel"><h3>Coach / Nutrition / AI 留言</h3>${renderCareMessages(activeUserId())}</article>
            ${renderCareTimeline(activeUserId())}
        </div>`;
}

function renderCoachCareTeam() {
    const auths = careTeamValidAuthsByRole("coach").filter((auth) => typeof hasCoachDataScope === "function" ? hasCoachDataScope(auth) : true);
    return `<div class="care-provider-grid">${auths.map((auth) => {
        const latest = carePatientLatest(auth) || {};
        const analysis = carePatientAnalysis(auth);
        return `<article class="card care-provider-card"><h3>${escapeHTML(auth.patientName || patientName?.(auth) || "學員")}</h3><div class="care-provider-metrics"><span>步數 <strong>${escapeHTML(String(latest.steps || "--"))}</strong></span><span>心率 <strong>${escapeHTML(String(latest.heartRate || latest.hr || "--"))}</strong></span><span>運動 <strong>${escapeHTML(String(latest.exercise || "--"))} 分</strong></span></div><div class="care-ai-note"><strong>AI運動建議</strong><p>${escapeHTML(analysis.exerciseAdvice || "--")}</p></div>${renderCareMessages(auth.patientId, auth.id)}<div class="care-comment-box"><input id="care-msg-${escapeHTML(auth.id)}" placeholder="輸入留言，例如：今天建議跑步30分鐘。" /><button onclick="addCareTeamMessage('${escapeHTML(auth.id)}', document.getElementById('care-msg-${escapeHTML(auth.id)}').value)">留言</button></div></article>`;
    }).join("") || `<article class="card empty">目前沒有管理學員。</article>`}</div>${renderCareTimeline(auths[0]?.patientId || "")}`;
}

function renderNutritionCareTeam() {
    const auths = careTeamValidAuthsByRole("nutritionist").filter((auth) => typeof hasNutritionDataScope === "function" ? hasNutritionDataScope(auth) : true);
    return `<div class="care-provider-grid">${auths.map((auth) => {
        const latest = carePatientLatest(auth) || {};
        const analysis = carePatientAnalysis(auth);
        return `<article class="card care-provider-card"><h3>${escapeHTML(auth.patientName || patientName?.(auth) || "個案")}</h3><div class="care-provider-metrics"><span>BMI <strong>${escapeHTML(String(latest.bmi || "--"))}</strong></span><span>體重 <strong>${escapeHTML(String(latest.weight || "--"))} kg</strong></span><span>血壓 <strong>${escapeHTML(latest.systolic ? `${latest.systolic}/${latest.diastolic}` : "--")}</strong></span></div><div class="care-ai-note"><strong>飲食建議</strong><p>${escapeHTML(analysis.dietAdvice || "--")}</p></div>${renderCareMessages(auth.patientId, auth.id)}<div class="care-comment-box"><input id="care-msg-${escapeHTML(auth.id)}" placeholder="輸入留言，例如：建議增加蛋白質。" /><button onclick="addCareTeamMessage('${escapeHTML(auth.id)}', document.getElementById('care-msg-${escapeHTML(auth.id)}').value)">留言</button></div></article>`;
    }).join("") || `<article class="card empty">目前沒有管理個案。</article>`}</div>${renderCareTimeline(auths[0]?.patientId || "")}`;
}

function renderAdminCareTeam() {
    const rows = (state.authorizations || []).map((auth) => `<tr><td>${escapeHTML(auth.patientName || "--")}</td><td>${escapeHTML(auth.targetName || careRoleLabel(auth.targetRole))}</td><td>${escapeHTML(careRoleLabel(auth.targetRole))}</td><td>${escapeHTML((auth.dataScopes || []).join("、"))}</td><td>${escapeHTML(auth.expiredAt || auth.duration || "--")}</td><td>${escapeHTML(auth.status || "--")}</td></tr>`).join("") || `<tr><td colspan="6">尚無照護關係。</td></tr>`;
    return `<article class="card care-admin-card"><h3>全部照護關係</h3><div class="health-record-table-wrapper"><table class="care-team-table"><thead><tr><th>User</th><th>照護成員</th><th>角色</th><th>授權資料</th><th>期限</th><th>狀態</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

function ensureCareTeamUI() {
    const role = getCurrentRole();
    if (!["user", "coach", "nutritionist", "admin"].includes(role)) return;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return;
    let section = document.getElementById("care-team-section");
    if (!section) {
        section = document.createElement("section");
        section.id = "care-team-section";
        section.className = "content-section";
        const before = document.getElementById("notification-section") || pageContent.lastElementChild;
        pageContent.insertBefore(section, before || null);
    }
    const navMenu = document.getElementById("nav-menu");
    if (navMenu && !navMenu.querySelector('[data-section="care-team-section"]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-btn";
        button.dataset.section = "care-team-section";
        button.textContent = "Care Team";
        button.onclick = () => showSection("care-team-section");
        const before = navMenu.querySelector('[data-section="notification-section"]');
        navMenu.insertBefore(button, before || null);
    }
}

function renderCareTeam() {
    ensureCareTeamStore();
    ensureCareTeamUI();
    const section = document.getElementById("care-team-section");
    if (!section) return;
    const role = getCurrentRole();
    const subtitle = role === "coach" ? "目前管理學員、健康資料、AI 運動建議與留言。" : role === "nutritionist" ? "目前管理個案、BMI、體重、飲食建議與留言。" : role === "admin" ? "查看全部照護關係。" : "查看 Coach、Nutritionist、Doctor 授權與留言。";
    section.innerHTML = `<div class="section-heading care-team-heading"><h2>Care Team 協作中心</h2><p>${escapeHTML(subtitle)}</p></div>${role === "coach" ? renderCoachCareTeam() : role === "nutritionist" ? renderNutritionCareTeam() : role === "admin" ? renderAdminCareTeam() : renderUserCareTeam()}`;
}

var baseRenderAllBeforeCareTeam = renderAll;
renderAll = function careTeamRenderAll() {
    baseRenderAllBeforeCareTeam();
    renderCareTeam();
};

window.addCareTeamMember = addCareTeamMember;
window.removeCareTeamMember = removeCareTeamMember;
window.addCareTeamMessage = addCareTeamMessage;
window.renderCareTeam = renderCareTeam;
window.renderCareTimeline = renderCareTimeline;
window.renderAll = renderAll;
