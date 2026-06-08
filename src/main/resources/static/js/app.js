/**
 * 管理后台 SPA — 侧边栏导航 + 多页面
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════
   *  API 层
   * ═══════════════════════════════════════════════════════ */
  async function request(method, path, body) {
    var opts = { method: method, headers: { "Content-Type": "application/json" } };
    var token = localStorage.getItem("token");
    if (token) opts.headers["Authorization"] = "Bearer " + token;
    if (body) opts.body = JSON.stringify(body);
    var resp = await fetch(path, opts);
    var json = await resp.json();
    if (json.code === 401) { logout(); }
    return json;
  }

  var api = {
    register: function (u, p, c) { return request("POST", "/api/register", { username: u, password: p, confirm: c }); },
    login: async function (u, p) {
      var r = await request("POST", "/api/login", { username: u, password: p });
      if (r.code === 200 && r.data && r.data.token) {
        localStorage.setItem("token", r.data.token);
        localStorage.setItem("username", r.data.username);
      }
      return r;
    },
    logout: async function () {
      var r = await request("POST", "/api/logout");
      logout();
      return r;
    },
    user: function () { return request("GET", "/api/user"); },
    weather: function (params) {
      var qs = new URLSearchParams(params).toString();
      return request("GET", "/api/weather?" + qs);
    },
    homeWeather: function (count) { return request("GET", "/api/home-weather?count=" + (count || 5)); },
    products: function () { return request("GET", "/api/products"); },
    provinces: function () { return request("GET", "/api/provinces"); },
    cities: function (province) { return request("GET", "/api/cities?province=" + encodeURIComponent(province)); },
    districts: function (city) { return request("GET", "/api/districts?city=" + encodeURIComponent(city)); }
  };

  function logout() {
    localStorage.removeItem("token"); localStorage.removeItem("username");
    window.location.hash = "#login"; render("#login");
  }

  /* ═══════════════════════════════════════════════════════
   *  路由
   * ═══════════════════════════════════════════════════════ */
  var routes = {};
  var _after = {};

  function navigate(hash) {
    window.location.hash = hash;
  }

  function render(hash) {
    var appEl = document.getElementById("app");
    var topRight = document.getElementById("topbarRight");
    var titleEl = document.getElementById("topbarTitle");
    var username = localStorage.getItem("username");

    // 未登录 → 显示登录页
    if (!username) {
      document.body.classList.add("auth-page");
      if (topRight) topRight.innerHTML = "";
      if (titleEl) titleEl.textContent = "";
      var fn = routes[hash] || routes["#login"];
      if (fn) appEl.innerHTML = fn();
      var cb = _after[hash];
      if (cb) cb();
      highlightSidebar(hash);
      return;
    }

    // 已登录 → 显示后台布局
    document.body.classList.remove("auth-page");
    if (topRight) {
      topRight.innerHTML = '<span>👤 ' + username + '</span><a id="btnLogout" href="#">退出登录</a>';
      var logoutBtn = document.getElementById("btnLogout");
      if (logoutBtn) logoutBtn.onclick = function (e) { e.preventDefault(); api.logout(); };
    }

    var pageTitle = { "#dashboard": "首页", "#weather": "天气管理", "#products": "产品管理" };
    if (titleEl) titleEl.textContent = pageTitle[hash] || "管理后台";

    // 渲染侧边栏
    buildSidebar(hash);

    // 如果没有有效路由，跳转到仪表盘
    if (!routes[hash]) { navigate("#dashboard"); return; }

    var fn = routes[hash];
    if (fn) appEl.innerHTML = fn();
    var cb = _after[hash];
    if (cb) cb();
    highlightSidebar(hash);
  }

  window.addEventListener("hashchange", function () { render(window.location.hash); });

  /* ═══════════════════════════════════════════════════════
   *  侧边栏
   * ═══════════════════════════════════════════════════════ */
  function buildSidebar(activeHash) {
    var nav = document.getElementById("sidebarNav");
    if (!nav) return;
    var menus = [
      { id: "dashboard", icon: "🏠", label: "首页", hash: "#dashboard" },
      { id: "weather", icon: "🌤️", label: "天气管理", hash: "#weather" },
      { id: "products", icon: "📦", label: "产品管理", hash: "#products" }
    ];

    nav.innerHTML = menus.map(function (m) {
      return '<div class="menu-item" data-hash="' + m.hash + '">' +
        '<span class="menu-icon">' + m.icon + '</span>' +
        '<span class="menu-text">' + m.label + '</span></div>';
    }).join("");

    // 点击事件
    nav.querySelectorAll(".menu-item").forEach(function (el) {
      el.onclick = function () {
        var h = el.dataset.hash;
        if (el.classList.contains("open")) {
          el.classList.remove("open");
          var sub = el.nextElementSibling;
          if (sub && sub.classList.contains("submenu")) sub.classList.remove("show");
        }
        navigate(h);
      };
    });
  }

  function highlightSidebar(hash) {
    var nav = document.getElementById("sidebarNav");
    if (!nav) return;
    nav.querySelectorAll(".menu-item, .sub-item").forEach(function (el) {
      el.classList.remove("active");
    });
    var active = nav.querySelector('[data-hash="' + hash + '"]');
    if (active) active.classList.add("active");
  }

  // 侧边栏折叠
  window.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      var toggle = document.getElementById("menuToggle");
      var sidebar = document.getElementById("sidebar");
      if (toggle && sidebar) {
        toggle.onclick = function () { sidebar.classList.toggle("collapsed"); };
      }
    }, 100);
  });

  /* ═══════════════════════════════════════════════════════
   *  校验函数
   * ═══════════════════════════════════════════════════════ */
  function checkUsername(v) {
    if (!v) return "请输入账号";
    if (v.length < 8) return "账号长度不够，需要8位（当前 " + v.length + " 位）";
    if (v.length > 8) return "账号不能超过8位（当前 " + v.length + " 位）";
    if (!/[a-zA-Z]/.test(v)) return "账号必须包含字母";
    if (!/\d/.test(v)) return "账号必须包含数字";
    if (/[^a-zA-Z0-9]/.test(v)) return "账号只能包含字母和数字";
    return null;
  }

  function checkPassword(v) {
    if (!v) return "请输入密码";
    if (v.length < 5) return "密码长度不够，至少5位";
    if (!/[a-zA-Z]/.test(v)) return "密码必须包含字母";
    if (!/\d/.test(v)) return "密码必须包含数字";
    if (/[^a-zA-Z0-9]/.test(v)) return "密码只能包含字母和数字";
    return null;
  }

  function setState(el, state, msg) {
    var wrap = el.closest(".form-group");
    var fb = wrap ? wrap.querySelector(".feedback-msg") : null;
    el.classList.remove("is-valid", "is-invalid");
    if (fb) fb.textContent = "";
    if (state === "error") { el.classList.add("is-invalid"); if (fb) fb.textContent = msg; }
    else if (state === "success") { el.classList.add("is-valid"); if (fb) fb.textContent = msg || ""; }
  }

  function validateField(el, checkFn, successMsg) {
    var v = el.value;
    var err = checkFn(v);
    if (err) { setState(el, "error", err); return false; }
    setState(el, "success", successMsg || "✔️");
    return true;
  }

  /* ═══════════════════════════════════════════════════════
   *  登录页
   * ═══════════════════════════════════════════════════════ */
  routes["#login"] = function () {
    return '<div class="auth-center"><div class="auth-card card"><div class="card-body">' +
      '<h2>🔐 管理后台登录</h2>' +
      '<form id="loginForm"><div class="form-group">' +
      '<label>账号 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（8位，字母+数字）</span></label>' +
      '<div><div class="input-wrap">' +
      '<input id="loginUser" type="text" placeholder="字母+数字组合，共8位" maxlength="8" autocomplete="off" autofocus>' +
      '<span class="char-count" id="loginUserCount">0/8</span></div>' +
      '<div class="feedback-msg"></div></div></div>' +
      '<div class="form-group">' +
      '<label>密码 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（至少5位，字母+数字）</span></label>' +
      '<div><div class="input-wrap">' +
      '<input id="loginPass" type="password" placeholder="字母+数字组合，至少5位" maxlength="30" autocomplete="off">' +
      '<button type="button" class="pwd-toggle" id="loginPwdToggle" title="显示/隐藏密码">👁️</button>' +
      '<span class="char-count" id="loginPassCount">0/5+</span></div>' +
      '<div class="feedback-msg"></div></div></div>' +
      '<button type="submit" class="btn btn-primary" id="loginBtn" style="width:100%">登录</button></form>' +
      '<div id="loginMsg" style="margin-top:12px;"></div>' +
      '<p class="link">还没有账号？<a id="toRegister" href="#">立即注册</a></p>' +
      '</div></div></div>';
  };

  _after["#login"] = function () {
    var form = document.getElementById("loginForm");
    var user = document.getElementById("loginUser");
    var pass = document.getElementById("loginPass");
    var btn = document.getElementById("loginBtn");
    var msg = document.getElementById("loginMsg");
    if (!form) return;

    var pwdToggle = document.getElementById("loginPwdToggle");
    var pwdVisible = false;
    if (pwdToggle) pwdToggle.addEventListener("click", function () {
      pwdVisible = !pwdVisible;
      pass.type = pwdVisible ? "text" : "password";
      pwdToggle.textContent = pwdVisible ? "🙈" : "👁️";
    });

    var toReg = document.getElementById("toRegister");
    if (toReg) toReg.onclick = function (e) { e.preventDefault(); navigate("#register"); render("#register"); };

    user.addEventListener("input", function () {
      document.getElementById("loginUserCount").textContent = user.value.length + "/8";
      if (user.value.length > 0) validateField(user, checkUsername, "✔️ 格式正确");
      else setState(user, null, "");
    });
    pass.addEventListener("input", function () {
      document.getElementById("loginPassCount").textContent = pass.value.length + "/5+";
      if (pass.value.length > 0) validateField(pass, checkPassword, "✔️ 格式正确");
      else setState(pass, null, "");
    });

    form.onsubmit = async function (e) {
      e.preventDefault();
      var okU = validateField(user, checkUsername, "✔️ 格式正确");
      var okP = validateField(pass, checkPassword, "✔️ 格式正确");
      if (!okU || !okP) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 登录中...'; msg.innerHTML = "";
      try {
        var r = await api.login(user.value.trim(), pass.value);
        btn.disabled = false; btn.innerHTML = "登录";
        if (r.code === 200) {
          msg.innerHTML = '<div class="alert alert-success">登录成功，正在跳转...</div>';
          setTimeout(function () { navigate("#dashboard"); render("#dashboard"); }, 500);
        } else {
          msg.innerHTML = '<div class="alert alert-danger">' + (r.message || "未知错误") + '</div>';
        }
      } catch (err) {
        btn.disabled = false; btn.innerHTML = "登录";
        msg.innerHTML = '<div class="alert alert-danger">网络请求失败，请确认服务已启动</div>';
      }
    };
  };

  /* ═══════════════════════════════════════════════════════
   *  注册页
   * ═══════════════════════════════════════════════════════ */
  routes["#register"] = function () {
    return '<div class="auth-center"><div class="auth-card card"><div class="card-body">' +
      '<h2>📝 用户注册</h2>' +
      '<form id="regForm">' +
      '<div class="form-group"><label>账号 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（8位，字母+数字）</span></label>' +
      '<div><div class="input-wrap"><input id="regUser" type="text" placeholder="字母+数字组合，共8位" maxlength="8" autocomplete="off" autofocus>' +
      '<span class="char-count" id="regUserCount">0/8</span></div><div class="feedback-msg"></div></div>' +
      '<div class="rules-hint" id="regUserRules">' +
      '<span data-rule="length">🔴 至少 8 位</span>' +
      '<span data-rule="letter">🔴 包含字母</span>' +
      '<span data-rule="digit">🔴 包含数字</span></div></div>' +
      '<div class="form-group"><label>密码 <span style="font-weight:400;color:#9ca3af;font-size:12px;">（至少5位，字母+数字）</span></label>' +
      '<div><div class="input-wrap"><input id="regPass" type="password" placeholder="字母+数字组合，至少5位" maxlength="30" autocomplete="off">' +
      '<span class="char-count" id="regPassCount">0/5+</span></div><div class="feedback-msg"></div></div>' +
      '<div class="rules-hint" id="regPassRules">' +
      '<span data-rule="length">🔴 至少 5 位</span>' +
      '<span data-rule="letter">🔴 包含字母</span>' +
      '<span data-rule="digit">🔴 包含数字</span></div></div>' +
      '<div class="form-group"><label>确认密码</label>' +
      '<div><div class="input-wrap"><input id="regConfirm" type="password" placeholder="再次输入密码" maxlength="30" autocomplete="off">' +
      '<span class="char-count" id="regConfirmCount">0/5+</span></div><div class="feedback-msg"></div></div></div>' +
      '<button type="submit" class="btn btn-primary" id="regBtn" style="width:100%">注册</button></form>' +
      '<div id="regMsg" style="margin-top:12px;"></div>' +
      '<p class="link">已有账号？<a id="toLogin" href="#">立即登录</a></p>' +
      '</div></div></div>';
  };

  _after["#register"] = function () {
    var form = document.getElementById("regForm");
    var user = document.getElementById("regUser"), pass = document.getElementById("regPass");
    var confirm = document.getElementById("regConfirm"), btn = document.getElementById("regBtn");
    var msg = document.getElementById("regMsg");
    if (!form) return;
    var userRules = document.querySelectorAll("#regUserRules span");
    var passRules = document.querySelectorAll("#regPassRules span");

    document.getElementById("toLogin").onclick = function (e) { e.preventDefault(); navigate("#login"); render("#login"); };

    function updateRules(rules, v, checks) {
      rules.forEach(function (el) {
        var rule = el.dataset.rule;
        if (checks[rule](v)) el.innerHTML = el.innerHTML.replace("🔴", "🟢");
        else el.innerHTML = el.innerHTML.replace("🟢", "🔴");
      });
    }
    var userChecks = { length: function (v) { return v.length === 8; }, letter: function (v) { return /[a-zA-Z]/.test(v); }, digit: function (v) { return /\d/.test(v); } };
    var passChecks = { length: function (v) { return v.length >= 5; }, letter: function (v) { return /[a-zA-Z]/.test(v); }, digit: function (v) { return /\d/.test(v); } };

    user.addEventListener("input", function () {
      document.getElementById("regUserCount").textContent = user.value.length + "/8";
      updateRules(userRules, user.value, userChecks);
      if (user.value.length > 0) validateField(user, checkUsername, "✔️ 格式正确");
      else setState(user, null, "");
    });
    pass.addEventListener("input", function () {
      document.getElementById("regPassCount").textContent = pass.value.length + "/5+";
      updateRules(passRules, pass.value, passChecks);
      if (pass.value.length > 0) validateField(pass, checkPassword, "✔️ 格式正确");
      else setState(pass, null, "");
      if (confirm.value.length > 0) validateConfirm();
    });
    function validateConfirm() {
      if (confirm.value.length === 0) { setState(confirm, null, ""); return true; }
      if (confirm.value.length < 5) { setState(confirm, "error", "密码长度不够，至少5位"); return false; }
      if (confirm.value !== pass.value) { setState(confirm, "error", "两次密码不一致"); return false; }
      setState(confirm, "success", "✔️ 密码一致"); return true;
    }
    confirm.addEventListener("input", function () {
      document.getElementById("regConfirmCount").textContent = confirm.value.length + "/5+";
      validateConfirm();
    });
    form.onsubmit = async function (e) {
      e.preventDefault();
      var okU = validateField(user, checkUsername, "✔️ 格式正确");
      var okP = validateField(pass, checkPassword, "✔️ 格式正确");
      var okC = validateConfirm();
      if (!okU || !okP || !okC) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 注册中...'; msg.innerHTML = "";
      try {
        var r = await api.register(user.value.trim(), pass.value, confirm.value);
        btn.disabled = false; btn.innerHTML = "注册";
        if (r.code === 200) {
          msg.innerHTML = '<div class="alert alert-success">' + r.message + '，即将跳转...</div>';
          setTimeout(function () { navigate("#login"); render("#login"); }, 1500);
        } else { msg.innerHTML = '<div class="alert alert-danger">' + r.message + '</div>'; }
      } catch (err) {
        btn.disabled = false; btn.innerHTML = "注册";
        msg.innerHTML = '<div class="alert alert-danger">网络请求失败</div>';
      }
    };
  };

  /* ═══════════════════════════════════════════════════════
   *  首页（仪表盘）
   * ═══════════════════════════════════════════════════════ */
  routes["#dashboard"] = function () {
    return '<div>' +
      '<div class="stats-row">' +
        '<div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-value" id="productCount">-</div><div class="stat-label">产品总数</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon">🌤️</div><div class="stat-info"><div class="stat-value">13</div><div class="stat-label">武汉区域数</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon">👤</div><div class="stat-info"><div class="stat-value" id="userCount">-</div><div class="stat-label">当前在线</div></div></div>' +
      '</div>' +
      '<div class="card"><div class="card-header">' +
        '<span>🏙️ 武汉市随机区域天气</span>' +
        '<button class="btn btn-primary btn-sm" id="btnRefreshWeather">🔄 随机刷新</button>' +
      '</div><div class="card-body"><div class="weather-grid" id="weatherGrid">' +
        '<div class="empty"><div class="spinner"></div><p>加载天气数据中...</p></div>' +
      '</div></div></div></div>';
  };

  _after["#dashboard"] = function () {
    // 加载统计
    api.products().then(function (r) { if (r.code === 200) document.getElementById("productCount").textContent = r.data.total || 0; });
    api.user().then(function (r) { if (r.code === 200) document.getElementById("userCount").textContent = 1; });

    // 加载随机天气
    loadHomeWeather();
    document.getElementById("btnRefreshWeather").onclick = loadHomeWeather;
  };

  function loadHomeWeather() {
    var grid = document.getElementById("weatherGrid");
    if (!grid) return;
    grid.innerHTML = '<div class="empty"><div class="spinner"></div><p>加载中...</p></div>';
    api.homeWeather(5).then(function (r) {
      if (r.code !== 200 || !r.data) { grid.innerHTML = '<div class="empty"><p>加载失败</p></div>'; return; }
      var data = r.data.weather_data || [];
      if (!data.length) { grid.innerHTML = '<div class="empty"><p>暂无数据</p></div>'; return; }
      grid.innerHTML = data.map(function (w, i) {
        var icon = weatherEmoji(w.weather);
        var animateClass = ["wc-fade-1", "wc-fade-2", "wc-fade-3", "wc-fade-4", "wc-fade-5"][i];
        return '<div class="weather-card ' + animateClass + '">' +
          '<div class="wc-header"><span class="wc-name">' + w.name + '</span><span class="wc-icon">' + icon + '</span></div>' +
          '<div class="wc-body"><span class="wc-temp">' + (typeof w.temp_max === 'number' ? w.temp_max.toFixed(0) + '°' : w.temp_max || '--°') + '</span>' +
          '<span class="wc-desc">' + (w.weather || '未知') + '</span></div>' +
          '<div class="wc-details">' +
          '<span class="wc-detail">最低 <b>' + (typeof w.temp_min === 'number' ? w.temp_min.toFixed(0) + '°C' : w.temp_min || '--') + '</b></span>' +
          '<span class="wc-detail">湿度 <b>' + (w.humidity !== '--' ? w.humidity + '%' : '--') + '</b></span>' +
          '<span class="wc-detail">风力 <b>' + (w.wind_speed || '--') + '</b></span>' +
          '</div></div>';
      }).join("");
    }).catch(function () { grid.innerHTML = '<div class="empty"><p>网络错误</p></div>'; });
  }

  function weatherEmoji(text) {
    if (!text) return "🌤️";
    if (/晴/.test(text)) return "☀️";
    if (/云/.test(text)) return "⛅";
    if (/雨|阵雨/.test(text)) return "🌧️";
    if (/雪/.test(text)) return "❄️";
    if (/阴/.test(text)) return "☁️";
    if (/雾|霾/.test(text)) return "🌫️";
    if (/雷/.test(text)) return "⛈️";
    if (/暴/.test(text)) return "⛈️";
    return "🌤️";
  }

  /* ═══════════════════════════════════════════════════════
   *  天气管理页
   * ═══════════════════════════════════════════════════════ */
  routes["#weather"] = function () {
    return '<div class="card"><div class="card-header" style="background:#1890ff;color:#fff;">🔍 天气查询</div><div class="card-body">' +
      '<div id="queryForm" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="form-group" style="flex:1;min-width:180px;"><label>省份</label><select id="selProvince"><option value="">加载中...</option></select></div>' +
      '<div class="form-group" style="flex:1;min-width:180px;"><label>城市</label><select id="selCity" disabled><option value="">请先选择省份</option></select></div>' +
      '<div class="form-group" style="flex:1;min-width:180px;"><label>区县</label><select id="selDistrict" disabled><option value="">请先选择城市</option></select></div>' +
      '<div class="form-group" style="min-width:120px;"><button class="btn btn-primary" id="btnQuery">查询天气</button></div></div></div></div>' +
      '<div class="card"><div class="card-header"><span id="resultTitle">🌤️ 天气结果</span><span style="font-weight:400;font-size:13px;color:#9ca3af;" id="resultCount"></span></div>' +
      '<div class="card-body" id="resultBody" style="padding:0;"><div class="empty"><p>⏳ 正在加载武汉各区天气...</p></div></div></div>';
  };

  _after["#weather"] = function () {
    var selP = document.getElementById("selProvince"), selC = document.getElementById("selCity");
    var selD = document.getElementById("selDistrict"), btnQ = document.getElementById("btnQuery");

    api.provinces().then(function (r) {
      if (r.code === 200) selP.innerHTML = '<option value="">-- 选择省份 --</option>' +
        r.data.provinces.map(function (p) { return '<option value="' + p.name + '">' + p.name + '</option>'; }).join("");
    }).catch(function () { selP.innerHTML = '<option value="">加载失败</option>'; });

    selP.onchange = async function () {
      selC.innerHTML = '<option value="">加载中...</option>'; selC.disabled = !selP.value;
      selD.innerHTML = '<option value="">请先选择城市</option>'; selD.disabled = true;
      if (!selP.value) return;
      try {
        var r = await api.cities(selP.value);
        if (r.code === 200) selC.innerHTML = '<option value="">-- 选择城市 --</option>' +
          r.data.cities.map(function (c) { return '<option value="' + c.name + '" data-hasd="' + (c.has_districts || false) + '">' + c.name + '</option>'; }).join("");
      } catch (e) { selC.innerHTML = '<option value="">加载失败</option>'; }
    };
    selC.onchange = async function () {
      selD.innerHTML = '<option value="">请先选择城市</option>'; selD.disabled = true;
      if (!selC.value) return;
      var opt = selC.selectedOptions[0];
      if (opt.dataset.hasd !== "true") { selD.innerHTML = '<option value="">该城市无区县数据</option>'; return; }
      selD.innerHTML = '<option value="">加载中...</option>'; selD.disabled = false;
      try {
        var r = await api.districts(selC.value);
        if (r.code === 200) selD.innerHTML = '<option value="">-- 选择区县（可选）--</option>' +
          r.data.districts.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join("");
      } catch (e) { selD.innerHTML = '<option value="">加载失败</option>'; }
    };
    btnQ.onclick = doQuery;

    async function doQuery() {
      var params = {};
      if (selP.value) params.province = selP.value;
      if (selC.value) params.city = selC.value;
      if (selD.value) params.district = selD.value;
      var body = document.getElementById("resultBody");
      body.innerHTML = '<div class="empty"><div class="spinner"></div><p>查询中...</p></div>';
      try { var r = await api.weather(params); } catch (e) { body.innerHTML = '<div class="empty"><p>网络请求失败</p></div>'; return; }
      var title = document.getElementById("resultTitle"), count = document.getElementById("resultCount");
      if (r.code !== 200) { if (title) title.textContent = "🌤️ 天气结果"; if (count) count.textContent = ""; body.innerHTML = '<div class="empty"><p>' + (r.message || "未知错误") + '</p></div>'; return; }
      var data = r.data && r.data.weather_data, info = r.data && r.data.query_info;
      if (title && info) title.textContent = "🌤️ " + info.name + " 天气";
      if (count && r.data) count.textContent = "（共 " + (r.data.total || 0) + " 条）";
      if (!data || !data.length) { body.innerHTML = '<div class="empty"><p>暂无天气数据</p></div>'; return; }
      body.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
        '<th>#</th><th>地区</th><th>是否晴天</th><th>天气</th><th>湿度</th><th>气温范围</th><th>风力</th><th>时间</th></tr></thead><tbody>' +
        data.map(function (w, i) {
          var now = new Date(), ts = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
          return '<tr><td>' + (i+1) + '</td><td><strong>' + (w.name||'未知') + '</strong></td>' +
            '<td><span class="badge ' + (w.is_sunny?'badge-success':'badge-secondary') + '">' + (w.is_sunny?'☀️ 晴天':'☁️ 非晴天') + '</span></td>' +
            '<td>' + weatherEmoji(w.weather) + ' ' + (w.weather||'未知') + '</td>' +
            '<td>' + (typeof w.humidity==='number'?w.humidity+'%<div class="progress"><div class="progress-bar" style="width:'+Math.min(100,w.humidity)+'%"></div></div>':(w.humidity||'--')) + '</td>' +
            '<td><span style="color:#ff4d4f;font-weight:600;">'+(w.temp_max||'--')+'°C</span> / <span style="color:#1890ff;font-weight:600;">'+(w.temp_min||'--')+'°C</span></td>' +
            '<td>'+(w.wind_speed||'--')+' km/h</td><td style="font-size:12px;color:#9ca3af;">'+ts+'</td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    doQuery();
  };

  /* ── 页面状态管理 ────────────────────────── */
  var pageState = {};

  /* ═══════════════════════════════════════════════════════
   *  产品管理页
   * ═══════════════════════════════════════════════════════ */
  routes["#products"] = function () {
    return '<div class="card"><div class="card-body">' +
      // 筛选区域
      '<div class="filter-area" style="background:#f9fafb;padding:20px 24px;border-radius:10px;margin-bottom:20px;border:1px solid #eee;">' +
        // 始终可见行
        '<div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;">' +
          '<div class="form-group" style="flex:1;min-width:180px;margin:0;"><label>产品名称</label><input type="text" id="filterProdName" placeholder="请输入产品名称"></div>' +
          '<div class="form-group" style="flex:1;min-width:180px;margin:0;"><label>产品编号</label><input type="text" id="filterProdCode" placeholder="请输入产品编号"></div>' +
          '<div class="form-group" style="flex:1.4;min-width:240px;margin:0;"><label>创建时间</label><div style="display:flex;align-items:center;gap:6px;">' +
            '<input type="text" id="filterStartDate" placeholder="开始日期" style="flex:1;"><span style="color:#999;">—</span><input type="text" id="filterEndDate" placeholder="结束日期" style="flex:1;">' +
          '</div></div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0;padding-bottom:1px;">' +
            '<button class="btn btn-primary" id="btnSearchProd" style="padding:9px 20px;">查询</button>' +
            '<button class="btn btn-outline" id="btnResetProd" style="padding:9px 20px;">重置</button>' +
            '<button class="btn btn-outline" id="btnExpandProd" style="padding:7px 14px;font-size:12px;">展开 ▼</button>' +
          '</div>' +
        '</div>' +
        // 可折叠行
        '<div id="filterExtraRow" style="display:none;align-items:flex-end;gap:16px;flex-wrap:wrap;padding-top:16px;margin-top:16px;border-top:1px dashed #e0e0e0;">' +
          '<div class="form-group" style="flex:0.9;min-width:150px;margin:0;"><label>培训类型</label><select id="filterTrainType"><option value="">请选择</option><option value="集中培训">集中培训</option><option value="在线学习">在线学习</option><option value="混合培训">混合培训</option></select></div>' +
          '<div class="form-group" style="flex:0.9;min-width:150px;margin:0;"><label>培训模式</label><select id="filterTrainMode"><option value="">请选择</option><option value="线上">线上</option><option value="线下">线下</option><option value="线上+线下">线上+线下</option></select></div>' +
          '<div class="form-group" style="flex:1;min-width:180px;margin:0;"><label>培训主题</label><input type="text" id="filterTrainSubject" placeholder="请输入培训主题"></div>' +
          '<div class="form-group" style="flex:0.8;min-width:140px;margin:0;"><label>适用学段</label><select id="filterGrade"><option value="">请选择</option><option value="小学">小学</option><option value="初中">初中</option><option value="高中">高中</option><option value="大学">大学</option><option value="成人">成人</option></select></div>' +
          '<div class="form-group" style="flex:0.8;min-width:140px;margin:0;"><label>适用学科</label><select id="filterSubject"><option value="">请选择</option><option value="语文">语文</option><option value="数学">数学</option><option value="英语">英语</option><option value="信息技术">信息技术</option><option value="综合">综合</option></select></div>' +
          '<div class="form-group" style="flex:0.8;min-width:140px;margin:0;"><label>适用岗位</label><select id="filterPosition"><option value="">请选择</option><option value="管理岗">管理岗</option><option value="技术岗">技术岗</option><option value="运营岗">运营岗</option><option value="销售岗">销售岗</option><option value="全员">全员</option></select></div>' +
        '</div>' +
      '</div>' +
      // 工具栏
      '<div class="table-toolbar" style="margin-bottom:16px;">' +
        '<div class="toolbar-left" style="font-size:14px;color:#666;"><span id="productTotal">共 0 条</span></div>' +
        '<div class="toolbar-right" style="display:flex;gap:10px;">' +
          '<button class="btn btn-outline btn-sm" id="btnExportProd">📤 导出</button>' +
          '<button class="btn btn-primary btn-sm" id="btnNewProd">➕ 新建产品</button>' +
        '</div>' +
      '</div>' +
      // 表格
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>产品信息 <span title="产品基本信息" style="cursor:pointer;color:#999;">ⓘ</span></th>' +
      '<th>培训对象 <span title="目标学员群体" style="cursor:pointer;color:#999;">ⓘ</span></th>' +
      '<th>培训主题</th><th>培训地点</th><th>课程数</th><th>产品状态</th><th>创建时间</th><th>操作</th>' +
      '</tr></thead><tbody id="productTbody"><tr><td colspan="8"><div class="empty"><div class="spinner"></div><p>加载中...</p></div></td></tr></tbody></table></div>' +
      '<div class="pagination" id="productPagination"></div></div></div>' +
      '<div class="modal-overlay" id="productModal"><div class="modal-box" id="productModalContent"></div></div>';
  };

  _after["#products"] = function () {
    pageState.products = { all: [], filtered: [], page: 1 };

    api.products().then(function (r) {
      if (r.code !== 200) { document.getElementById("productTbody").innerHTML = '<tr><td colspan="8"><div class="empty"><p>加载失败</p></div></td></tr>'; return; }
      pageState.products.all = r.data.products || [];
      pageState.products.filtered = pageState.products.all.slice();
      document.getElementById("productTotal").textContent = '共 ' + pageState.products.all.length + ' 条';
      renderProductTable();
    });

    // 查询按钮
    document.getElementById("btnSearchProd").onclick = function () {
      applyProductFilter();
      renderProductTable();
    };
    // 重置按钮
    document.getElementById("btnResetProd").onclick = function () {
      document.getElementById("filterProdName").value = "";
      document.getElementById("filterProdCode").value = "";
      document.getElementById("filterStartDate").value = "";
      document.getElementById("filterEndDate").value = "";
      document.getElementById("filterTrainType").value = "";
      document.getElementById("filterTrainMode").value = "";
      document.getElementById("filterTrainSubject").value = "";
      document.getElementById("filterGrade").value = "";
      document.getElementById("filterSubject").value = "";
      document.getElementById("filterPosition").value = "";
      pageState.products.filtered = pageState.products.all.slice();
      pageState.products.page = 1;
      renderProductTable();
    };
    // 展开/收起按钮
    document.getElementById("btnExpandProd").onclick = function () {
      var row = document.getElementById("filterExtraRow");
      var btn = document.getElementById("btnExpandProd");
      if (row.style.display === "none" || row.style.display === "") {
        row.style.display = "flex";
        btn.innerHTML = "收起 ▲";
      } else {
        row.style.display = "none";
        btn.innerHTML = "展开 ▼";
      }
    };
    // 初始隐藏额外行
    document.getElementById("filterExtraRow").style.display = "none";
    // 导出按钮
    document.getElementById("btnExportProd").onclick = function () {
      alert("导出功能开发中...");
    };
    // 新建产品按钮
    document.getElementById("btnNewProd").onclick = function () {
      alert("新建产品功能开发中...");
    };
    // 弹窗关闭
    document.getElementById("productModal").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("show"); });
  };

  function applyProductFilter() {
    var name = (document.getElementById("filterProdName").value || "").toLowerCase();
    var code = (document.getElementById("filterProdCode").value || "").toLowerCase();
    var trainType = document.getElementById("filterTrainType").value;
    var trainMode = document.getElementById("filterTrainMode").value;
    var trainSubject = (document.getElementById("filterTrainSubject").value || "").toLowerCase();
    var grade = document.getElementById("filterGrade").value;
    var subject = document.getElementById("filterSubject").value;
    var position = document.getElementById("filterPosition").value;
    pageState.products.filtered = pageState.products.all.filter(function (p) {
      if (name && !p.name.toLowerCase().includes(name)) return false;
      if (code && !(p.productCode || "").toLowerCase().includes(code)) return false;
      if (trainType && p.trainingType !== trainType) return false;
      if (trainMode && p.trainingMode !== trainMode) return false;
      if (trainSubject && !(p.trainingSubject || "").toLowerCase().includes(trainSubject)) return false;
      if (grade && p.grade !== grade) return false;
      if (subject && p.subject !== subject) return false;
      if (position && p.position !== position) return false;
      return true;
    });
    pageState.products.page = 1;
    document.getElementById("productTotal").textContent = '共 ' + pageState.products.filtered.length + ' 条';
  }

  function renderProductTable() {
    var s = pageState.products, tbody = document.getElementById("productTbody");
    var start = (s.page - 1) * 10, items = s.filtered.slice(start, start + 10);
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><p>暂无数据</p></div></td></tr>'; return; }
    tbody.innerHTML = items.map(function (p) {
      return '<tr>' +
        '<td>' + renderProductInfo(p) + '</td>' +
        '<td>' + renderTarget(p) + '</td>' +
        '<td>' + (p.trainingSubject || '--') + '</td>' +
        '<td>' + (p.trainingLocation || '--') + '</td>' +
        '<td><span class="badge badge-success">' + (p.courseCount || 0) + ' 门</span></td>' +
        '<td>' + statusToggle({status: p.status}) + '</td>' +
        '<td>' + (p.createdAt || '--') + '</td>' +
        '<td>' + productActions(p) + '</td></tr>';
    }).join("");
    renderProductPagination();
  }

  function renderProductInfo(p) {
    var tags = [];
    if (p.trainingType) tags.push('<span class="tag tag-blue">' + p.trainingType + '</span>');
    if (p.trainingMode) tags.push('<span class="tag tag-green">' + p.trainingMode + '</span>');
    return '<div style="display:flex;align-items:flex-start;gap:10px;">' +
      '<img src="' + (p.image || '') + '" alt="" style="width:48px;height:36px;border-radius:4px;object-fit:cover;background:#f0f0f0;flex-shrink:0;" onerror="this.style.display=\'none\'">' +
      '<div>' +
        '<div style="font-size:12px;color:#999;">编号：' + (p.productCode || '--') + '</div>' +
        '<div style="font-weight:500;color:#1f2937;margin:2px 0;">' + (p.name || '--') + '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;">' + tags.join('') + '</div>' +
      '</div></div>';
  }

  function renderTarget(p) {
    if (!p.trainingTarget) return '--';
    return '<div style="display:flex;flex-wrap:wrap;gap:4px;">' +
      p.trainingTarget.split('、').map(function (t) {
        return '<span style="display:inline-block;background:#f0f5ff;color:#1890ff;padding:2px 8px;border-radius:4px;font-size:12px;">' + t + '</span>';
      }).join('') + '</div>';
  }

  function productActions(p) {
    return '<div class="btn-group" style="gap:4px;">' +
      '<button class="btn-link" onclick="window._viewProduct(' + p.id + ')">编辑</button>' +
      '<button class="btn-link">复制</button>' +
      '<button class="btn-link">新建课程</button>' +
      '</div>';
  }

  function renderProductPagination() {
    var s = pageState.products, total = Math.ceil(s.filtered.length / 10);
    var pag = document.getElementById("productPagination");
    if (total <= 1) { pag.innerHTML = ""; return; }
    var html = '<button ' + (s.page === 1 ? "disabled" : "") + ' onclick="window._productPage(' + (s.page - 1) + ')">上一页</button>';
    for (var i = 1; i <= total; i++) html += '<button class="' + (i === s.page ? "active" : "") + '" onclick="window._productPage(' + i + ')">' + i + '</button>';
    html += '<button ' + (s.page === total ? "disabled" : "") + ' onclick="window._productPage(' + (s.page + 1) + ')">下一页</button>';
    pag.innerHTML = html;
  }
  window._productPage = function (p) { pageState.products.page = p; renderProductTable(); };

  /* ── 共享组件函数 ───────────────────────── */

  function statusToggle(c) {
    var checked = c.status === "active" ? " checked" : "";
    return '<label class="toggle-switch"><input type="checkbox" ' + checked + '><span class="toggle-slider"></span></label>' +
      '<span style="margin-left:6px;font-size:12px;color:' + (c.status === "active" ? "#52c41a" : "#999") + ';">' + (c.status === "active" ? "已上架" : "已下架") + '</span>';
  }

  window._viewProduct = function (id) {
    api.products().then(function (r) {
      if (r.code !== 200) return;
      var p = r.data.products.find(function (x) { return x.id === id; });
      if (!p) return;
      var content = document.getElementById("productModalContent");
      content.innerHTML = '<h3>📦 产品详情</h3>' +
        '<div class="info-row"><span class="info-label">产品名称</span><span class="info-value">' + p.name + '</span></div>' +
        '<div class="info-row"><span class="info-label">培训对象</span><span class="info-value">' + p.trainingTarget + '</span></div>' +
        '<div class="info-row"><span class="info-label">培训主题</span><span class="info-value">' + p.trainingSubject + '</span></div>' +
        '<div class="info-row"><span class="info-label">培训地点</span><span class="info-value">' + p.trainingLocation + '</span></div>' +
        '<div class="info-row"><span class="info-label">课程数</span><span class="info-value"><span class="badge badge-success">' + p.courseCount + ' 门</span></span></div>' +
        '<div class="info-row"><span class="info-label">产品状态</span><span class="info-value"><span class="badge ' + (p.status === 'active' ? 'badge-success' : 'badge-secondary') + '">' + (p.status === 'active' ? '已上架' : '已下架') + '</span></span></div>' +
        '<div class="info-row"><span class="info-label">创建时间</span><span class="info-value">' + p.createdAt + '</span></div>' +
        '<div class="info-row"><span class="info-label">产品描述</span><span class="info-value">' + (p.description || '无') + '</span></div>' +
        '<div style="text-align:right;margin-top:16px;"><button class="btn btn-outline btn-sm" onclick="document.getElementById(\'productModal\').classList.remove(\'show\')">关闭</button></div>';
      document.getElementById("productModal").classList.add("show");
    });
  };

  /* ═══════════════════════════════════════════════════════
   *  启动
   * ═══════════════════════════════════════════════════════ */
  var hash = window.location.hash || "#login";
  if (localStorage.getItem("token") && (hash === "#login" || hash === "#register")) hash = "#dashboard";
  if (!routes[hash]) hash = "#login";
  render(hash);
})();
